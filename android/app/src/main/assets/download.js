(function (token, url, limit) {
    if (location.origin !== 'https://posewear.pages.dev' || window !== window.top) return false;

    const abort = new AbortController();
    // Begin reading before the page revokes its temporary blob URL.
    const result = fetch(url, { signal: abort.signal }).then(response => {
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
    });
    result.catch(() => {});
    const listenerTimeout = setTimeout(() => {
        window.removeEventListener('message', accept);
        abort.abort();
    }, 5000);

    function accept(event) {
        if (event.data !== token || !event.ports[0]) return;
        window.removeEventListener('message', accept);
        clearTimeout(listenerTimeout);
        send(event.ports[0]);
    }

    async function send(port) {
        function acknowledged(text) {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('Save timed out')), 15000);
                port.onmessage = event => {
                    clearTimeout(timer);
                    if (event.data === 'ok') resolve();
                    else reject(new Error('Save failed'));
                };
                port.postMessage(text);
            });
        }
        try {
            const blob = await result;
            if (!blob.size || blob.size > limit) throw new Error('Download size unsupported');
            await acknowledged('meta:' + JSON.stringify({ type: blob.type, size: blob.size }));
            const chunkSize = 48 * 1024;
            for (let offset = 0; offset < blob.size; offset += chunkSize) {
                const bytes = new Uint8Array(await blob.slice(offset, offset + chunkSize).arrayBuffer());
                let binary = '';
                for (const byte of bytes) binary += String.fromCharCode(byte);
                await acknowledged('chunk:' + btoa(binary));
            }
            port.postMessage('done');
        } catch (_) {
            try { port.postMessage('error'); } catch (_) {}
        }
    }

    window.addEventListener('message', accept);
    return true;
})
