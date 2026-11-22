param(
    [string]$Sdk = (Join-Path $env:USERPROFILE '.posewear-android\sdk'),
    [string]$Output = (Join-Path $PSScriptRoot 'build\PoseWear-1.0.0.apk')
)

$ErrorActionPreference = 'Stop'
$profileRoot = Join-Path $env:USERPROFILE '.posewear-android'
$buildTools = Join-Path $Sdk 'build-tools\36.0.0'
$androidJar = Join-Path $Sdk 'platforms\android-36\android.jar'
$signingDirectory = Join-Path $profileRoot 'signing'
$keyStore = Join-Path $signingDirectory 'posewear.p12'
$passwordFile = Join-Path $signingDirectory 'posewear-password.dpapi'
$alias = 'posewear-release'

function Invoke-Checked([string]$Tool, [string[]]$Arguments) {
    & $Tool @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Tool exited with code $LASTEXITCODE"
    }
}

function Get-JdkTool([string]$Name) {
    if ($env:JAVA_HOME) {
        $candidate = Join-Path $env:JAVA_HOME "bin\$Name.exe"
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }
    return (Get-Command "$Name.exe" -ErrorAction Stop).Source
}

$javac = Get-JdkTool 'javac'
$jar = Get-JdkTool 'jar'
$keytool = Get-JdkTool 'keytool'
$aapt2 = Join-Path $buildTools 'aapt2.exe'
$d8 = Join-Path $buildTools 'd8.bat'
$zipalign = Join-Path $buildTools 'zipalign.exe'
$apksigner = Join-Path $buildTools 'apksigner.bat'
foreach ($required in @($androidJar, $aapt2, $d8, $zipalign, $apksigner)) {
    if (!(Test-Path -LiteralPath $required -PathType Leaf)) { throw "Missing SDK file: $required" }
}

$stage = Join-Path (Join-Path $profileRoot 'work') ([guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $stage -Force
$null = New-Item -ItemType Directory -Path $signingDirectory -Force
$null = New-Item -ItemType Directory -Path (Split-Path -Parent $Output) -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'app\src\main') -Destination (Join-Path $stage 'source') -Recurse
$hadKey = Test-Path -LiteralPath $keyStore -PathType Leaf
$hadPassword = Test-Path -LiteralPath $passwordFile -PathType Leaf
if ($hadKey -ne $hadPassword) { throw 'Incomplete PoseWear signing material. Restore the matching files before building an update.' }

$previousPassword = $env:POSEWEAR_APK_STOREPASS
Push-Location -LiteralPath $stage
try {
    $null = New-Item -ItemType Directory -Path 'classes', 'dex', 'generated'
    Invoke-Checked $aapt2 @('compile', '--dir', 'source/res', '-o', 'compiled.zip')
    Invoke-Checked $aapt2 @('link', '-o', 'package.apk', '-I', $androidJar, '--manifest', 'source/AndroidManifest.xml', '-A', 'source/assets', '--java', 'generated', 'compiled.zip')
    $javaSources = @(Get-ChildItem -LiteralPath 'source/java', 'generated' -Filter '*.java' -File -Recurse | ForEach-Object { $_.FullName })
    Invoke-Checked $javac (@('-encoding', 'UTF-8', '--release', '11', '-classpath', $androidJar, '-d', 'classes') + $javaSources)
    Invoke-Checked $jar @('--create', '--file', 'classes.jar', '-C', 'classes', '.')
    Invoke-Checked $d8 @('--release', '--min-api', '29', '--lib', $androidJar, '--output', 'dex', 'classes.jar')
    Invoke-Checked $jar @('--update', '--file', 'package.apk', '-C', 'dex', 'classes.dex')
    Invoke-Checked $zipalign @('-P', '16', '-f', '4', 'package.apk', 'aligned.apk')

    if (!$hadKey) {
        $env:POSEWEAR_APK_STOREPASS = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
        $encrypted = ConvertTo-SecureString $env:POSEWEAR_APK_STOREPASS -AsPlainText -Force | ConvertFrom-SecureString
        $stagingKey = Join-Path $stage 'new-posewear.p12'
        Invoke-Checked $keytool @('-genkeypair', '-keystore', $stagingKey, '-storetype', 'PKCS12', '-storepass:env', 'POSEWEAR_APK_STOREPASS', '-alias', $alias, '-keyalg', 'RSA', '-keysize', '2048', '-validity', '12000', '-dname', 'CN=PoseWear Local Release', '-noprompt')
        Copy-Item -LiteralPath $stagingKey -Destination $keyStore
        Set-Content -LiteralPath $passwordFile -Value $encrypted -Encoding ASCII -NoNewline
    } else {
        $securePassword = Get-Content -LiteralPath $passwordFile -Raw | ConvertTo-SecureString
        $env:POSEWEAR_APK_STOREPASS = [System.Net.NetworkCredential]::new('', $securePassword).Password
    }
    Invoke-Checked $apksigner @('sign', '--ks', $keyStore, '--ks-key-alias', $alias, '--ks-pass', 'env:POSEWEAR_APK_STOREPASS', '--out', 'signed.apk', 'aligned.apk')
    Invoke-Checked $zipalign @('-c', '-P', '16', '4', 'signed.apk')
    Invoke-Checked $apksigner @('verify', '--verbose', '--print-certs', 'signed.apk')
    Invoke-Checked $aapt2 @('dump', 'badging', 'signed.apk')
    Copy-Item -LiteralPath (Join-Path $stage 'signed.apk') -Destination $Output
    Get-FileHash -LiteralPath $Output -Algorithm SHA256
} finally {
    $env:POSEWEAR_APK_STOREPASS = $previousPassword
    Pop-Location
    $resolvedStage = (Resolve-Path -LiteralPath $stage).Path
    $resolvedWork = (Resolve-Path -LiteralPath (Join-Path $profileRoot 'work')).Path
    if ((Split-Path -Parent $resolvedStage) -eq $resolvedWork -and (Split-Path -Leaf $resolvedStage) -match '^[a-f0-9]{32}$') {
        Remove-Item -LiteralPath $resolvedStage -Recurse -Force
    }
}
