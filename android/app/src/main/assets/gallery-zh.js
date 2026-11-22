(() => {
    'use strict';
    if (location.origin !== 'https://posewear.pages.dev' || window !== window.top || window.__pwGalleryZh) return;
    const app = window.APP;
    const grid = document.getElementById('grid');
    const lightbox = document.getElementById('lb');
    const side = document.getElementById('lbSide');
    if (!app?.ITEMS || !app.st || typeof app.li !== 'function' || !grid || !lightbox || !side) return;
    window.__pwGalleryZh = true;

    // Exact English source fingerprints bind translations to a record AND its source revision.
    // Pinned published assets: dynasties.3b06c6a695, scenes.7150754a14, lights.efac67b822,
    // props.d7e82c46c9, furniture.36317c37f0. See embedded entries below.
    const richChinese = {
        "dyn:C001": ["zqlhpu", "商代男式上衣下裳：黄褐丝质交领上衣及臀，直管窄袖，领袖织黑边；黑色褶裳及踝，正中宽腰带上垂黄褐色矩形蔽膝至膝。"],
        "dyn:C002": ["1kqhzhq", "商代男式上衣下裳：赭红丝质交领上衣及臀，直管窄袖，领袖织黑边；黑色褶裳及踝，正中宽腰带上垂赭红色矩形蔽膝至膝。"],
        "dyn:C003": ["x08ltb", "西汉女式连身深衣，赭褐丝绸曳地，交领，宽袖收口，领袖、下摆和前襟镶宽黑边；延长裁片贴身盘绕，襟缘从腰际斜向后身，系窄黑带。"],
        "dyn:C004": ["1a2jhke", "西汉女式连身深衣，青绿丝绸曳地，交领，宽袖收口，领袖、下摆和前襟镶宽朱边；延长裁片贴身盘绕，襟缘从腰际斜向后身，系窄朱带。"],
        "dyn:C005": ["1o6q4d", "汉代男式玄色丝质连身深衣及踝，交领，宽袖收口；前襟沿身侧垂直落下而不盘绕，领袖、襟边和下摆镶宽朱边，配腰带。"],
        "dyn:C006": ["1mv5cd7", "汉代男式暖褐丝质连身深衣及踝，交领，宽袖收口；前襟沿身侧垂直落下而不盘绕，领袖、襟边和下摆镶宽黑边，配腰带。"],
        "dyn:C008": ["1i33vpu", "魏晋女装：天青丝质大袖衫敞襟，极宽袖、平行领缘，内搭交领短衫；间色裙曳地，墨蓝与象牙白竖幅相间，高腰系窄带。"],
        "dyn:C009": ["t3jlr0", "魏晋女装：白色交领宽袖上衣配曳地墨蓝长裙；腰带下层叠垂挂红色三角布片，如燕尾，布片下另垂细长红带近裙边。"],
        "dyn:C010": ["1xls3g0", "魏晋文士装：宽大的月白苎麻交领袍及踝，极宽袖低垂；自然腰位系很宽的黑带，带尾长垂。"],
        "dyn:C011": ["judeei", "魏晋文士装：宽大的苍灰丝质交领袍及踝，极宽袖低垂；自然腰位系很宽的深靛蓝带，带尾长垂。"],
        "dyn:C012": ["um98j7", "唐式石榴红丝裙在锁骨下、胸部上方束系，正中打结，裙身垂直到地；象牙白短襦只露交领与窄袖，淡青缥缈丝质披帛横披背部、垂过双袖；腰际无系带，无盘扣。"],
        "dyn:C013": ["12fu9bi", "唐式藕荷丝裙在锁骨下、胸部上方束系，正中打结，裙身垂直到地；浅月白短襦只露交领与窄袖，浅紫薄丝披帛横披背部、垂过双袖；腰际无系带，无盘扣。"],
        "dyn:C016": ["gbv2m8", "唐代男式赭黄斜纹丝质圆领袍在右肩扣合，窄袖贴身，臀下两侧开衩，袍长至小腿中段；黑皮带饰金属方銙，配及膝黑皮靴。"],
        "dyn:C017": ["m8r9j3", "唐代男式绯红斜纹丝质圆领袍在右肩扣合，窄袖贴身，臀下两侧开衩，袍长至小腿中段；黑皮带饰金属方銙，配及膝黑皮靴。"],
        "dyn:C018": ["1sp1lex", "晚唐女式礼服：淡金透明长纱衫敞穿，宽大袖过膝；内搭高束至胸的绛红齐胸裙，双臂披海绿色长披帛，薄纱下透见内裙。"],
        "dyn:C019": ["rpnmcj", "晚唐女式礼服：淡蓝透明长纱衫敞穿，宽大袖过膝；内搭高束至胸的月白齐胸裙，双臂披淡紫长披帛，薄纱下透见内裙。"],
        "dyn:C020": ["1cc6y0z", "宋式月白丝质褙子及膝，直领对襟无扣、窄袖，臀下开长衩，素色领缘无绣；内穿粉色裹胸与灰蓝阔腿直裤，裤脚及踝不收口。"],
        "dyn:C021": ["ujqn71", "宋式天水碧丝质褙子及膝，直领对襟无扣、窄袖，臀下开长衩，素色领缘无绣；内穿象牙白裹胸与浅米色阔腿直裤，裤脚及踝不收口。"],
        "dyn:C022": ["1s1u00y", "宋式檀粉色及臀短衫，交领窄袖；内搭浅米色曳地百迭裙，周身压细密单向褶，自然腰位系窄带。"],
        "dyn:C023": ["1hb40b2", "宋式浅靛青及臀短衫，交领窄袖；内搭象牙白曳地百迭裙，周身压细密单向褶，自然腰位系窄带。"],
        "dyn:C024": ["vxbe02", "宋代男式茶褐交领直裰及踝，宽袖，后中有缝，两侧不开衩，黑色领缘撞色；配窄腰带和黑布鞋。"],
        "dyn:C025": ["1ijlnw8", "宋代男式鸦青交领直裰及踝，宽袖，后中有缝，两侧不开衩，白色领缘撞色；配窄腰带和黑布鞋。"],
        "dyn:C026": ["1w4e4b8", "宋代文士的米白圆领襕衫，宽袖；膝高处横缝黑襕，袖口与下摆镶黑边，配窄带和黑布鞋。"],
        "dyn:C027": ["1f6932h", "宋代文士的中蓝圆领襕衫，宽袖；膝高处横缝黑襕，袖口与下摆镶黑边，配窄带和黑布鞋。"],
        "dyn:C028": ["o3u1j6", "元代蒙古男式宝蓝丝质交领袍，窄袖、合体上身；宽腰部密缝细横褶，下接丰量百褶裙至小腿中段；领口织金边，穿黑皮靴。"],
        "dyn:C029": ["1hq0c5", "元代蒙古男式驼褐丝质交领袍，窄袖、合体上身；宽腰部密缝细横褶，下接丰量百褶裙至小腿中段；领口织金边，穿黑皮靴。"],
        "dyn:C030": ["16p9bnz", "明式靛蓝丝质长袄至大腿中段，右斜襟；两对圆金珠扣扣在竖领上，非肩扣或盘扣。琵琶袖下缘圆宽、收窄至袖口，无抽褶。朱红马面裙曳地，前裙门平整、仅两侧打褶，近下摆一条织金边。"],
        "dyn:C031": ["rrc6ry", "明式藕粉丝质长袄至大腿中段，右斜襟；两对圆金珠扣扣在竖领上，非肩扣或盘扣。琵琶袖下缘圆宽、收窄至袖口，无抽褶。松绿马面裙曳地，前裙门平整、仅两侧打褶，近下摆一条织金边。"],
        "dyn:C032": ["1mh5vr5", "明式葱绿交领短袄及臀，露白色内领，琵琶袖收窄。缃黄马面裙曳地，前裙门平、两侧有褶，近裙底配织金云纹膝襕。"],
        "dyn:C033": ["arpbm8", "明式素白交领短袄及臀，露白色内领，琵琶袖收窄。宝蓝马面裙曳地，前裙门平、两侧有褶，近裙底配织金云纹膝襕。"],
        "dyn:C034": ["yqou12", "明式石青无袖比甲，直边敞襟、过膝、侧开衩；内穿月白立领窄长袖袄，与曳地浅灰侧褶马面裙。"],
        "dyn:C035": ["1o0nhco", "明式青莲色无袖比甲，直边敞襟、过膝、侧开衩；内穿浅桃红立领窄长袖袄，与曳地象牙白侧褶马面裙。"],
        "dyn:C036": ["1glxahv", "明式男子宝蓝交领道袍及踝，露白内领，极宽袖收口，侧衩内折藏暗摆；系窄黑丝绦，穿黑布鞋。"],
        "dyn:C037": ["9r6to5", "明式男子浅驼色交领道袍及踝，露白内领，极宽袖收口，侧衩内折藏暗摆；系窄深褐丝绦，穿黑布鞋。"],
        "dyn:C038": ["qjhqr7", "明式男装大红交领曳撒，上身和裙分别裁剪、腰部相接；前裙中片平、两侧打褶，后裙全打褶；窄袖、腰缝织金带，配黑靴。"],
        "dyn:C039": ["p85a1g", "明式男装墨绿交领曳撒，上身和裙分别裁剪、腰部相接；前裙中片平、两侧打褶，后裙全打褶；窄袖、腰缝织金带，配黑靴。"],
        "dyn:C040": ["113npx6", "明代官员的绯红圆领袍及踝，极宽袖；胸前方形补子绣云浪间的鹤，腰间松围嵌玉硬腰带，穿黑靴。"],
        "dyn:C041": ["189w943", "明代官员的深青圆领袍及踝，极宽袖；胸前方形补子绣云浪间的鹤，腰间松围嵌玉硬腰带，穿黑靴。"],
        "dyn:C042": ["jyo2j5", "明式浅玉绿敞襟外衣，织细小云纹，短直领，胸前一对金属金扣；宽袖、长侧衩，衣长至小腿中段，内搭象牙白长裙。"],
        "dyn:C043": ["1re0j1b", "明式绛紫敞襟外衣，短直领，胸前一对金属金扣；宽袖、长侧衩，衣长至小腿中段，内搭浅粉长裙。"],
        "dyn:C044": ["yfj68z", "晚清满族女装：雪青暗花丝质氅衣直裁曳地，圆领大襟从领口弯向穿者右腋，再沿侧下行；黑金宽袖口，领、襟、衩、下摆镶多层宽黑金边，侧开高如意衩。"],
        "dyn:C045": ["tbx63o", "晚清满族女装：桃红丝质氅衣直裁曳地，圆领大襟从领口弯向穿者右腋，再沿侧下行；深蓝白宽袖口，领、襟、衩、下摆镶多层宽蓝白边，侧开高如意衩。"],
        "dyn:C046": ["1dt473h", "晚清男装：宝蓝立领长袍及踝，有弯襟至右腋、侧衩；玄色马褂及臀，正中直襟五枚布盘扣，宽短袖，配黑布鞋。"],
        "dyn:C047": ["qxmjr0", "晚清男装：浅灰立领长袍及踝，有弯襟至右腋、侧衩；藏青马褂及臀，正中直襟五枚布盘扣，宽短袖，配黑布鞋。"],
        "dyn:C048": ["1nesbvr", "晚清汉族女装：浅粉及臀短袄，低立领大襟弯向右腋，宽袖镶蓝色绣边；黑马面裙曳地，前裙门平、有绣纹，两侧打褶。"],
        "dyn:C049": ["2rhgs2", "晚清汉族女装：湖蓝及臀短袄，低立领大襟弯向右腋，宽袖镶白色绣边；红马面裙曳地，前裙门平、有绣纹，两侧打褶。"],
        "dyn:C050": ["75yb03", "20 世纪 20 年代直身宽松棉旗袍，阴丹士林蓝，裙长至小腿中段；低立领弯襟至右腋，以布盘扣固定，及肘喇叭袖，细白滚边。"],
        "dyn:C051": ["5jgyq2", "20 世纪 20 年代直身宽松棉旗袍，米白底蓝碎花，裙长至小腿中段；低立领弯襟至右腋，以布盘扣固定，及肘喇叭袖，细蓝滚边。"],
        "dyn:C052": ["l0dpwi", "20 世纪 30 年代孔雀蓝丝质修身旗袍，立领斜襟至右腋，黑盘扣、极短盖袖；裙长及小腿，两侧开衩至膝，领、襟和下摆滚细黑边。"],
        "dyn:C053": ["1j4zeab", "20 世纪 30 年代酒红暗花丝质修身旗袍，立领斜襟至右腋，金色盘扣、极短盖袖；裙长及小腿，两侧开衩至膝，领、襟和下摆滚细金边。"],
        "dyn:C054": ["1dpnqw2", "民国男式中灰棉布长衫及踝，立领弯襟至右腋，布盘扣固定；直长袖外翻白袖口，两侧开衩，配黑布鞋。"],
        "dyn:C055": ["v2v6ry", "民国男式藏青丝质长衫及踝，立领弯襟至右腋，布盘扣固定；直长袖外翻白袖口，两侧开衩，配黑布鞋。"],
        "dyn:C056": ["1mzxr29", "中灰羊毛男装，翻领在颈部扣合，前襟五扣，四个带扣袋盖的贴袋（胸部和下摆各两个），袖口三扣，配同色直筒裤和黑皮鞋。"],
        "dyn:C057": ["1vjzqb8", "藏青羊毛男装，翻领在颈部扣合，前襟五扣，四个带扣袋盖的贴袋（胸部和下摆各两个），袖口三扣，配同色直筒裤和黑皮鞋。"],
        "dyn:C058": ["13dh25w", "明式新娘装：大红丝质圆领大袖衫，金绣霞帔两条从肩头平行垂下，在胸前以金坠收尾；下配红马面裙，平裙门、侧褶、织金云纹宽襕；无头饰。"],
        "dyn:C059": ["1oa2qcd", "唐式新娘钗钿礼衣：深青绿交领大袖外袍，内叠朱红和墨绿曳地多层长裙，带长拖尾；胸上方束宽金带、垂长飘带，双臂披薄长披帛；无头饰。"],
        "dyn:C060": ["ymstp2", "明式新郎大红丝质圆领宽袖长袍及踝，胸前有金绣方补，嵌金銙硬腰带松围腰间，配黑靴，无帽。"],
        "scene:E001": ["qnze3a", "现代公寓客厅，白墙浅橡木地板。远墙靠放低背灰布三人沙发，上挂大幅空白画布；圆橡木茶几靠近沙发，落地灯立于右远角，左墙落地窗挂白纱帘，房间中央留空。"],
        "scene:E002": ["qnze3a", "现代公寓客厅，白墙浅橡木地板。远墙靠放低背灰布三人沙发，上挂大幅空白画布；圆橡木茶几靠近沙发，落地灯立于右远角，左墙落地窗挂白纱帘，房间中央留空。"],
        "scene:E003": ["1u6429v", "暖米白灰泥墙、深胡桃木地板；远墙的长低胡桃木沙发配象牙白靠垫，背后有几何格栅屏风；右墙月洞形木框，左侧木格高窗，两远角置纸灯，沙发旁配方茶几，中央留空。"],
        "scene:E004": ["hs4xr5", "浅灰米色墙、浅木地板；远侧双人床配低软包床头和白、燕麦色亚麻床品，两侧各有床头柜与小灯；左侧宽窗挂亚麻帘，右侧木衣柜，床尾留大块空地。"],
        "scene:E005": ["l2uj2y", "标准八叠榻榻米，左为纸障子，右为素面襖拉门；远墙床之间只摆一只插单枝的陶瓶，无挂轴。原木立柱和低木顶，中央榻榻米留空。"],
        "scene:E006": ["1gpahz9", "远墙排布哑白平板橱柜和浅石台面，右侧同材岛台，灶后白砖，开放搁架摆白餐具，远墙水槽上有窗；浅橡木地板，岛台左侧留空。"],
        "scene:E007": ["4rf7cg", "城市阳台铺灰色石砖，远边玻璃栏板配细金属顶扶手；两边摆赤陶盆栽，右边放圆金属小桌与两把椅子，栏外是虚化的普通中层城市楼群，无可识别天际线。"],
        "scene:E008": ["1xr5d1r", "白漆砖墙、浅水磨石地面；右墙浅橡木吧台上放钢制咖啡机，后方搁架摆白杯和无标签玻璃罐。左窗下三张圆大理石桌配曲木椅，后墙黑色菜单板无字、角落垂绿植，距镜头约 4 米的中央留空。"],
        "scene:E010": ["b9pxsd", "白墙及白色明装吊顶风管，抛光混凝土地面；两侧排浅橡木桌、关屏黑显示器与黑工作椅，端头放高盆栽。远处整幅落地窗外是普通楼群，无地标；距镜头约 4 米的中央通道留空。"],
        "scene:E011": ["1obpb8h", "高白顶，左墙有高拱窗；后墙及右墙为通顶深木书架，书脊无字。左窗下两张长木阅览桌配绿罩黄铜灯和空椅，距镜头约 4 米的中央木地板留空。"],
        "scene:E012": ["o1zrhv", "白墙、无缝浅灰抛光混凝土地面，白顶轨道射灯。远墙疏挂柔和蓝、赭、灰三幅色域画，右墙挂素面高画布，左墙靠低白凳；距镜头约 4 米的中央留空。"],
        "scene:E013": ["tnxfa5", "黑橡胶地面、深灰墙、外露黑顶和线灯。左侧面窗跑步机的屏幕关闭；右边排哑铃架和卧推凳，右远角有深蹲架，黑杠铃片无数字。距镜头约 4 米的中央留空。"],
        "scene:E014": ["1aa46lj", "浅枫木弹性地板、白墙，远墙通高镜面只映空舞室与对面白墙；左墙固定木把杆，右墙排高窗，右远角架上有小黑音箱；距镜头约 4 米的中央地板留空。"],
        "scene:E015": ["1mj1aap", "双层挑高，奶油色大理石地面和胡桃木墙板。右墙木质黄铜接待台背后留白，左侧沙发和扶手椅围茶几，顶挂黄铜环灯；远处玻璃双门与棕榈盆栽，距镜头约 4 米的中央留空。"],
        "scene:E017": ["hwhnk8", "视点在宽阔市街斑马线上，街道无车辆、自行车或行人。白线伸向对侧人行道，两边是六层常见楼房与行道树，远角灰杆装信号灯，无可识别天际线；距镜头约 4 米的中央斑马线留空。"],
        "scene:E018": ["hwhnk8", "视点在宽阔市街斑马线上，街道无车辆、自行车或行人。白线伸向对侧人行道，两边是六层常见楼房与行道树，远角灰杆装信号灯，无可识别天际线；距镜头约 4 米的中央斑马线留空。"],
        "scene:E019": ["l3vz1e", "五层砖楼夹成窄巷，左墙有生锈消防梯和空调，右侧灰金属门与带盖垃圾箱，墙面竖管、头顶拉线。湿石与沥青铺地，尽头接亮街；距镜头约 4 米的巷道中央留空。"],
        "scene:E020": ["gqgbtv", "狭窄的夜间步行街夹在两三层、卷帘半闭的店铺之间；招牌空白，粉、青、琥珀霓虹只作圆、线、弧，无字或符号。橱窗仅透柔光，头上串裸灯泡，湿石路距镜头约 4 米处留空。"],
        "scene:E021": ["vlawxh", "街两侧挤满约十二层的港式楼房和阳台、窗花铁栏、空调机；金属支架伸出无字的彩色矩形招牌，底层卷闸关闭。沥青街无车、无人、无电车轨道；距镜头约 4 米的中央留空。"],
        "scene:E022": ["28ry94", "弄堂两边为带红砖线脚的两层灰砖排屋，雕石门框无题字，黑漆木门旁摆盆栽；楼上伸出晾晒素布的竹竿，石路通向远端拱洞，距镜头约 4 米的中央留空。"],
        "scene:E023": ["7bbq9d", "陡峭的石阶街在褪色米白、赭和浅蓝灰泥住家间上行，两侧有盆栽和靠墙自行车，左侧铁扶手，阶顶望见屋顶与一线天空，距镜头约 4 米的中部平平台留空。"],
        "scene:E024": ["1wuik81", "铺装园路缓弯，两边是成年阔叶树和草坪，左排铁脚木条凳，右立黑铁灯，前方矮篱；树上隐见普通中层楼群，距镜头约 4 米的中央路段留空。"],
        "scene:E025": ["1uc6tc", "灰色硬木露台，远边为齐腰玻璃栏板，左右大型盆槽种观赏草，右边放两组低户外沙发和茶几；四边立杆挂串灯，栏外虚化楼群无地标，距镜头约 4 米的中央留空。"],
        "scene:E026": ["qff48s", "红绿丙烯酸球场有白线，远端篮球架配无标记白篮板；两侧高铁丝网，角落装泛光灯，外围普通公寓楼无地标。距镜头约 4 米的中央场地留空。"],
        "scene:E027": ["1m5j5le", "浅石铺就的滨江步道，右边黑铁栏外是平静宽江；左边灯杆、幼树和低石凳相间，远岸低矮常见楼群无天际地标；距镜头约 4 米的中央留空。"],
        "scene:E028": ["1ots58h", "左边现代玻璃候车亭配细钢框、素玻璃顶、窄椅；端部灯箱无广告、时刻表和字样。右边路缘及空车道，街对面是普通公寓，距镜头约 4 米的人行道中央留空。"],
        "scene:E029": ["8uacun", "山毛榉与橡树组成温带混交林，约 2 米宽的夯土径直向深处。两侧粗树干与蕨类，树冠上方偶露天空；距镜头约 4 米的中央留平坦可行的裸土。"],
        "scene:E030": ["2eh54q", "高直毛竹密生两旁，狭窄土径铺干竹叶，远处略向右弯，高处竹梢相合、露出细缝天空。无灯笼或栅栏，距镜头约 4 米的中央留可行路面。"],
        "scene:E031": ["1xlo54j", "草坡上的老樱树疏排于两侧，粉花枝在宽砾石路上交拱，花瓣飘落草地与小路；远处花树层叠，无灯笼、帐篷或建筑，距镜头约 4 米留可行路面。"],
        "scene:E032": ["1380md8", "高过树线的宽山脊两侧陡落，脊上有灰岩与低矮高山草，远处是无名崎岖群峰；无石堆、路标或小屋，距镜头约 4 米的脊顶中央留平地。"],
        "scene:E033": ["1dt62s8", "开阔平整的雪地，左边覆雪云杉、右边覆雪岩丘，雪原伸向远山。表面只有细风纹，无脚印、滑雪痕或杆，距镜头约 4 米留结实平滑的可行雪面。"],
        "scene:E034": ["4t9pgq", "嫩绿秧苗的弯曲水田沿坡层层向下，顶层约 1 米宽的草埂直伸，左侧梯地向上、右侧落入山谷。远方林丘，无小屋、农人或电线，距镜头约 4 米留可行田埂。"],
        "scene:E035": ["1yiqjjb", "开花的向日葵约 1.5 米高，花盘朝镜头，左右密植直达地平线；一条约 3 米宽修剪草路穿田至远处树线，无建筑或标志，距镜头约 4 米的路中央无植株遮挡。"],
        "scene:E036": ["k9eylt", "橙色沙丘海，左边弯曲尖脊高耸，右边低丘连绵，远至地平线；细风纹，无脚印、植被、骆驼或车辆，距镜头约 4 米的浅凹中央留平坦沙面。"],
        "scene:E037": ["xnq96k", "远处苔藓暗崖约 12 米高，瀑布落入清绿水潭，两侧湿蕨与苔藓贴岩。前景为干燥平坦灰板岩岸，无设施或栏杆，距镜头约 4 米留离水有余的可行板岩。"],
        "scene:E038": ["snej3t", "灰旧木板码头从卵石岸伸入乳青冰川湖、约 10 米处结束；左侧系一艘无标记红木独木舟，两岸深绿冷杉，远岸陡灰山沟有雪并倒映湖中。无建筑或标牌，距镜头约 4 米留可行栈板。"],
        "scene:E039": ["15teds4", "热带高石灰岩海崖的平坦草顶有矮草、风弯灌木，崖缘距前方约 12 米并设低旧木栏；下方青蓝大海，右侧白崖海岬，左侧斜生露兜树，无房船。距镜头约 4 米留离崖和栏杆较远的短草地。"],
        "scene:E040": ["15teds4", "热带高石灰岩海崖的平坦草顶有矮草、风弯灌木，崖缘距前方约 12 米并设低旧木栏；下方青蓝大海，右侧白崖海岬，左侧斜生露兜树，无房船。距镜头约 4 米留离崖和栏杆较远的短草地。"],
        "scene:E041": ["14hhjie", "细白沙滩，清浅青绿海水约 10 米外轻拍岸线、远处转深蓝；左三株高椰树斜伸，右边密集热带绿植，远左有低绿岛。无伞、躺椅、船或棚，距镜头约 4 米留干白沙面。"],
        "scene:E042": ["tzq819", "浅柚木栈道以木桩架在青绿潟湖上，双侧栏杆，正前约 25 米为方平台；左二右一共三座茅顶高脚屋，各有短连桥。远水转深蓝，远右低岛，无船、人、标牌；距镜头约 4 米留可行栈板。"],
        "scene:E044": ["1fyzalt", "旧木观景台前端约 7 米处有牢固栏杆，栏外为长满密林与椰树的陡河谷、远处雾山。秋千静挂平台最左高木架，右侧茅顶遮阳，无人或标牌，距镜头约 4 米的中央无悬挂物、留通行处。"],
        "scene:E045": ["1jgxwge", "灰石白缝浅阶夹在圆角白屋和深蓝门窗之间，左墙垂品红三角梅，阶边赤陶盆栽，巷尾露蓝天海。屋顶平坦，无穹顶、钟楼、教堂或标牌，距镜头约 4 米留可走平台。"],
        "scene:E047": ["m79ap3", "浅色碎石乡路缓弯，两侧挺拔深色柏树、绿金丘陵田地，远端低丘上一幢赤陶瓦石屋，右边低干砌石墙。无车、标牌或电线，距镜头约 4 米留可行碎石路。"],
        "scene:E048": ["kehzjz", "从垂花门内看清式北京四合院：方铺灰砖，远处三开间正房建在低石台上，红漆木、纸背雕格窗、灰瓦山墙和红柱檐廊，两侧厢房以廊相连。左海棠右水缸，距镜头约 4 米的院心留空。"],
        "scene:E049": ["1xo5q3c", "明清江南水镇，左侧绿水渠、石驳岸与花岗岩系缆柱和空木船；对岸白墙黑窗灰瓦、马头墙，远处单孔拱桥；右边木板门面挂空招牌与两盏未点红灯，距镜头约 4 米的石板路留空。"],
        "scene:E050": ["h4yr7a", "苏式园林右侧红柱灰瓦回廊设低座栏，白墙开纹格漏窗；左侧池中有太湖石与荷叶，远处石上建翘檐六角亭，背靠竹松。回廊开敞处是灰砖台地，距镜头约 4 米的中央留空。"],
        "scene:E051": ["1k1gpdr", "江户町街夯土路两侧有浅石沟，两层木町屋为深格栅、低二层虫笼窗、黑瓦深檐；店口靛蓝暖帘无纹章或字，右边消防木水桶，远端木栅门后见瓦顶，距镜头约 4 米的中央留空。"],
        "scene:E052": ["1gagvm0", "宋式茶肆素木梁柱、白墙，左窗卷竹帘望绿柳；远墙长柜有炭炉、黑釉茶盏和漆盘，左右置方木桌长凳，右远角立素纸屏，距镜头约 4 米的中央石地留空。"],
        "scene:E053": ["x4f77u", "黄花梨画案靠远墙，摆笔筒、砚台、卷轴，后有低靠背官帽式扶手椅；右置花梨书架与无题签蓝布函线装书，左圆格窗望竹，远墙挂素绢、两角立烛台；距镜头约 4 米的灰方砖留空。"],
        "scene:E054": ["wx9cew", "原创 14 世纪北欧村街，凹凸卵石路缓弯，左右深橡木框架、米色泥墙、外挑二层的茅顶或瓦顶房，小窗为菱形铅条玻璃。左有木井，右堆木柴和车，远处林丘无教堂塔尖；距镜头约 4 米留空。"],
        "scene:E055": ["16f7p0g", "17 世纪末巴洛克舞厅，白金卷雕墙板，左高拱窗挂绛红丝绒帘，右鎏金柱间高镜只映对窗；天花画云天空无人像，三晶灯燃蜡烛，远端乐师阳台镶金栏；距镜头约 4 米的星纹拼木地面留空。"],
        "scene:E056": ["1vl6yf", "20 世纪 20 年代装饰艺术酒店，奶油白与黑大理石墙嵌阶梯形青铜；后方黑漆黄铜弧台无字，背后双电梯门饰日芒。两侧槽柱、祖母绿弧椅，扇形雾玻璃壁灯及阶梯藻井，距镜头约 4 米的黑白人字地面留空。"],
        "scene:E057": ["1e6dlar", "近未来城市窄巷，灰污墙密布空调、缆线、铁梯与管道；全息板只有品红和青色色块，无文字、符号或人脸。远楼窗亮，右栅口喷汽、左叠塑箱，湿沥青反彩光，距镜头约 4 米的中央留空。"],
        "scene:E058": ["llp5ts", "六角截面的星舰通道，哑白复合板与等距深灰肋框，顶部暗嵌白灯带，两侧管束扶手。尽头素灰气密滑门关闭无标记，墙上小屏仅泛蓝；距镜头约 4 米的金属格栅甲板留空。"],
        "scene:E059": ["k5201m", "深橡木柱间粗灰泥，重梁悬干草药和铁灯；远墙长吧台后摞木酒桶，左石壁炉、右木桌长凳、右远处楼梯，木柱牌无字；距镜头约 4 米的旧宽木板地留空。"],
        "scene:E060": ["ynuif", "浮岛天空草甸，短草野花间有旧土径，远边止于云海前的岩崖；两侧远处两座小浮岛露树根，左残石拱、右风蚀老树，距镜头约 4 米留远离崖边的空草地。"],
        "scene:E061": ["11e4aoq", "俯瞰云海的白玉色宽石台，远边雕白栏杆，远方青色喀斯特峰穿云。左石突上有红木飞檐灰釉瓦亭，右崖立曲松，远瀑落入云中；距镜头约 4 米的中央石台留空。"],
        "scene:E062": ["1wuag4c", "竹林中两层木客栈围着夯土院，楼上有檐廊，格门灰瓦，门头与左侧竹竿布旗无字；四周矮木篱密竹，右边石井和素红封口酒坛，距镜头约 4 米的院心留空。"],
        "scene:E063": ["rajzza", "哑白影棚弧形墙无缝过渡至白地，覆盖背景及两边，转折处在站位后方呈柔和渐变。画面无其他物件，距镜头约 4 米的中央留白。"],
        "scene:E064": ["1qmcko4", "中性中灰哑光无缝纸从画框上方卷挂，弧形顺落至镜头前和站位脚下，覆盖背景两侧，无折痕裂口及其他物件；距镜头约 4 米的中灰地面留空。"],
        "scene:E065": ["1nzq951", "哑黑无缝纸从背景弧形延至地面，覆盖背景与两边，顶侧淡入纯黑；仅隐见前地面，无其他物件，距镜头约 4 米的中央黑地留空。"],
        "scene:E066": ["1yfzbem", "手绘画布为灰橄榄和褐色柔斑云纹，边暗中心亮，无可辨图案、边缝或框架，铺满背景并弧形垂至地面。无其他物件，距镜头约 4 米的画布地面留白。"],
        "scene:E067": ["1owe7ef", "暖白灰泥远墙、左侧落地窗挂透光素纱、不见外景，漂白浅木地板铺向右边白墙。无家具、植物和器材，距镜头约 4 米的中央地板留空。"],
        "scene:E068": ["138mbn", "浅灰无缝纸弧接地面并铺满背景和两侧；左为品红、右为青绿，站位后方呈柔和竖向过渡，地面映两色。无灯架等物，距镜头约 4 米的中央留空。"],
        "light:L001": ["1ntui82", "日出前无直射阳光，全天空发出柔和无影冷蓝光，画面右后方地平线稍亮；反差很低，约 9000 K。"],
        "light:L002": ["1kosssc", "画面左侧太阳高出地平线 5°，暖橙直射光擦过人台右侧，长投影向画面右边伸展；阴面有冷蓝天光补亮。"],
        "light:L003": ["12x66g5", "上午中段的日光从画面左前方高处 35° 照来，清澈偏暖的中性色约 5000 K；阴影利落，中等长度投影向后偏画面右侧，天空晴蓝。"],
        "light:L004": ["o4wqoi", "正午近垂直硬白光，脚下是很短的深影；眉弓、下巴和手臂下阴影深，头顶和肩顶部明亮，约 5500 K。"],
        "light:L005": ["12i2omf", "午后太阳从画面右后方高处 30° 照来，暖中性色约 4800 K；人台左缘受光、正面大多在柔影内，投影朝镜头和画面左侧。"],
        "light:L007": ["hq38y5", "太阳在正后方画框外高 8°，头、肩和手臂边缘呈金色轮廓光；正面由天光柔和提亮，长影朝镜头伸展，略有薄霭。"],
        "light:L008": ["lq65tb", "日落后无直射，画面右后天空橙粉逐渐过渡到上方紫色；右侧柔暖粉光与顶上冷紫补光交融，阴影极柔。"],
        "light:L009": ["vt5c48", "日落约 20 分钟，深蓝天空留一线暖色地平线；均匀柔冷天光约 10000 K，人台整体呈低反差蓝色调。"],
        "light:L010": ["62c5ph", "满月从画面左侧高 40° 投来微弱银蓝冷光，向右投软缘影；深藏青天空可见几颗星，背光侧近黑。"],
        "light:L011": ["s8d38u", "灰白云层满天，无直射和明显投影，上方天光均匀而软，脚底仅淡淡接触影；中性约 6500 K。"],
        "light:L012": ["1ci0h9f", "深石板灰风暴云铺满天空，画面左侧一道云隙落下浅日光照亮人台；背景云暗、地面干燥。"],
        "light:L013": ["1y1y1hs", "画面左侧大窗投来柔和的间接日光，人台右侧亮、左侧逐渐变暗；远墙较暗，影缘柔和，无直射。"],
        "light:L014": ["qymip5", "画面左窗射入午后直射日光，在人台躯干和地面形成清晰明亮矩形；室内其余处仅微弱暖反光，反差强。"],
        "light:L015": ["18sgr5v", "画面左侧半开百叶窗透入硬日光，斜向平行光带横过人台、球体和后墙；暖光约 4500 K。"],
        "light:L016": ["lg2m24", "人台正后白纱帘漫射明亮日光，轮廓泛浅光，正面为低反差柔影，整体通透高调。"],
        "light:L017": ["17jps9y", "天窗从正上方洒下柔光，头肩和球体顶部明亮，脚边圆形柔光池，房间边缘发暗。"],
        "light:L018": ["4uyj0f", "只有画面右侧敞门透入日光，强侧光照亮人台左侧，余处沉入深影，室内近黑，呈绘画式明暗对照。"],
        "light:L019": ["1sh9n4l", "上方及前方的开阔天空提供柔冷光，没有阳光直射人台，阴影极软，后方晒到太阳的背景更亮更暖。"],
        "light:L020": ["t4x80j", "正午日光透过头顶叶片，在人台、球体及地面散落圆形亮斑，其余部位处于淡绿柔影。"],
        "light:L021": ["27al0j", "画面左侧 25° 的冬日阳光被白雪强烈反射，阴面、手臂下方和下巴都被明显补亮；整体极亮，雪上阴影偏冷蓝。"],
        "light:L022": ["tnfox1", "人台背后的阳光由前方起伏水面反射，将流动焦散亮纹投到人台前面和球体上，整体光线柔和。"],
        "light:L023": ["9gfv1", "明亮日照隧道口位于人台身后，几乎剪影，只余细亮轮廓；隧道地面反光延伸向镜头，正面很暗。"],
        "light:L024": ["uur9eq", "唯一光源是画面左侧腰高台灯，约 2700 K；暖光从左向右快速衰减到近暗，书房其余处暗，右墙留软缘影。"],
        "light:L025": ["87yf2n", "顶置灯板投出均匀平坦的微绿白光，约 4000 K、低反差；下巴与臂下有柔影，略显冷静如诊室。"],
        "light:L026": ["120i6oq", "仅画面左侧三支烛火提供约 1800 K 的闪动暖光，快速衰减，人台右侧橙亮，其余沉入黑背景。"],
        "light:L027": ["1ho6egm", "画面左前低位篝火以橙暖光从下方及正面打亮人台，阴影向上，火星升起，后面是夜林。"],
        "light:L028": ["1p5pgk0", "画面左侧品红灯照人台右侧，画面右侧青色灯照左侧；两色交于中线，湿路面有彩色反光。"],
        "light:L029": ["1xkhw90", "单盏钠灯位于上方稍后，约 2000 K 橙黄顶光，脚边路面有锥形光区，面部和正面背光，四周是深蓝夜色。"],
        "light:L030": ["16y8t1y", "胸高正前方屏幕发出冷蓝白光，平照人台前方与球体，后方一切沉入黑影。"],
        "light:L031": ["h297dc", "身周及背后的许多小灯泡投来暗暖柔光，轮廓略亮，正面由微暖光补亮，背景有圆形散景光点。"],
        "light:L032": ["10es8xq", "前方低位两束硬白车灯平照人台正面，双长影沿路面直向身后，远处是黑夜。"],
        "light:L033": ["1gznzc5", "正前高处单支硬白追光在人台脚边形成边缘清晰的圆形光区，区外全黑，光束内略有薄霭。"],
        "light:L034": ["1tzch7p", "人台右侧受画面左方约 2700 K 灯光，左侧受画面右方窗外冷蓝暮光，冷暖在身上交汇。"],
        "light:L035": ["5xvm7", "一盏大型柔光源在镜头正后等高直照，双颊及鼻亮度相当，鼻下和颏下几乎无影，球体受光均匀、高光居中。"],
        "light:L036": ["1gvzxdn", "硬光位于人像正前上方 45°，鼻尖下形成小而对称的蝶影，双颧同亮，下颌在颈部投影，球体高光在顶部中央。"],
        "light:L037": ["1y29wt7", "柔主光在画面左侧 30°、上方 30°，鼻影成小环向下偏右，不接颊影；画面右脸略暗，球体高光在左上。"],
        "light:L038": ["1pkutdy", "主光在画面左侧 45°、上方 45°，无补光；画面右脸眼窝下仅留被鼻颊阴影围住的倒三角亮区，球体半亮、明暗线倾斜。"],
        "light:L041": ["1oqpdct", "硬光正上方直打，头顶、眉弓、鼻梁和双肩亮，眼窝陷入深暗、鼻下垂短影、下巴下有暗带；球体仅顶部有光。"],
        "light:L043": ["1z0w39s", "正前上方 40° 的大柔光与前下方胸高补光均匀打脸，眼窝补亮，鼻和下巴下只余浅影；球体上下各一高光。"],
        "light:L044": ["1wzahup", "左侧 45°、上方 30° 为柔主光，右侧镜头高位弱补光，后上方硬发光描头肩；中等反差，球体左上有主高光、顶缘微亮。"],
        "light:L045": ["ngota6", "正面和两侧明亮柔光充满场景，背景纯白，石膏像通透明亮，仅鼻侧和下巴底余淡软阴影，几乎无暗调。"],
        "light:L046": ["uzrgr7", "左侧 60° 上方窄柔光，仅照亮额头、颧骨、鼻肩的左侧面及球体左侧，其余没入纯黑背景。"],
        "light:L047": ["qt9dp1", "背景均匀亮白，像与球体正面不受光，呈边缘利落的深色剪影，可辨头、颈和肩廓。"],
        "light:L048": ["1t4gj0b", "画面左、右各 60° 放橙与青滤色光，分别包裹人台和球体两侧，中心混为柔和低饱和调。"],
        "light:L050": ["13ki3ro", "左上柔紫光与画面右下柔蓝光相混，背景形成从紫到蓝的渐层。"],
        "light:L051": ["k0e6tf", "左侧高窗的阳光穿过薄雾，形成倾斜平行的可见光束，其中一束横照人台，束内见尘粒，余处昏暗。"],
        "light:L052": ["134f02s", "人台遥远身后单一强光透过浓雾，亮雾前只见柔灰剪影，轮廓有散射光。"],
        "light:L053": ["116p9ir", "画面左方 45° 的暖硬光将四格窗框清晰投影到人台、球体与背景上。"],
        "light:L054": ["1bxr5dk", "画面左方 45° 的暖硬光穿过画外枝叶，将锐利叶影投到人台、球体与背景上。"],
        "light:L055": ["293v0k", "粉、蓝、黄、绿小圆光斑散布在人台、球体、地面和背景上，像来自画外镜球，环境光昏暗。"],
        "prop:T001": ["imclwj", "钢弦木吉他，饱满圆肩琴身、浅云杉面板、暖褐桃花心木背侧板；圆音孔有细环饰、水滴护板、深色矩形琴桥有 6 枚弦钉，20 品深指板镶点。6 弦，平顶琴头每侧 3 钮，无标、背带或拨片。"],
        "prop:T002": ["1tcsyyf", "原创樱桃红亮漆实心电吉他，短圆双角对称，黑护板、两枚黑盖拾音器、固定桥、三旋钮一开关。螺栓接合枫木琴颈、深色点嵌指板 22 品，6 弦；圆琴头每侧 3 钮，无尖角、单缺角、拱面、标志、带或线。"],
        "prop:T003": ["1e03odm", "琥珀金漆沙漏琴身，雕云杉面板、火焰纹枫木背板，双 f 孔、枫桥，4 弦跨无品乌木指板，黑尾板和腮托，琴头卷饰、两侧各 2 黑轴。浅马尾毛黑弓根的细木弓平行略斜悬于后，无盒或肩托。"],
        "prop:T004": ["bidhnw", "全尺寸红棕大提琴由钢尾柱撑直，约 75 厘米琴身、云杉面和火焰纹枫背，双 f 孔、高枫桥，4 弦跨无品长乌木指板，黑尾板；卷饰琴头两侧各 2 轴，无弓、盒或支架。"],
        "prop:T005": ["1j7wxtu", "金漆黄铜中音萨克斯直立，锥体下接 U 形弯管，上翘扩口朝前；弯颈接黑吹嘴和金属卡箍，管身有衬垫键杯、珍珠色按键、连杆和护键，喇叭口无刻纹；无背带、架或盒。"],
        "prop:T006": ["11q3f7x", "透明漆黄铜降 B 调小号横放，扩口朝右、吹嘴朝左，三活塞排成一列、顶为珍珠色圆键；主调音管前弯，有第一活塞滑管小环和排水键，无刻纹、盒或弱音器。"],
        "prop:T007": ["11v4rex", "约 67 厘米银色长笛竖放，笛头朝上。三节细直管：顶端有唇板、吹孔及圆帽，中段一列圆闭键杯连杆，短尾节有少数键；素金属无刻纹、无盒。"],
        "prop:T008": ["ob5fgu", "约 163 厘米深红木筝平放、长边朝镜头，拱形泡桐面；21 弦各架独立可移动筝码，码排成一斜线，两端固定弯桥，右端雕盖下藏弦轴，左端素窄饰带，无腿、架、拨片或文字印章。"],
        "prop:T009": ["g2erb8", "深红木梨形琵琶直立，浅泡桐平面无音孔，底有低覆手，4 弦；短颈恰有 6 个楔形木相，下方细密竹品至琴面约三分之二。后弯轴箱两侧各 2 轴，小素卷首，无龙蝠雕纹或拨片、义甲。"],
        "prop:T011": ["dwlipp", "黑漆古琴平放，从演奏者侧见其约 120 厘米长身、细断纹与双浅腰，右首宽左尾窄；7 弦、无活动码或品，近侧一排 13 枚圆螺钿徽，首端低岳山，首下有 7 轸和短丝穗，无腿、桌或题印。"],
        "prop:T013": ["z9p6jc", "直立张开的深红油纸伞，浅圆顶约 90 厘米宽，边绘一枝白梅；细竹骨由顶帽向周缘辐射，伞下短竹撑骨和伞托彩线环，直竹轴、素竹柄，无字、印或金属件。"],
        "prop:T014": ["172p30v", "约 25 厘米米白半透丝面圆扇，深褐细竹边，偏心处工笔绘一朵带两叶的粉牡丹；直圆竹柄带小绳结和短丝穗，无字印、不见扇骨。"],
        "prop:T015": ["1pvq5og", "象牙白素纸折扇直立，开角约 120°，上半为无字褶页，下露竹骨；16 骨含 14 细骨、2 外大骨，同一圆铆钉均匀放射，无字画印章或穗。"],
        "prop:T016": ["90w2a4", "深红木雕六角宫灯以短红绳吊起，六块米白丝面各有小花；六个翘角各垂短红穗，底为较窄雕框与小车木坠，未点亮，无字印。"],
        "prop:T018": ["zu2u7z", "三件白瓷盖碗层叠：浅圆托、约 9 厘米高的敞口碗与嵌在口沿内的圆钮拱盖，钴蓝缠枝莲纹。盖合、不见茶，无勺或字记。"],
        "prop:T019": ["8gjho3", "约 60 厘米闭合横卷，灰蓝丝锦织小云纹，中间薄扁绳绕两圈、末端系浅玉别子；两端露圆形深红木轴头，不露画，无签或字。"],
        "prop:T021": ["1i0drpw", "古式黄铜折射望远镜，抛光三节伸缩镜筒水平，右为宽物镜、左为窄目镜；黄铜托架立于深桃花心木三脚架，直腿端包黄铜，无刻字。"],
        "prop:T022": ["3viaxb", "未点燃的老黄铜防风煤油灯，圆油罐、透明玻璃罩及四根护丝，通风顶盖，提梁竖起，内见暗灯芯，无火焰、发光或字样。"],
        "prop:T023": ["1nau53e", "约 12 厘米清透玻璃球搁在一体抛光黄铜座的圆托杯上，短车木形柱与三弯脚；球内空，只见柔反光，无发光、烟雾、图像或刻纹。"],
        "prop:T024": ["1bu655h", "约 25 厘米古式沙漏，两相同透明泡在细腰相接，上下深胡桃木圆板由三车木柱相连。浅沙大多堆于下泡，上泡余少许、细流下落，无刻字或数字。"],
        "prop:T025": ["1o37wv9", "直立张开的纯大红长伞，恰有八片和八骨，每骨末端金属头、伞顶短帽；中央直杆接天然木 J 形弯柄，无纹样或标志。"],
        "prop:T026": ["wa8v3d", "约一打深红玫瑰与几叶绿叶直向上，素棕牛皮纸交叠成锥状，用奶油色缎带蝴蝶结收束；下露切茎，无卡、标签或印刷。"],
        "prop:T027": ["jmybi0", "通用 1970 年代 35 毫米胶片单反，缎铬机身覆黑仿皮，无牌尖顶五棱镜；顶有过片杆、快门速度盘及回片柄，黑色 50 毫米定焦带滚花调焦环，摘盖，无可读品牌或刻数。"],
        "prop:T028": ["nk1uze", "圆角厚实薄荷绿拍立得，正面中部圆镜筒、左上矩形取景窗、右上圆闪光窗，顶部宽横出片口，无彩虹条、品牌或印记。"],
        "prop:T029": ["15ri6yg", "黑色包耳式耳机直立，软垫头梁、两窄金属滑杆，两个椭圆哑黑耳罩相对、厚黑蛋白皮耳垫，无线缆或标志。"],
        "prop:T030": ["8wl5rx", "竖持动圈舞台麦，深灰钢网球罩向上，哑黑金属柄向底收窄，带小齐平开关，底部线口未连接，无品牌。"],
        "prop:T031": ["q7lgy3", "抛光铬复古大振膜电容麦，细长圆顶胶囊体，上半细织网、下半实筒，置于带两侧旋钮的 U 形架；直立悬空，无支架、线、徽记或字。"],
        "prop:T032": ["1ram142", "黑色哑光石墨球拍竖立，椭圆拍面朝镜头，开放三角拍喉；淡黄紧密网线为 16 纵 19 横，直柄缠黑带、平端盖，拍框和网线无字或喷记。"],
        "prop:T033": ["1xvrav3", "街式滑板轮朝下，七层枫板两端翘，顶覆黑砂纸；两银色桥架各有两只米白聚氨酯轮，共四轮，原枫木底无画、标或字。"],
        "prop:T034": ["12i9r0k", "九英尺冲浪长板立在板尾、板面朝镜头，圆头，薄荷海绿亮树脂覆面，中央深色细木龙骨贯穿首尾；圆板缘，板尾底一中央鳍，无脚绳、蜡纹或标字。"],
        "prop:T035": ["8iooga", "单只右脚白皮高帮旱冰鞋，八对孔系白鞋带，底银色金属板上两轴各带两粉轮、共四轮，鞋尖下一枚圆橡胶刹车头，无标字。"],
        "prop:T036": ["150rzax", "跨低桁的薄荷绿钢架车由脚架支立，两个同样的 28 英寸黑胎轮各有 32 银辐条；上扬把配棕握套、棕弹簧皮鞍、双镀铬挡泥板，单盘单飞链罩、两踏板、小平后架，无篮、灯或贴字。"],
        "furn:F001": ["j7jiuy", "浅橡木实木餐椅，四根直方腿以低横撑相连，平座高 45 厘米，弧形顶档下有五根直竖档，表面平滑涂油。"],
        "furn:F002": ["u4ntvk", "黑网靠背、黑软垫座面高 48 厘米，固定黑扶手；中央气压升降柱下为五星脚，共五只黑脚轮。"],
        "furn:F003": ["1g9czsa", "芥末黄羊毛布包覆的中世纪现代风扶手椅，紧实座垫高 42 厘米，软背微倾、扶手宽厚，四根外撇渐细胡桃木腿。"],
        "furn:F004": ["ro559u", "本色藤休闲椅，圆弧编背连续弯为扶手，镂编座高 40 厘米，配米白亚麻素垫，四根弯藤腿。"],
        "furn:F005": ["xmd9z3", "蜜色枫木摇椅，平座前缘高 42 厘米，弧顶档下七根竖条，两平扶手、四车木腿；两长弧滑条各贯穿同侧前后腿并外伸，静置时中段着地。"],
        "furn:F006": ["zrbey8", "无靠背吧椅，圆橡木座高 75 厘米，四细哑黑金属腿微外撇，圆踏圈位于座下约 25 厘米并连接四腿。"],
        "furn:F007": ["1bic7p9", "浅松木低方凳，厚方平座高 45 厘米，四直方腿由四面横撑相连。"],
        "furn:F008": ["nzem7f", "浅灰织物三人沙发约宽 210 厘米，三块可拆座垫高 44 厘米、三只靠垫、低方扶手、短黑方脚。"],
        "furn:F009": ["1rgi52d", "藕粉丝绒贵妃榻约长 180 厘米，长软座高 40 厘米；左端卷状高枕，后侧为局部矮靠，四短鎏金车木脚。"],
        "furn:F010": ["re246g", "奶白绒面大梨形豆袋，自然塌坐、座窝柔软，缝线从顶部延至底面。"],
        "furn:F011": ["19und7v", "天然藤编水滴形吊篮，前面敞开、内置圆白垫，由短链挂在黑钢弧架上，底部为圆座。"],
        "furn:F012": ["tofie0", "双人床的高床头包浅灰亚麻、分六条竖软槽，侧梁床尾同布，短腿隐藏。床垫面高 55 厘米，白床笠和铺平白被，两白枕并排，无毯或额外枕头。"],
        "furn:F013": ["ujeiqv", "三人公园椅长 180 厘米、座高 45 厘米，风化柚木条作座和靠背，墨绿铸铁端架带卷形扶手，无铭牌。"],
        "furn:F014": ["7butlh", "白漆花园椅，七竖条组成圆顶高扇背，条座向后倾、前缘高 35 厘米，前柱上放宽平扶手、后两直腿，无坐垫。"],
        "furn:F015": ["15mfh4z", "柚木躺椅长 200 厘米，横条卧面高 35 厘米；头端靠背以暗棘轮抬起约 45°，四短方腿，头端两腿有小轮。蜜色油面，无垫、毛巾。"],
        "furn:F016": ["14oe90h", "红雪松双人秋千椅，条座高 45 厘米、条背、两平扶手，座两端各用两根直镀锌链水平静悬于独立 A 字架顶梁，无垫。"],
        "furn:F017": ["1qgc0zy", "圆形小餐桌高 72 厘米，白大理石桌面直径 60 厘米，单柱搭黑色圆铸铁底座。"],
        "furn:F018": ["12ulj30", "浅橡木六人长桌高 75 厘米，桌面 180 × 90 厘米、厚 4 厘米；四角直方腿，四面素牙板深 8 厘米。涂油光滑，桌面空置。"],
        "furn:F020": ["cbrs3i", "浅橡木桌高 75 厘米，桌面 120 × 60 厘米；右台下摞三个带圆木钮的抽屉，左端两直方腿，腿间空位后有素挡板。抽屉全闭、桌上无物。"],
        "furn:F021": ["195k6m9", "白漆木梳妆台 100 × 45 厘米、高 75 厘米，中央腿位两侧各两只单圆钮抽屉，四直方腿。薄白框矩形镜 70 × 60 厘米，由两短柱固定在后缘，镜中均匀中灰无反射；抽屉闭、桌面空。"],
        "furn:F022": ["18j8lrd", "独立直吧台高 105、长 150 厘米，浅橡木厚台面深 60 厘米、前伸 20 厘米。前封深染企口立板，离底 20 厘米处的拉丝钢踏杆有三支座，开放背面中部为通长搁板，上下均空。"],
        "furn:F024": ["ueoq2g", "金褐黄花梨圈椅，连续弧形搭脑向前下弯成扶手、末端外撇；S 形实木靠板有素雕，木框编软屉座高 48 厘米，四圆腿、前踏枨，无镶嵌。"],
        "furn:F025": ["efynkh", "深褐鸡翅纹木南官帽椅，直搭脑两端折入后柱不出头，直扶手前端同样折入前柱，素弯靠板，框座高 48 厘米；四圆腿配步步高枨。"],
        "furn:F026": ["1y0n36e", "浅青釉圆瓷鼓墩，高 45 厘米，桶形身、平圆顶，上下缘有两排凸鼓钉，侧面两个小透孔。"],
        "furn:F027": ["1n3ke2h", "清式红褐木太师椅，宽长方座高 50 厘米、框下束腰；高三屏背中央最高、雕素如意云纹，两侧低屏作扶手；四方腿内翻马蹄足坐在落地托泥上，无镶嵌或文字。"],
        "furn:F028": ["10esyu7", "做旧蜜褐榆木素长凳，独板长 120 厘米、座高 50 厘米，两对内收外撇圆腿以侧枨连接，座下有素牙头，无背无雕。"],
        "furn:F029": ["3efrcl", "红褐木罗汉床约长 200 厘米，宽面铺编垫，座高 45 厘米，背与两端围三面实板，短弯腿收马蹄足；中央放同材小炕桌。"],
        "furn:F030": ["17i23sb", "红褐木明式方桌高 86 厘米，桌下束腰和素牙板；四角方腿内翻马蹄，腿至桌下设 S 形霸王枨，不设腿间横枨。仅边缘起细线，无雕刻，桌空且无凳。"],
        "furn:F032": ["1e9bjku", "昭和矮圆饭桌，深褐漆木面直径 80 厘米、高 33 厘米，四短直腿折收在桌下，环形素牙板。前方有一靛蓝方棉座垫，约厚 6 厘米、中心拉扣，后边微入桌缘下；桌面空。"],
        "furn:F033": ["bhpuei", "路易十五式灰漆榉木扶手椅，弧形雕花顶档、填软封闭侧板与软扶手，四根细弯腿卷足，波形前座框中央雕小花。靠背侧面和高 45 厘米活动垫包象牙麻布，无镀金与纹章。"],
        "furn:F034": ["4lz9vg", "维多利亚式勺形弯背连矮开放扶手，瓶绿色丝绒深拉扣形成菱褶，弹簧座高 44 厘米。顶缘与扶手前露抛光桃花心木，前两车木腿有黄铜小脚轮，后两素腿外撇。"],
        "furn:F035": ["1detpl5", "1930 年代装饰艺术式俱乐部椅，磨旧干邑棕皮包低圆桶形椅体，弯靠背同高连厚圆扶手，座垫深、高 42 厘米，沿曲线滚边；内收深木台座，无可见腿。"],
        "furn:F036": ["1jku1l5", "约高 150 厘米的浅原木 A 字梯展开，旧漆斑磨去，前有四级平踏板，后素腿配交叉撑，顶端有小平台。"],
        "furn:F037": ["4y5cp6", "摄影整苹果箱，浅桦胶合板边缘深、角轻磨，平放长 51、宽 30、面高 20 厘米。中空带中央撑，两长边两端各有椭圆手孔，见板缝钉头，无字、标识或数字。"],
        "furn:F038": ["fagt9k", "摄影半苹果箱，略磨角的浅桦胶合板平放长 51、宽 30、面高 10 厘米；浅箱中空，两长边两端各有长槽手孔，见板缝，无字、标识或数字。"],
        "furn:F039": ["w4immr", "摄影四分之一苹果箱，略磨角的浅桦多层板平放长 51、宽 30、面高 5 厘米；实心无手孔，层边可见，无字、标识或数字。"],
        "furn:F040": ["tn6ibp", "摄影摆姿台为 45 厘米见方的实心白立方，面高 45 厘米，哑白平滑缎光，棱边直、角微圆，无缝、脚、把手或字。"],
        "furn:F042": ["1mvecfo", "独立直矮景墙长 150、厚 25、高 100 厘米，平顶可倚靠搭腕，暖米白石灰灰泥手抹纹，顶缘略圆，两端平截，无裂缝、涂鸦或字。"],
        "furn:F044": ["1grt7po", "独立哑白木门框，直方侧框及上框加平门套，内口 80 × 200 厘米，外框 100 × 215 厘米；两侧固定在前后长 50 厘米脚板上。无门、铰链或门槛，框内通透。"],
        "furn:F045": ["1edsxbh", "做旧鼠尾草灰绿木窗框宽 100、高 120 厘米，横竖各一棂分四空格，无玻璃、反射或帘。窗台外伸、顶高 90 厘米，两方腿落在前后向脚板上，整体高 210 厘米。"],
        "furn:F046": ["17mhxlr", "可调摄影凳的仿黑皮软圆座直径 40 厘米，设高 65 厘米；单镀铬升降柱带座下小杆，中部圆脚环，五星镀铬底座，无轮、靠背或标识。"],
    };

    // Curated fashion/tag vocabulary. Match multiword phrases first, without editing the source text.
    const lexicon = `
shirt tucked out=衬衫下摆外放|untucked shirt=衬衫下摆外放|standing on one leg=单腿站立|yoga pants=瑜伽裤|helmet off=未戴头盔|wrapped in blanket=裹着毯子|full armor=全身甲|plate armor=板甲|loose necktie=松系领带|white shirt=白衬衫
mini skirt=短裙|mini dress=短款连衣裙|mini bag=迷你包|mini tote=迷你托特包|midi dress=中长连衣裙|midi skirt=中长半身裙|maxi dress=长款连衣裙|maxi skirt=长裙|pencil skirt=铅笔裙|tank top=背心|knit top=针织衫|tote bag=托特包|high heels=高跟鞋|fishnet tights=网眼连裤袜|olive green=橄榄绿|light blue=浅蓝色|navy blue=藏青色|turtleneck sweater=高领毛衣|sailor uniform=水手制服|school uniform=校服|military uniform=军装制服|police uniform=警察制服|track suit=运动套装|track pants=运动长裤|sports bra=运动文胸|string bikini=系带比基尼|strapless dress=无肩带连衣裙|denim jeans=牛仔裤|polka dot=波点|bow tie=领结|bunny ears=兔耳|cat ears=猫耳|fox ears=狐耳|rabbit ears=兔耳|angel wings=天使翅膀|demon horns=恶魔角|pointy ears=尖耳|work clothes=工作服|casual clothes=休闲装|office lady=办公室女郎|business suit=商务套装|pointy hat=尖顶帽|name tag=名牌|black leather=黑色皮革|white frill apron=白色荷叶边围裙|short sleeves=短袖|long sleeves=长袖|detached sleeves=分体袖|rolled sleeves=卷袖|bare shoulders=露肩|bare legs=露腿|off shoulder=一字肩|off the shoulder=一字肩|high waist=高腰|knee pads=护膝|hair ribbon=发带|hair bow=发蝴蝶结|hair flower=发间花饰|sleepy eyes=惺忪睡眼|towel around neck=颈挂毛巾|heart shape=心形|holding microphone=手持麦克风|holding guitar=手持吉他|v neck=V 领|column dress=直筒连衣裙|maid headdress=女仆头饰|news anchor=新闻主播|flight attendant=空乘|life jacket=救生衣|taishou roman=大正浪漫|wa lolita=和风洛丽塔|gothic lolita=哥特洛丽塔|sweet lolita=甜美洛丽塔|jirai kei=地雷系|visual kei=视觉系|mecha musume=机甲少女|playboy bunny=经典兔女郎|cherry blossoms=樱花|new year=新年|martial arts=武术|karate gi=空手道服|oil paper umbrella=油纸伞|oil-paper umbrella=油纸伞|magical girl=魔法少女|layered skirt=叠层裙|wide leg=阔腿|pleated skirt=百褶裙|frill skirt=荷叶边裙|school swimsuit=校园连体泳衣|trench coat=风衣|puffer vest=羽绒马甲|puffer jacket=羽绒服|platform shoes=厚底鞋|shirt dress=衬衫式连衣裙|crop top=短款上衣|track jacket=运动夹克|riding boots=马术长靴|riding helmet=马术头盔|flight suit=飞行服|tai chi=太极|street fashion=街头时尚|one piece=连体款|full body=全身|standing pose=站姿|sitting pose=坐姿|red-framed glasses=红框眼镜|lab coat=实验室白大褂|dress shirt=正装衬衫|tote handbag=托特包|faux fur=仿皮草|leather gloves=皮手套|neck pouch=挂颈袋|japanese clothes=和式服装|chinese clothes=中式服装|yoga mat=瑜伽垫|ice skating=滑冰|sports uniform=运动制服|space suit=宇航服|ball gown=舞会礼服|evening gown=晚礼服|holding weapon=手持武器|black and white=黑白配色
bag=包|black=黑色|mini=迷你款|skirt=半身裙|knit=针织|dress=连衣裙|boots=靴子|white=白色|socks=短袜|lace=蕾丝|ribbon=丝带|sandals=凉鞋|leather=皮革|stockings=长筒袜|brown=棕色|cardigan=开衫|camisole=细肩带背心|tights=连裤袜|necklace=项链|ivory=象牙白|jacket=夹克|pants=长裤|satin=缎面|shorts=短裤|heels=高跟鞋|grey=灰色|gray=灰色|shirt=衬衣|denim=牛仔布|pleated=百褶|red=红色|beige=米色|blue=蓝色|gold=金色|fur=毛绒|navy=藏青色|frill=荷叶边|frills=荷叶边|frilled=带荷叶边|silver=银色|coat=大衣|choker=颈链|pink=粉色|bra=文胸|midi=中长款|briefs=内裤|sneakers=运动鞋|hat=帽子|blouse=女式衬衫|green=绿色|suede=麂皮绒|tote=托特包|belt=腰带|mint=薄荷绿|loafers=乐福鞋|jeans=牛仔裤|wool=羊毛|cream=奶油色|headband=发箍|floral=碎花|gloves=手套|swimsuit=泳衣|corset=束身衣|velvet=丝绒|turtleneck=高领|pumps=浅口鞋|sunglasses=墨镜|sweater=毛衣|yellow=黄色|burgundy=酒红色|scarf=围巾|khaki=卡其色|uniform=制服|robe=长袍|orange=橙色|corduroy=灯芯绒|apron=围裙|chiffon=雪纺|olive=橄榄色|vest=马甲|bikini=比基尼|school=校园|tulle=薄纱|beret=贝雷帽|hoodie=连帽衫|mesh=网纱|kimono=和服|long=长款|polka-dot=波点|lavender=薰衣草紫|sleeves=衣袖|holding=手持|maxi=超长款|winter=冬季|casual=休闲|short=短款|beanie=针织帽|armor=盔甲|clothes=服装|formal=正式|hakama=袴|suit=套装|summer=夏季|autumn=秋季|bow=蝴蝶结|t-shirt=T 恤|elegant=优雅|lolita=洛丽塔|maid=女仆|pencil=修身直筒|top=上衣|office=通勤办公|loungewear=家居服|one-piece=连体款|print=印花|beach=海滩|blazer=西装外套|ears=耳朵|idol=偶像|muffler=围脖|obi=和服腰带|costume=扮装|plaid=格纹|purple=紫色|tank=无袖背心|bodysuit=连体衣|cap=便帽|gothic=哥特|helmet=头盔|pajamas=睡衣|bare=裸露|cape=披风|cat=猫|leotard=紧身连体练功服|necktie=领带|oversized=宽松大版|sailor=水手|striped=条纹|tail=尾巴|thighhighs=过膝袜|yukata=浴衣
collar=衣领|collared=有领|demon=恶魔|festival=节庆|girl=女孩|glasses=眼镜|halloween=万圣节|hood=兜帽|indoors=室内|lady=女士|serafuku=日式水手服|trim=饰边|witch=女巫|headdress=头饰|miko=巫女|military=军装|nurse=护士|open=敞开|party=派对|pom=绒球|sword=剑|track=田径|bonnet=软帽|bowtie=领结|christmas=圣诞|dark=深色|fashion=时装|goggles=护目镜|gown=礼服|gym=健身|horns=兽角|jersey=运动衫|kei=风格|loose=宽松|microphone=麦克风|name=名字|off-shoulder=露肩|police=警察|sports=运动|stage=舞台|tag=标签|barefoot=光脚|bike=自行车|business=商务|cheerleader=啦啦队员|chef=厨师|china=中国风|crop=短款|dougi=日式武道服|fox=狐狸|furisode=振袖|hair=头发|jirai=地雷系|labcoat=实验袍|legs=腿部|mechanical=机械风|pantyhose=连裤袜|past=复古|rabbit=兔子|riding=骑乘|santa=圣诞老人|sci-fi=科幻|shoulders=肩部|snow=雪景|sportswear=运动装|staff=长杖|streetwear=街头服饰|weapon=武器|wedding=婚礼|wings=翅膀|angel=天使|athletic=运动型
ball=舞会|band=饰带|bunny=兔子|buruma=日式运动短裤|cargo=工装|cross=十字|crown=王冠|dragon=龙|elf=精灵|evening=晚宴|fleece=抓绒|flight=飞行|glowing=发光|guitar=吉他|japanese=日式|knight=骑士|light=浅色／灯光|mage=法师|mask=面具|neckerchief=领巾|nightgown=睡裙|ninja=忍者|on=在上|outfit=穿搭|overalls=背带裤|parts=部件|pastel=粉彩色|peaked=尖顶／有帽檐|pilot=飞行员|pointy=尖形|side=侧边|skin=皮肤|slit=开衩|standing=站立|straw=草编|shinai=竹刀|string=细绳|tight=紧身|towel=毛巾|trench=风衣|tunic=束腰长上衣|visor=遮阳帽檐|wand=魔杖|wolf=狼|wrists=手腕|yoga=瑜伽
anchor=主播／锚|around=环绕|backless=露背|backpack=双肩包|ballet=芭蕾|bandages=绷带|baseball=棒球|basketball=篮球|blanket=毯子|book=书本|bouquet=花束|breastplate=胸甲|buttons=纽扣|cake=蛋糕|camouflage=迷彩|ceremony=典礼|chains=链条|classic=经典|competition=竞赛|cowboy=牛仔|cute=可爱|cyberpunk=赛博朋克|dot=圆点|duffel=行李包|fairy=仙子|female=女性|firefighter=消防员|fishnets=网眼袜|gi=武道服|golf=高尔夫|graduation=毕业|gymnastics=体操|habit=修道服|halo=光环|happi=法被|headgear=头部装备|heart=心形|high=高位|highleg=高开腿|holy=神圣|hooded=带兜帽|innertube=游泳圈|jumpsuit=连体裤|karate=空手道|katana=武士刀|kendo=剑道|kigurumi=动物连体装|knee=膝部|kotatsu=暖桌|kunai=苦无|kyuudou=弓道|lacrosse=长曲棍球|leggings=打底裤|linen=亚麻|lines=线条|mecha=机甲|mermaid=美人鱼|miniskirt=迷你裙|musume=少女|naval=海军|neck=颈部|neon=霓虹|new=新款|news=新闻|nun=修女|oni=鬼怪|pearl=珍珠|pinafore=背带裙|pirate=海盗|playboy=兔女郎风|playing=演奏／玩耍|polka=波点|polo=马球衫|poncho=斗篷|pool=泳池|princess=公主|queen=女王|racket=球拍|retro=复古|ribbed=罗纹|roman=浪漫风|ryousangata=量产型风格|sarong=纱笼|see-through=透视|shawl=披肩|shoes=鞋|shrine=神社|ski=滑雪|sleeveless=无袖|soccer=足球|spacesuit=宇航服|spring=春季|stethoscope=听诊器|suspender=吊带／背带|sweatpants=运动卫裤|sweet=甜美|swim=游泳|tailcoat=燕尾服|taishou=大正风|teacher=教师|techwear=机能风|tennis=网球|twintails=双马尾|umbrella=伞|up=向上|valentine=情人节|wa=和风|waitress=女服务员|wide=宽版|year=年份|zipper=拉链
adventurer=冒险家|alchemist=炼金术士|android=仿生人|animal=动物|antlers=鹿角|apple=苹果|arms=手臂|arts=技艺|astronaut=宇航员|attendant=服务员|aviator=飞行员|badminton=羽毛球|baggy=宽松|balaclava=巴拉克拉瓦头套|bamboo=竹子|bandeau=抹胸|bard=吟游诗人|barista=咖啡师|bartender=调酒师|bathrobe=浴袍|baton=指挥棒|birthday=生日|blossoms=花朵|bolero=短披肩|bomber=飞行员夹克|bottom=下装|boxing=拳击|bridal=新娘装|briefcase=公文包|broom=扫帚|bucket=水桶形|bulletproof=防弹|butler=管家|cable=绞花|candy=糖果|card=卡片|catsuit=紧身连体衣|cheerleading=啦啦队|cherry=樱桃|childcare=育儿|chocolate=巧克力|cleavage=乳沟|cloak=斗篷|club=社团|cocktail=鸡尾酒会|collarbone=锁骨|colors=配色|commuting=通勤|conductor=列车员／指挥|convenience=便利店|cooking=烹饪|cool=清凉／酷感|corsage=胸花|cover-up=泳装罩衫|cowgirl=女牛仔|culottes=裙裤|curtain=帘子|cutout=镂空|cycling=骑行|dagger=匕首|dancer=舞者|deerstalker=猎鹿帽|delinquent=不良学生|delivery=配送|detached=分体式|detective=侦探|diving=潜水|doctor=医生|dog=狗|double-breasted=双排扣|down=向下／羽绒|drop=下垂|drum=鼓|dumbbell=哑铃|elaborate=繁复|elbow=肘部|electric=电动|energy=能量|entrance=入口|equestrian=马术|eyepatch=眼罩|eyewear=眼镜|face=面部|fallen=堕落|fangs=獠牙|farmer=农夫|feather=羽毛|figure=身形|fingers=手指|fireworks=烟花|fish=鱼|flannel=法兰绒|florist=花艺师|flower=花|flowers=花朵|fluffy=蓬松|front=前部|full=全长|gakuran=日式立领校服|gaming=游戏|gaucho=宽腿裙裤|gear=装备|ghillie=吉利伪装服|girly=少女风|glamorous=华丽|glass=玻璃|goldfish=金鱼|guard=守卫|guest=客人
hairband=发带|hairclips=发夹|halterneck=绕颈领|hand=手|handcuffs=手铐|hatsumoude=日本新年初诣|head=头部|headphones=耳机|hero=英雄|high-waist=高腰|hinamatsuri=日本女儿节|hip=臀部|hot=火热|housework=家务|ice=冰|jinbei=甚平|joints=关节|junihitoe=十二单|kanzashi=簪饰|kitchen=厨房|kunoichi=女忍者|lanyard=挂绳|layered=叠穿|leaves=叶片|leg=腿|librarian=图书管理员|lord=领主|lute=鲁特琴|magical=魔法|magician=魔术师|magnifying=放大|maiden=少女|makeup=妆容|mandarin=中式立领|martial=武艺|mat=垫子|matching=成套|mechanic=机械师|meiji=明治风|mercenary=佣兵|messy=凌乱|micro=超短款|midriff=腰腹|mittens=连指手套|monokini=挖空连体泳衣|multiple=多个|mummy=木乃伊|naginata=薙刀|natural=自然|newscaster=新闻播报员|nontraditional=非传统|oiran=花魁|onsen=温泉|overall=工装连体款|package=包裹|pads=护垫|paladin=圣骑士|pantsuit=女式裤装套服|patissier=糕点师|paw=兽爪|peacoat=海军呢大衣|pelvic=骨盆部位|picnic=野餐|plain=素色|plate=板甲／盘子|plates=甲片／盘子|platform=厚底|plugsuit=机师紧身服|pointer=教鞭|pose=姿势|priestess=女祭司|puddle=水洼|puffer=绗缝蓬松款|pumpkin=南瓜|punk=朋克|quilted=绗缝|race=比赛|racing=赛车|rain=雨|raincoat=雨衣|randoseru=日式学生书包|rash=防晒泳衣|receptionist=接待员|red-framed=红框|reindeer=驯鹿|rhythmic=韵律|rifle=长枪|rolled=卷起|room=房间|running=跑步|ryouiki=绝对领域风|samurai=武士|sarashi=晒布裹带|scales=鳞片|schoolgirl=女学生|scientist=科学家|scrubs=手术服|seashell=贝壳|secretary=秘书|sequin=亮片|set=套组|setsubun=节分|shearling=羊剪绒|shield=盾牌|shinobi=忍者|shoulder=肩部|side-tie=侧面系带|singer=歌手|single=单件|sitting=坐姿|skates=冰鞋／轮滑鞋|skating=滑冰／轮滑
slacks=西裤|sleepwear=睡衣|sleepy=困倦|slingshot=弹弓|slip=衬裙|small=小型|soft=柔软|space=太空|sparkle=闪光|spear=矛|sporty=运动风|spy=特工|star=星形|stick=棍棒|store=商店|strapless=无肩带|street=街头|stretching=伸展|stripes=条纹|subculture=亚文化|succubus=魅魔|sun=阳光|sundress=夏日裙装|surfboard=冲浪板|suspenders=背带|sweatshirt=卫衣|swordswoman=女剑客|tactical=战术风|tags=标牌|tails=尾巴|tanabata=七夕|tankini=分体背心式泳装|thief=盗贼|throne=王座|tiara=冠饰|tiered=层叠式|tiger=老虎|torn=破损|train=列车／拖尾|tray=托盘|tsunokakushi=角隐（新娘头饰）|tucked=扎入|tutu=芭蕾短纱裙|uchikake=打挂和服|under=在下|underwater=水下|unicorn=独角兽|untucked=下摆外放|valkyrie=女武神|vampire=吸血鬼|veil=面纱|vial=小药瓶|visual=视觉|volleyball=排球|walking=步行|washing=清洗|water=水|wear=穿着|western=西部风|wetsuit=潜水服|winged=有翼|wizard=巫师|worker=工作人员|wrapped=裹身|wrench=扳手|yamikawa=病娇可爱风|yumekawa=梦幻可爱风|zettai=绝对领域风|zombie=僵尸
    `;
    const tags = new Map(lexicon.trim().split(/[|\n]/).map(pair => pair.split('=')));
    const maxPhrase = Math.max(...Array.from(tags.keys(), key => key.split(' ').length));
    const keywordCache = new Map();

    function keywords(text) {
        if (keywordCache.has(text)) return keywordCache.get(text);
        const result = {text: '', partial: false};
        const hits = [];
        for (const chunk of text.toLowerCase().split(/[,;/]+/)) {
            const terms = chunk.match(/[a-z\d]+(?:['-][a-z\d]+)*/g) || [];
            for (let start = 0; start < terms.length;) {
                let size = Math.min(maxPhrase, terms.length - start);
                while (size > 0) {
                    const key = terms.slice(start, start + size).join(' ');
                    if (tags.has(key)) { hits.push(tags.get(key)); break; }
                    size--;
                }
                if (!size && terms[start] !== 'a' && terms[start] !== 'the' && terms[start] !== 'of') result.partial = true;
                start += size || 1;
            }
        }
        result.text = [...new Set(hits)].join(' · ');
        if (keywordCache.size >= 512) keywordCache.clear();
        keywordCache.set(text, result);
        return result;
    }

    function fingerprint(text) {
        let hash = 0x811c9dc5;
        for (let i = 0; i < text.length; ++i) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
        return (hash >>> 0).toString(36);
    }

    const depthCard = '.card[data-k^="d:"]';
    function localizeCard(card) {
        const item = app.ITEMS[card.dataset.k];
        const sub = card.querySelector('.sub:not(.dim)');
        if (!sub || item?.type !== 'depth' || !Array.isArray(item.angles)) return;
        const angle = item.angles[item.ai]?.zh;
        const text = app.st.lang === 'en' && item.en ? item.en : `${angle ? angle + ' · ' : ''}${item.angles.length} 个角度`;
        const original = item.ja || '';
        const detail = sub.querySelector('[lang="ja"]');
        if (sub.firstChild?.nodeValue === text && detail?.textContent === (original || undefined)) return;
        sub.textContent = text;
        if (original) {
            const japanese = element('span', original);
            japanese.lang = 'ja';
            japanese.title = original;
            // Give Japanese its own line so narrow cards cannot ellipsize it away behind Chinese.
            japanese.style.cssText = 'display:block;overflow:hidden;text-overflow:ellipsis';
            sub.append(japanese);
        }
    }
    function localizeVisibleCards() { grid.querySelectorAll(depthCard).forEach(localizeCard); }
    const gridObserver = new MutationObserver(records => {
        const cards = new Set();
        for (const record of records) {
            const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
            const card = target?.closest(depthCard);
            if (card && grid.contains(card)) cards.add(card);
            if (target === grid) for (const node of record.addedNodes) {
                if (node.nodeType === 1 && node.matches(depthCard) && grid.contains(node)) cards.add(node);
            }
        }
        cards.forEach(localizeCard);
    });
    gridObserver.observe(grid, {childList: true, subtree: true, characterData: true});
    new MutationObserver(localizeVisibleCards).observe(document.documentElement, {attributes: true, attributeFilter: ['data-lang']});

    function element(tag, text) {
        const node = document.createElement(tag);
        node.textContent = text;
        return node;
    }
    function block(label, text, copyLabel) {
        const box = document.createElement('div');
        box.className = 'pbox';
        box.dataset.pwGalleryZh = '';
        box.lang = 'zh-CN';
        box.append(element('small', label), element('p', text));
        if (copyLabel && typeof app.copy === 'function') {
            const button = element('button', copyLabel);
            button.className = 'sm';
            button.type = 'button';
            button.addEventListener('click', () => app.copy(text, label));
            box.append(button);
        }
        return box;
    }

    function localizeDetail() {
        if (lightbox.hidden || side.querySelector('[data-pw-gallery-zh]')) return;
        const item = app.st.list?.[app.li()];
        const zhBox = side.querySelector('.pbox:not(.en)');
        if (!item || !zhBox) return;
        const entry = richChinese[item.type + ':' + item.id];
        if (entry && item.zh === item.ti && typeof item.en === 'string' && entry[0] === fingerprint(item.en)) {
            const localized = block('详细描述（中文译文）', entry[1], '复制详细译文');
            zhBox.after(localized);
            const enBox = side.querySelector('.pbox.en');
            if (enBox && typeof item.ja === 'string' && item.ja && item.ja !== item.ti) {
                const originalName = element('div', '日文原名：');
                const name = element('span', item.ja);
                name.lang = 'ja';
                originalName.className = 'jp';
                originalName.append(name);
                (app.st.lang === 'en' ? localized : enBox).after(originalName);
            }
        }
        if ((item.type === 'costume' || item.type === 'anime') && typeof item.kw === 'string' && item.kw) {
            const translation = keywords(item.kw);
            const original = Array.from(side.children).find(node => node.matches('.jp') && node.textContent.startsWith('原始关键词：'));
            if (translation.text && original) zhBox.after(block(translation.partial ? '中文关键词（部分）' : '中文关键词', translation.text));
        }
        // In hair, kw and en are the same on the published dataset; the existing localized
        // hairstyle description/name and English prompt already display the same concepts.
        // The browser site's ownership of raw keyword and prompt boxes (and copy actions) stays intact.
    }
    const detailObserver = new MutationObserver(localizeDetail);
    detailObserver.observe(side, {childList: true});
    detailObserver.observe(lightbox, {attributes: true, attributeFilter: ['hidden']});
    localizeVisibleCards();
    localizeDetail();
})();
