// ----------------------------------------------------
// [HACK BẢO MẬT] BYPASS 403 & CORS CHO GOOGLE TTS TRÊN LOCALHOST
// ----------------------------------------------------
if (!document.querySelector('meta[name="referrer"]')) {
    let meta = document.createElement('meta');
    meta.name = "referrer";
    meta.content = "no-referrer";
    document.head.appendChild(meta);
    console.log("🛡️ Đã kích hoạt khiên chống chặn Referer cho Localhost");
}

// ----------------------------------------------------
// [BẢO VỆ TÊN THƯƠNG HIỆU] KHÔNG DỊCH "ONION TECH"
// ----------------------------------------------------
function protectBrandName() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.nodeValue.match(/Onion Tech/i)) {
            let parent = node.parentElement;
            if (parent && parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE' && !parent.classList.contains('notranslate')) {
                nodesToReplace.push(node);
            }
        }
    }
    nodesToReplace.forEach(n => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = n.nodeValue.replace(/(Onion Tech)/gi, '<span class="notranslate">$1</span>');
        while(tempDiv.firstChild) {
            n.parentNode.insertBefore(tempDiv.firstChild, n);
        }
        n.parentNode.removeChild(n);
    });
}

// ----------------------------------------------------
// [HỆ THỐNG DỊCH TỰ ĐỘNG] TIÊM GOOGLE TRANSLATE ELEMENT & ẨN KHUNG BANNER TẬN GỐC
// ----------------------------------------------------
function injectGoogleTranslate() {
    if (!document.getElementById('google_translate_element')) {
        const style = document.createElement('style');
        style.id = 'anti-google-translate-banner';
        style.innerHTML = `
            .goog-te-banner-frame, .goog-te-banner-frame.skiptranslate, iframe.goog-te-banner-frame,
            .VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf, body > .skiptranslate > iframe { 
                display: none !important; visibility: hidden !important; opacity: 0 !important;
                height: 0px !important; width: 0px !important; position: absolute !important;
                top: -9999px !important; z-index: -1 !important; pointer-events: none !important;
            }
            html { top: 0px !important; position: static !important; }
            body { top: 0px !important; position: static !important; margin-top: 0px !important; }
            #goog-gt-tt, .goog-tooltip, .goog-tooltip:hover { display: none !important; visibility: hidden !important; opacity: 0 !important; }
            .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
            #google_translate_element { display: none !important; }
        `;
        document.documentElement.appendChild(style);

        const gtDiv = document.createElement('div');
        gtDiv.id = 'google_translate_element';
        gtDiv.style.display = 'none'; 
        document.body.appendChild(gtDiv);

        window.googleTranslateElementInit = function() {
            new google.translate.TranslateElement({ pageLanguage: 'vi', autoDisplay: false }, 'google_translate_element');
        };

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.head.appendChild(script);

        const enforceNoBanner = () => {
            if (document.body && document.body.style.top !== '0px') document.body.style.setProperty('top', '0px', 'important');
            if (document.documentElement && document.documentElement.style.top !== '0px') document.documentElement.style.setProperty('top', '0px', 'important');
        };

        setInterval(enforceNoBanner, 100);
        setInterval(() => {
            if (currentLang === 'en') {
                document.querySelectorAll('font').forEach(font => {
                    if (font.innerText === 'Gate' || font.innerText === 'gate') font.innerText = 'Home';
                });
            }
        }, 1500);
    }
}

// ----------------------------------------------------
// 1. TỪ ĐIỂN ĐA NGÔN NGỮ & TÊN TRANG THÂN THIỆN
// ----------------------------------------------------
const logContent = document.getElementById("log-content");
const aiStatusText = document.getElementById("ai-status-text");

let currentLang = 'vi'; 
const supportedLangs = ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'es'];

function generateMultiLangDictionary() {
    return {
        'vi': { lang_switched: "Đã chuyển đổi toàn bộ nội dung sang Tiếng Việt.", navigating: (p) => `Đang chuyển hướng tới trang ${p}.`, handOn: "Đã bật chế độ điều khiển bằng cử chỉ tay.", handOff: "Đã tắt chế độ điều khiển bằng cử chỉ tay.", voiceOn: "Đã bật chế độ điều khiển bằng giọng nói.", voiceOff: "Đã tắt nhận diện giọng nói.", who_am_i: "Tôi là trợ lý AI của Onion Tech Support.", game_start: "Ứng dụng đã khởi động!", game_stop: "Đã thoát ứng dụng." },
        'en': { lang_switched: "All content has been translated to English.", navigating: (p) => `Navigating to ${p} page.`, handOn: "Hand gesture control mode activated.", voiceOn: "Voice control mode activated.", who_am_i: "I am the AI assistant of Onion Tech.", game_start: "App started!", game_stop: "App exited." },
        'zh': { lang_switched: "所有内容已翻译成中文。", navigating: (p) => `正在导航到 ${p} 页面。`, handOn: "手势控制模式已开启。", voiceOn: "语音控制模式已开启。", who_am_i: "我是 Onion Tech 的 AI 助手。", game_start: "应用已启动!", game_stop: "已退出." }
    };
}
const i18nData = generateMultiLangDictionary();

function addLogToUI(message, type = "log-sys") {
    const logEl = document.createElement("div");
    logEl.className = `log-msg ${type}`;
    logEl.innerHTML = message.replace(/(Onion Tech)/gi, '<span class="notranslate">$1</span>');
    if(logContent) {
        logContent.appendChild(logEl);
        logContent.scrollTop = logContent.scrollHeight;
    }
}

// ----------------------------------------------------
// [FACE TRACKING & PRESENCE LOGIC]
// ----------------------------------------------------
let isPersonPresent = false;
let presenceTimeout = null;
let faceDetection = null;

function updatePresence() {
    if (!isPersonPresent) {
        isPersonPresent = true;
        if (!isAISpeaking) setAIAvatarState('wave'); 
    }
    clearTimeout(presenceTimeout);
    presenceTimeout = setTimeout(() => {
        isPersonPresent = false;
        if (!isAISpeaking) setAIAvatarState('idle'); 
    }, 2000); 
}

async function initFaceDetection() {
    if (!window.FaceDetection) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }
    if (!faceDetection) {
        faceDetection = new FaceDetection({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`});
        faceDetection.setOptions({ model: 'short', minDetectionConfidence: 0.5 });
        faceDetection.onResults((results) => {
            if (results.detections && results.detections.length > 0) { updatePresence(); }
        });
    }
}

// ----------------------------------------------------
// [AVATAR] HỆ THỐNG ĐIỀU KHIỂN VIDEO AVATAR AI 
// ----------------------------------------------------
let activeVideoIndex = 1;
let isAvatarTransitioning = false; 

function setAIAvatarState(state) {
    const originalVideo = document.querySelector('video.sidebar-video');
    if (!originalVideo) return;

    if (!originalVideo.dataset.buffered) {
        originalVideo.dataset.buffered = "true";
        originalVideo.id = "avatar-vid-1";
        originalVideo.style.position = "absolute"; originalVideo.style.top = "0"; originalVideo.style.left = "0";
        originalVideo.style.width = "100%"; originalVideo.style.height = "100%"; originalVideo.style.objectFit = "cover";
        originalVideo.style.zIndex = "1"; originalVideo.style.opacity = "1"; originalVideo.muted = true; 

        const parent = originalVideo.parentElement;
        parent.style.position = "relative"; parent.style.overflow = "hidden"; parent.style.backgroundColor = "#000"; 

        const clone = originalVideo.cloneNode(true);
        clone.id = "avatar-vid-2"; clone.style.zIndex = "0"; clone.style.opacity = "0"; clone.muted = true;
        clone.removeAttribute('autoplay');
        parent.appendChild(clone);
    }

    let targetSrc = "images/idle.mp4"; 
    if (state === 'sad') targetSrc = "images/Sad.mp4";
    else if (state === 'speaking') targetSrc = Math.random() > 0.5 ? "images/Voice 1.mp4" : "images/Voice 2.mp4";
    else if (state === 'wave') targetSrc = "images/Wave hand.mp4";

    const cleanTargetSrc = targetSrc.replace(/ /g, "%20");
    let vid1 = document.getElementById('avatar-vid-1');
    let vid2 = document.getElementById('avatar-vid-2');
    let currentVid = activeVideoIndex === 1 ? vid1 : vid2;
    let nextVid = activeVideoIndex === 1 ? vid2 : vid1;

    if (!currentVid.src.includes(cleanTargetSrc)) {
        if (isAvatarTransitioning) return;
        isAvatarTransitioning = true;
        nextVid.src = targetSrc; nextVid.loop = true; nextVid.muted = true;
        nextVid.style.transition = "none"; nextVid.style.opacity = "0"; nextVid.style.zIndex = "2"; currentVid.style.zIndex = "1"; 

        const onPlaying = () => {
            nextVid.removeEventListener("playing", onPlaying);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    nextVid.style.transition = "opacity 0.4s ease-in-out"; nextVid.style.opacity = "1";
                    setTimeout(() => {
                        currentVid.style.transition = "none"; currentVid.style.opacity = "0"; currentVid.pause();
                        activeVideoIndex = activeVideoIndex === 1 ? 2 : 1;
                        isAvatarTransitioning = false; 
                    }, 450); 
                });
            });
        };
        nextVid.addEventListener("playing", onPlaying);
        nextVid.load(); nextVid.play().catch(e => { isAvatarTransitioning = false; });
    } else {
        currentVid.play().catch(e => console.log(e));
    }
}

// ----------------------------------------------------
// HỆ THỐNG ZOOM ẢNH VÀ QUẢN LÝ SLIDER
// ----------------------------------------------------
window.isImageZoomed = false;
window.zoomedImageOverlay = null;

function openImageZoom(src) {
    if (window.zoomedImageOverlay) return;
    window.isImageZoomed = true;
    document.body.classList.add('slider-paused');
    const swipers = document.querySelectorAll('.swiper, .swiper-container');
    swipers.forEach(s => { if(s.swiper && s.swiper.autoplay) s.swiper.autoplay.stop(); });

    window.zoomedImageOverlay = document.createElement('div');
    window.zoomedImageOverlay.id = 'zoomed-image-overlay';
    window.zoomedImageOverlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; justify-content: center; align-items: center; cursor: pointer; opacity: 0; transition: opacity 0.3s ease;`;
    
    const img = document.createElement('img'); img.src = src;
    img.style.cssText = `max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); transform: scale(0.8); transition: transform 0.3s ease;`;
    
    window.zoomedImageOverlay.appendChild(img); document.body.appendChild(window.zoomedImageOverlay);
    requestAnimationFrame(() => { window.zoomedImageOverlay.style.opacity = '1'; img.style.transform = 'scale(1)'; });
    window.zoomedImageOverlay.addEventListener('click', closeImageZoom);
}

function closeImageZoom() {
    if (!window.zoomedImageOverlay) return;
    window.zoomedImageOverlay.style.opacity = '0';
    window.zoomedImageOverlay.querySelector('img').style.transform = 'scale(0.8)';
    setTimeout(() => {
        if (window.zoomedImageOverlay && window.zoomedImageOverlay.parentNode) window.zoomedImageOverlay.parentNode.removeChild(window.zoomedImageOverlay);
        window.zoomedImageOverlay = null; window.isImageZoomed = false;
        document.body.classList.remove('slider-paused');
        const swipers = document.querySelectorAll('.swiper, .swiper-container');
        swipers.forEach(s => { if(s.swiper && s.swiper.autoplay) s.swiper.autoplay.start(); });
    }, 300);
}

document.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG' && !e.target.closest('#game-container, #virtual-cursor, .sidebar-video, .model-box, #google_translate_element, button, a') && !e.target.classList.contains('no-zoom')) {
        openImageZoom(e.target.src);
    }
});

window.addEventListener('DOMContentLoaded', () => {
    if (document.cookie.includes('googtrans=/vi/en')) { document.cookie = "googtrans=/vi/vi; path=/"; }
    setAIAvatarState('idle'); injectGoogleTranslate(); protectBrandName(); 
});

// ----------------------------------------------------
// 2. TTS - GOOGLE NATIVE VOICE 
// ----------------------------------------------------
let isAISpeaking = false; 
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null; let audioQueue = []; let currentAudioObj = null;

function speakAI(text, lang = currentLang, isError = false) {
    if (currentAudioObj) { currentAudioObj.pause(); currentAudioObj = null; }
    audioQueue = []; isAISpeaking = true; 
    if (isVoiceListening && recognition) { try { recognition.stop(); } catch(e) {} }
    setAIAvatarState(isError ? 'sad' : 'speaking');

    let cleanText = text.replace(/[*_#\n]/g, " ").replace(/\s+/g, " ").trim();
    if (!cleanText) { playNextAudioQueue(); return; }

    let tl = lang === 'en' ? 'en' : lang === 'zh' || lang === 'zh-CN' ? 'zh-CN' : lang === 'ko' ? 'ko' : lang === 'ja' ? 'ja' : lang === 'fr' ? 'fr' : lang === 'de' ? 'de' : lang === 'es' ? 'es' : 'vi';
    let chunks = cleanText.match(/[^.?!,;]+[.?!,;]+/g) || [cleanText]; 

    chunks.forEach(chunk => {
        if (chunk.trim() !== "") audioQueue.push(`https://translate.googleapis.com/translate_tts?client=tw-ob&ie=UTF-8&tl=${tl}&q=${encodeURIComponent(chunk.trim())}`);
    });
    playNextAudioQueue();
}

function playNextAudioQueue() {
    if (audioQueue.length === 0) {
        isAISpeaking = false; setAIAvatarState(isPersonPresent ? 'wave' : 'idle'); 
        if (isVoiceListening && recognition) { setTimeout(() => { if(isVoiceListening) { try { recognition.start(); } catch(e) {} } }, 500); }
        return;
    }
    currentAudioObj = new Audio(audioQueue.shift());
    currentAudioObj.onended = () => { playNextAudioQueue(); };
    currentAudioObj.onerror = () => { playNextAudioQueue(); };
    let playPromise = currentAudioObj.play();
    if (playPromise !== undefined) playPromise.catch(error => { playNextAudioQueue(); });
}

function updateAIAssistant(text, speak = true, lang = currentLang, isError = false) {
    if (aiStatusText) {
        aiStatusText.innerHTML = text.replace(/(Onion Tech)/gi, '<span class="notranslate">$1</span>');
        aiStatusText.style.animation = 'none'; aiStatusText.offsetHeight; aiStatusText.style.animation = 'fadeIn 0.5s';
    }
    addLogToUI(`🤖 AI: "${text}"`, "log-gemini");
    if (speak) speakAI(text, lang, isError);
}

function switchWebsiteLanguage(targetLang) {
    if (!supportedLangs.includes(targetLang)) targetLang = 'en';
    currentLang = targetLang; 
    addLogToUI(`🌐 Đã chuyển ngôn ngữ website sang: ${targetLang.toUpperCase()}`, "log-success");
    const triggerTranslation = (selectEl) => {
        selectEl.value = targetLang === 'zh' ? 'zh-CN' : targetLang;
        selectEl.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    };
    let gtSelect = document.querySelector('select.goog-te-combo');
    if (gtSelect) triggerTranslation(gtSelect);
    else {
        let attempts = 0;
        let interval = setInterval(() => {
            let retrySelect = document.querySelector('select.goog-te-combo');
            if (retrySelect) { triggerTranslation(retrySelect); clearInterval(interval); }
            attempts++; if(attempts > 20) clearInterval(interval); 
        }, 100);
    }
    let dict = i18nData[currentLang] || i18nData['en'];
    updateAIAssistant(dict.lang_switched, true, targetLang);
}

function loadContent(pageId) {
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => section.classList.remove('active'));
    const activeSection = document.getElementById(pageId);
    if (activeSection) activeSection.classList.add('active');
}

function navigateTo(page, sectionId = "", speakAI_flag = true) {
    if (page) {
        loadContent(page);
        if (speakAI_flag) {
            let dict = i18nData[currentLang] || i18nData['en'];
            if (dict && dict.navigating) updateAIAssistant(dict.navigating(page), true, currentLang); 
        }
        if (sectionId) {
            setTimeout(() => {
                const targetEl = document.getElementById(sectionId);
                if (targetEl) { targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            }, 100); 
        }
    }
}

const pagesOrder = ['home', 'product', 'vr', 'ar', 'detection', 'solution', 'company', 'contact'];
function movePage(direction) {
    const currentActive = document.querySelector('.page-section.active');
    let currentIndex = currentActive ? pagesOrder.indexOf(currentActive.id) : 0;
    if (currentIndex === -1) currentIndex = 0;
    let nextIndex = (currentIndex + direction + pagesOrder.length) % pagesOrder.length;
    navigateTo(pagesOrder[nextIndex], "", true);
}

function toggleFullScreen(forceExit = false) {
    const container = document.getElementById('game-container');
    const fsBtnIcon = document.querySelector('#btn-fullscreen i');
    if (forceExit || container.classList.contains('fake-fullscreen')) {
        container.classList.remove('fake-fullscreen');
        if (fsBtnIcon) fsBtnIcon.className = "fas fa-expand";
        addLogToUI("🗗 Đã THOÁT chế độ toàn màn hình", "log-sys");
    } else {
        container.classList.add('fake-fullscreen');
        if (fsBtnIcon) fsBtnIcon.className = "fas fa-compress";
        addLogToUI("🗖 Đã BẬT chế độ toàn màn hình", "log-success");
    }
}

// ----------------------------------------------------
// 3. HỆ THỐNG GAME DEMO & BIẾN COOLDOWN
// ----------------------------------------------------
let isGaming = false;
let activeGameType = 'shooter'; 
let gameLoopId = null;
let isGameOver = false;

const SMOOTH_FACTOR = 0.25; 
let targetShips = [ { x: 350, y: 440 }, { x: 450, y: 440 } ]; 
let targetPaddles = [ { x: 150, y: 250 }, { x: 650, y: 250 } ]; 
let smoothCursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

let shooterScore = 0; let shooterGameStarted = false; 
let shooterSlots = [
    { x: 350, y: 440, hp: 10, maxHp: 10, hasJoined: false, isDead: false, isTracking: false },
    { x: 450, y: 440, hp: 10, maxHp: 10, hasJoined: false, isDead: false, isTracking: false }
];
let bullets = []; let enemies = []; let enemyBullets = []; let frameCount = 0;
let stars = [];
for (let i = 0; i < 60; i++) { stars.push({ x: Math.random() * 800, y: Math.random() * 500, size: Math.random() * 2 + 1, speed: Math.random() * 1.5 + 0.5 }); }

let hockeyPuck = { x: 400, y: 250, vx: 0, vy: 0, radius: 16 };
let hockeyScore = { blue: 0, red: 0 };
let hockeyPaddles = [
    { x: 150, y: 250, vx: 0, vy: 0, radius: 32, color: '#00ffff', innerColor: '#0088aa' },
    { x: 650, y: 250, vx: 0, vy: 0, radius: 32, color: '#ff1744', innerColor: '#aa0022' }
];

function startGame(type) {
    if (type === 'random' || !type) type = Math.random() > 0.5 ? 'shooter' : 'hockey';
    activeGameType = type;
    navigateTo('detection', '', false);
    
    document.getElementById('detection-normal-list').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    
    // Reset wrapper displays
    document.getElementById('canvas-game-wrapper').style.display = 'none';
    document.getElementById('stylist-game-wrapper').style.display = 'none';
    document.getElementById('game-status-hud').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';

    isGaming = true; isGameOver = false;
    toggleHandTracking(true);
    
    if (type === 'stylist') {
        document.getElementById('stylist-game-wrapper').style.display = 'flex';
        document.getElementById('game-title').innerHTML = `<i class="fas fa-magic"></i> Face Recognition & AI Stylist`;
        initStylist();
        addLogToUI("🎮 Đã mở Game: AI Stylist", "log-success");
    } 
    else {
        document.getElementById('canvas-game-wrapper').style.display = 'block';
        document.getElementById('game-status-hud').style.display = 'inline-block';
        
        if (type === 'shooter') {
            document.getElementById('game-title').innerHTML = `<i class="fas fa-space-shuttle"></i> Game 1: Space Invaders`;
            shooterScore = 0; shooterGameStarted = false;
            shooterSlots[0].hp = 10; shooterSlots[0].hasJoined = false; shooterSlots[0].isDead = false; shooterSlots[0].isTracking = false;
            shooterSlots[1].hp = 10; shooterSlots[1].hasJoined = false; shooterSlots[1].isDead = false; shooterSlots[1].isTracking = false;
            targetShips = [ { x: 350, y: 440 }, { x: 450, y: 440 } ];
            bullets = []; enemies = []; enemyBullets = []; frameCount = 0;
            document.getElementById('game-status-hud').innerText = `Score: 0`;
            addLogToUI("🎮 Đã mở Game 1: Bắn Ruồi", "log-success");
        } else if (type === 'hockey') {
            document.getElementById('game-title').innerHTML = `<i class="fas fa-table-tennis"></i> Game 2: Air Hockey`;
            hockeyScore = { blue: 0, red: 0 }; resetHockeyPuck();
            document.getElementById('game-status-hud').innerText = `Score: 0`;
            addLogToUI("🎮 Đã mở Game 2: Khúc Côn Cầu", "log-success");
        }
    }
    
    let dict = i18nData[currentLang] || i18nData['en'];
    if (dict.game_start) updateAIAssistant(dict.game_start);
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoop();

    // === TÍNH NĂNG MỚI: TỰ ĐỘNG KÉO XUỐNG GIỮA MÀN HÌNH ===
    setTimeout(() => {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 300);
}

function stopGame() {
    if (!isGaming) return;
    isGaming = false; isGameOver = false;
    
    stopStylist(); // Cleanup for AI Stylist
    
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    toggleFullScreen(true); 
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('detection-normal-list').style.display = 'block';
    
    addLogToUI("🛑 Đã thoát App", "log-sys");
    let dict = i18nData[currentLang] || i18nData['en'];
    if (dict.game_stop) updateAIAssistant(dict.game_stop);

    // === TÍNH NĂNG MỚI: TỰ ĐỘNG KÉO LÊN ĐẦU TRANG ===
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
}

function resetCurrentGame() {
    if (!isGaming) return;
    isGameOver = false;
    document.getElementById('game-over-overlay').style.display = 'none';
    
    if (activeGameType === 'stylist') {
        resetStylist();
        addLogToUI("🔄 Đã chơi lại (Reset) AI Stylist", "log-success");
    } else if (activeGameType === 'shooter') {
        shooterScore = 0; shooterGameStarted = false;
        shooterSlots[0].hp = 10; shooterSlots[0].isDead = false; shooterSlots[0].hasJoined = false; shooterSlots[0].isTracking = false;
        shooterSlots[1].hp = 10; shooterSlots[1].isDead = false; shooterSlots[1].hasJoined = false; shooterSlots[1].isTracking = false;
        targetShips = [ { x: 350, y: 440 }, { x: 450, y: 440 } ];
        bullets = []; enemies = []; enemyBullets = []; frameCount = 0;
        document.getElementById('game-status-hud').innerText = `Score: 0`;
        addLogToUI("🔄 Đã chơi lại (Reset) Game Bắn Ruồi", "log-success");
    } else if (activeGameType === 'hockey') {
        hockeyScore = { blue: 0, red: 0 }; resetHockeyPuck();
        targetPaddles = [ { x: 150, y: 250 }, { x: 650, y: 250 } ];
        document.getElementById('game-status-hud').innerText = `Score: 0`;
        addLogToUI("🔄 Đã chơi lại (Reset) Game Khúc Côn Cầu", "log-success");
    }
}

function resetHockeyPuck() { hockeyPuck = { x: 400, y: 250, vx: 0, vy: 0, radius: 16 }; }

function gameLoop() {
    if (!isGaming) return;
    if (activeGameType !== 'stylist') {
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (activeGameType === 'shooter') renderShooterGame(ctx);
            else if (activeGameType === 'hockey') renderHockeyGame(ctx);
            
            if (isGameOver) {
                document.getElementById('game-over-overlay').style.display = 'flex';
            }
        }
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

function renderShooterGame(ctx) {
    ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, 800, 500);
    let joinedShips = shooterSlots.filter(s => s.hasJoined);
    let trackingShips = shooterSlots.filter(s => s.isTracking && !s.isDead);
    if (trackingShips.length > 0) shooterGameStarted = true;
    let isPaused = shooterGameStarted && trackingShips.length === 0 && !isGameOver;

    ctx.fillStyle = '#ffffff';
    stars.forEach(s => { 
        ctx.fillRect(s.x, s.y, s.size, s.size); 
        if (!isGameOver && !isPaused) { s.y += s.speed; if (s.y > 500) s.y = 0; } 
    });

    if (!isPaused && !isGameOver) {
        frameCount++;
        if (frameCount % 45 === 0 && enemies.length < 10) {
            enemies.push({ x: Math.random() * 700 + 50, y: -30, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 1.5 + 1.5, pattern: Math.floor(Math.random() * 3), timer: 0 });
        }
        if (frameCount % 12 === 0) {
            trackingShips.forEach(p => { bullets.push({ x: p.x, y: p.y - 20 }); });
        }

        for (let i = bullets.length - 1; i >= 0; i--) { bullets[i].y -= 10; if (bullets[i].y < 0) bullets.splice(i, 1); }

        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i]; e.timer++;
            if (e.pattern === 0) { e.x += e.vx; e.y += e.vy; } else if (e.pattern === 1) { e.y += e.vy; e.x += Math.sin(e.timer * 0.08) * 5; } else { e.x += e.vx * 1.5; e.y += e.vy * 1.2; }
            if (e.x < 20 || e.x > 780) e.vx *= -1;
            if (Math.random() < 0.02) enemyBullets.push({ x: e.x, y: e.y + 20, vx: (Math.random() - 0.5) * 3, vy: 5 });

            let hitEnemy = false;
            for (let j = bullets.length - 1; j >= 0; j--) {
                if (Math.hypot(bullets[j].x - e.x, bullets[j].y - e.y) < 25) { bullets.splice(j, 1); hitEnemy = true; shooterScore += 10; break; }
            }
            for (let j = 0; j < trackingShips.length; j++) {
                let p = trackingShips[j];
                if (Math.hypot(e.x - p.x, e.y - p.y) < 30) { p.hp -= 1; if (p.hp <= 0) { p.isDead = true; } hitEnemy = true; break; }
            }
            if (hitEnemy) enemies.splice(i, 1); else if (e.y > 530) enemies.splice(i, 1);
        }

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            let eb = enemyBullets[i]; eb.x += eb.vx; eb.y += eb.vy;
            let hitPlayer = false;
            for (let j = 0; j < trackingShips.length; j++) {
                let p = trackingShips[j];
                if (Math.hypot(eb.x - p.x, eb.y - p.y) < 25) { p.hp -= 1; if (p.hp <= 0) { p.isDead = true; } hitPlayer = true; break; }
            }
            if (hitPlayer) enemyBullets.splice(i, 1); else if (eb.y > 520) enemyBullets.splice(i, 1);
        }
    }

    ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 8; ctx.shadowColor = '#ffffff';
    for (let i = 0; i < bullets.length; i++) { let b = bullets[i]; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ff1744'; ctx.shadowBlur = 12; ctx.shadowColor = '#ff1744';
    for (let i = 0; i < enemies.length; i++) { let e = enemies[i]; ctx.beginPath(); ctx.moveTo(e.x, e.y + 20); ctx.lineTo(e.x - 18, e.y - 15); ctx.lineTo(e.x + 18, e.y - 15); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#ff1744'; ctx.shadowBlur = 8; ctx.shadowColor = '#ff1744';
    for (let i = 0; i < enemyBullets.length; i++) { let eb = enemyBullets[i]; ctx.beginPath(); ctx.arc(eb.x, eb.y, 5, 0, Math.PI * 2); ctx.fill(); }

    if (shooterGameStarted && joinedShips.length > 0 && joinedShips.every(s => s.isDead)) { isGameOver = true; document.getElementById('game-over-title').innerHTML = "GAME OVER - HẾT MÁU!"; }

    document.getElementById('game-status-hud').innerText = `Score: ${shooterScore}`;

    ctx.shadowBlur = 15; ctx.shadowColor = '#00e5ff';
    trackingShips.forEach((p) => {
        ctx.fillStyle = '#00e5ff'; ctx.beginPath(); ctx.moveTo(p.x, p.y - 25); ctx.lineTo(p.x - 20, p.y + 18); ctx.lineTo(p.x + 20, p.y + 18); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(p.x, p.y + 22, 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#ff1744'; ctx.fillRect(p.x - 15, p.y - 35, 30, 4);
        ctx.fillStyle = '#00ffcc'; ctx.fillRect(p.x - 15, p.y - 35, 30 * (p.hp / p.maxHp), 4); 
    });
    ctx.shadowBlur = 0;

    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, 0, 800, 500);
        ctx.fillStyle = '#ffeb3b'; ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', 400, 240);
        ctx.fillStyle = '#ffffff'; ctx.font = '20px "Segoe UI", Arial, sans-serif'; ctx.fillText('Đưa tay vào Camera để tiếp tục', 400, 280); ctx.textAlign = 'left';
    }
}

function renderHockeyGame(ctx) {
    ctx.fillStyle = '#0b132b'; ctx.fillRect(0, 0, 800, 500);
    ctx.strokeStyle = '#3a506b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(400, 500); ctx.stroke();
    ctx.beginPath(); ctx.arc(400, 250, 60, 0, Math.PI * 2); ctx.stroke();

    if (isGameOver) return;

    ctx.fillStyle = '#00ffff'; ctx.shadowBlur = 10; ctx.shadowColor = '#00ffff';
    ctx.fillRect(0, 160, 20, 10); ctx.fillRect(0, 330, 20, 10); ctx.fillRect(0, 170, 8, 160);
    ctx.fillStyle = '#ff1744'; ctx.shadowColor = '#ff1744';
    ctx.fillRect(780, 160, 20, 10); ctx.fillRect(780, 330, 20, 10); ctx.fillRect(792, 170, 8, 160);
    ctx.shadowBlur = 0;

    hockeyPaddles.forEach(pad => { pad.vx *= 0.8; pad.vy *= 0.8; });
    hockeyPuck.x += hockeyPuck.vx; hockeyPuck.y += hockeyPuck.vy;
    hockeyPuck.vx *= 0.985; hockeyPuck.vy *= 0.985;
    if (Math.abs(hockeyPuck.vx) < 0.15) hockeyPuck.vx = 0; if (Math.abs(hockeyPuck.vy) < 0.15) hockeyPuck.vy = 0;

    if (hockeyPuck.y - hockeyPuck.radius < 0 || hockeyPuck.y + hockeyPuck.radius > 500) {
        hockeyPuck.vy *= -1; hockeyPuck.y = Math.max(hockeyPuck.radius, Math.min(500 - hockeyPuck.radius, hockeyPuck.y));
    }
    if (hockeyPuck.x - hockeyPuck.radius < 0) {
        if (hockeyPuck.y > 170 && hockeyPuck.y < 330) { hockeyScore.red += 1; checkHockeyWinner(); resetHockeyPuck(); }
        else { hockeyPuck.vx *= -1; hockeyPuck.x = hockeyPuck.radius; }
    }
    if (hockeyPuck.x + hockeyPuck.radius > 800) {
        if (hockeyPuck.y > 170 && hockeyPuck.y < 330) { hockeyScore.blue += 1; checkHockeyWinner(); resetHockeyPuck(); }
        else { hockeyPuck.vx *= -1; hockeyPuck.x = 800 - hockeyPuck.radius; }
    }

    hockeyPaddles.forEach(pad => {
        let dx = hockeyPuck.x - pad.x; let dy = hockeyPuck.y - pad.y; let dist = Math.hypot(dx, dy);
        if (dist < hockeyPuck.radius + pad.radius) {
            let angle = Math.atan2(dy, dx);
            let hitSpeed = (Math.hypot(pad.vx, pad.vy) * 0.75) + (Math.hypot(hockeyPuck.vx, hockeyPuck.vy) * 0.5);
            hitSpeed = Math.max(hitSpeed, 4); hitSpeed = Math.min(hitSpeed, 25); 
            hockeyPuck.vx = Math.cos(angle) * hitSpeed; hockeyPuck.vy = Math.sin(angle) * hitSpeed;
            hockeyPuck.x = pad.x + Math.cos(angle) * (hockeyPuck.radius + pad.radius + 1);
            hockeyPuck.y = pad.y + Math.sin(angle) * (hockeyPuck.radius + pad.radius + 1);
        }
    });

    ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 15; ctx.shadowColor = '#ffffff';
    ctx.beginPath(); ctx.arc(hockeyPuck.x, hockeyPuck.y, hockeyPuck.radius, 0, Math.PI * 2); ctx.fill();

    hockeyPaddles.forEach(pad => {
        ctx.fillStyle = pad.color; ctx.shadowColor = pad.color;
        ctx.beginPath(); ctx.arc(pad.x, pad.y, pad.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = pad.innerColor; ctx.beginPath(); ctx.arc(pad.x, pad.y, pad.radius * 0.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.shadowBlur = 0;

    document.getElementById('game-status-hud').innerText = `Score: ${hockeyScore.blue} - ${hockeyScore.red}`;
}

function checkHockeyWinner() {
    if (hockeyScore.blue >= 3 || hockeyScore.red >= 3) {
        isGameOver = true;
        let winner = hockeyScore.blue >= 3 ? "🏆 BLUE CHIẾN THẮNG!" : "🏆 RED CHIẾN THẮNG!";
        document.getElementById('game-over-title').innerHTML = winner;
        addLogToUI(winner, "log-success");
    }
}

// ----------------------------------------------------
// 3.5. HỆ THỐNG AI STYLIST (CAMERA DETECTION 1)
// ----------------------------------------------------
let stylistIntervalId = null;
let stylistRenderId = null;
let lastStylistPixels = null;
let isStylistProcessing = false;

function initStylist() {
    resetStylist();
    stylistLog("Hệ thống AI Stylist - Sẵn sàng (Chu kỳ 15s)", "sys");
    
    const camCanvas = document.getElementById('stylist-cam-canvas');
    const camCtx = camCanvas.getContext('2d');
    const videoEl = document.getElementsByClassName('input_video')[0];

    // Vẽ Video feed qua canvas cho Stylist UI
    function renderCam() {
        if (activeGameType === 'stylist' && isGaming) {
            camCtx.save();
            camCtx.translate(camCanvas.width, 0);
            camCtx.scale(-1, 1);
            if (videoEl && videoEl.videoWidth > 0) {
                camCtx.drawImage(videoEl, 0, 0, camCanvas.width, camCanvas.height);
            }
            camCtx.restore();
            stylistRenderId = requestAnimationFrame(renderCam);
        }
    }
    renderCam();

    // Chu kỳ 15s gọi LLM
    stylistIntervalId = setInterval(processStylistFrame, 15000);
    // Quét lần đầu sau 2s
    setTimeout(processStylistFrame, 2000);
}

function stopStylist() {
    if (stylistIntervalId) clearInterval(stylistIntervalId);
    if (stylistRenderId) cancelAnimationFrame(stylistRenderId);
    lastStylistPixels = null;
    isStylistProcessing = false;
}

function resetStylist() {
    stopStylist();
    document.getElementById('stylist-logs-content').innerHTML = '<div style="color: #aaa;">[System] Hệ thống AI Stylist - Sẵn sàng...</div>';
    document.getElementById('stylist-cam-status').innerText = "Đang chờ...";
    
    const ids = ['stylist-list-fashion', 'stylist-list-jewelry', 'stylist-list-shoes', 'stylist-list-perfume', 'stylist-list-fnb'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerHTML = '<div class="stylist-empty">---</div>';
    });
}

function stylistLog(msg, type) {
    const logBox = document.getElementById('stylist-logs-content');
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    let color = '#00ffcc';
    if (type === 'warn') color = '#ff9800';
    else if (type === 'err') color = '#ff1744';
    else if (type === 'sys') color = '#aaa';
    
    const div = document.createElement('div');
    div.style.color = color; div.style.marginBottom = '5px';
    div.innerText = `[${time}] ${msg}`;
    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
}

async function processStylistFrame() {
    if (isStylistProcessing || activeGameType !== 'stylist' || !isGaming) return;
    const videoEl = document.getElementsByClassName('input_video')[0];
    if (!videoEl || !videoEl.videoWidth) return;
    
    isStylistProcessing = true;
    
    // Pixel Diff Logic (32x32 cho tối ưu)
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = 32; diffCanvas.height = 32;
    const diffCtx = diffCanvas.getContext('2d');
    diffCtx.drawImage(videoEl, 0, 0, 32, 32);
    const currentPixels = diffCtx.getImageData(0, 0, 32, 32).data;

    let isDiff = true;
    if (lastStylistPixels) {
        let diffCount = 0;
        for (let i = 0; i < currentPixels.length; i += 4) {
            let oldLuma = 0.299 * lastStylistPixels[i] + 0.587 * lastStylistPixels[i+1] + 0.114 * lastStylistPixels[i+2];
            let newLuma = 0.299 * currentPixels[i] + 0.587 * currentPixels[i+1] + 0.114 * currentPixels[i+2];
            if (Math.abs(oldLuma - newLuma) > 40) diffCount++;
        }
        if ((diffCount / 1024) * 100 < 15) isDiff = false; // Ngưỡng 15%
    }

    if (!isDiff) {
        stylistLog("Phát hiện người. Trùng khách cũ -> Giữ nguyên kết quả.", "warn");
        document.getElementById('stylist-cam-status').innerText = "Đã quét (Giữ Data)";
        isStylistProcessing = false;
        return;
    }

    lastStylistPixels = currentPixels;
    stylistLog("Chuyển động mới / Khách mới. Đang gọi API...", "sys");
    document.getElementById('stylist-cam-status').innerText = "Đang phân tích...";

    // Capture Base64
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = 320; captureCanvas.height = 240;
    captureCanvas.getContext('2d').drawImage(videoEl, 0, 0, 320, 240);
    const base64Img = captureCanvas.toDataURL('image/jpeg', 0.6).split(',')[1];

    const prompt = `Phân tích người trong ảnh và gợi ý style. 
YÊU CẦU NGHIÊM NGẶT:
- BẮT BUỘC mỗi danh mục phải có ÍT NHẤT 2 SẢN PHẨM gợi ý.
- CHỈ TRẢ VỀ DUY NHẤT CHUỖI JSON HỢP LỆ, KHÔNG giải thích.
- Gợi ý chi tiết tên Brand/Dòng cụ thể (Vd: Áo Uniqlo U, Đồng hồ Casio Vintage).
- Format:
{
  "thoi_trang": ["item 1", "item 2"],
  "dong_ho_trang_suc": ["item 1", "item 2"],
  "giay_dep": ["item 1", "item 2"],
  "nuoc_hoa": ["item 1", "item 2"],
  "fnb": ["item 1", "item 2"]
}
Nếu không có người, trả về các mảng rỗng.`;

    try {
        const payload = {
            contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Img } }] }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        };

        // Yêu cầu bắt buộc sử dụng gemini-3.1-flash-lite-preview, fallback gemini-2.5-flash nếu chết API
        let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${API_KEY}`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            });
        }
        
        if (!response.ok) throw new Error("API Fallback failed");
        
        const data = await response.json();
        const textJSON = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(textJSON.replace(/```json/gi, '').replace(/```/g, '').trim());

        const totalItems = Object.values(parsed).reduce((a, b) => a + (b ? b.length : 0), 0);
        if (totalItems === 0) {
            stylistLog("Không nhận diện được người rõ ràng.", "err");
            document.getElementById('stylist-cam-status').innerText = "Không thấy người";
        } else {
            stylistLog("Phân tích thành công: Đã cập nhật gợi ý.", "success");
            document.getElementById('stylist-cam-status').innerText = "Đã cập nhật (Mới)";
            updateStylistDOM(parsed);
        }

    } catch (e) {
        stylistLog("Lỗi kết nối API hoặc xử lý dữ liệu.", "err");
        document.getElementById('stylist-cam-status').innerText = "Lỗi kết nối";
    }

    isStylistProcessing = false;
}

function updateStylistDOM(data) {
    const mapping = {
        'thoi_trang': 'stylist-list-fashion', 'dong_ho_trang_suc': 'stylist-list-jewelry',
        'giay_dep': 'stylist-list-shoes', 'nuoc_hoa': 'stylist-list-perfume', 'fnb': 'stylist-list-fnb'
    };

    for (const [key, id] of Object.entries(mapping)) {
        const listEl = document.getElementById(id);
        if (listEl) {
            listEl.innerHTML = '';
            const items = data[key] || [];
            if (items.length === 0) {
                listEl.innerHTML = '<div class="stylist-empty">---</div>';
            } else {
                items.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'stylist-item';
                    div.innerHTML = `<span style="color:#00ffcc; margin-right:5px; flex-shrink:0;">▶</span> <span class="stylist-item-text" title="${item}">${item}</span>`;
                    listEl.appendChild(div);
                });
            }
        }
    }
}

// ----------------------------------------------------
// 4. ĐIỀU KHIỂN TAY & CHUỘT ẢO 
// ----------------------------------------------------
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const handBtn = document.getElementById("hand-btn");
const virtualCursor = document.getElementById("virtual-cursor");

let isHandTracking = false; let camera = null; 

// [CẬP NHẬT] - COOLDOWN CHUNG GLOBAL 3 GIÂY CHO TẤT CẢ ACTION DÙNG TAY
let lastGlobalActionTime = 0; 
const GLOBAL_COOLDOWN = 3000; 

let handPath = [];
let wasHandClosed = false; let isClicking = false; let clickStartX = 0; let clickStartY = 0;

function getDist(p1, p2) { return Math.hypot(p1.x - p2.x, p1.y - p2.y); }

// Nắm tay (Đóng hoàn toàn) - Dành riêng cho thao tác CLICK / Thoát
function checkHandClosed(landmarks) {
    const wrist = landmarks[0]; const middleBase = landmarks[9]; const handSize = getDist(wrist, middleBase); 
    const isIndexFolded = getDist(landmarks[8], wrist) < handSize * 1.0;
    const isMiddleFolded = getDist(landmarks[12], wrist) < handSize * 1.0;
    return isIndexFolded && isMiddleFolded;
}

// Bóp tay (Chụm ngón cái và ngón trỏ/giữa) - Dành riêng cho thao tác KÉO TRANG
function checkPinch(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const wrist = landmarks[0];
    const middleBase = landmarks[9];
    const handSize = getDist(wrist, middleBase);
    
    // Khoảng cách từ ngón cái đến trỏ / giữa
    const d1 = getDist(thumbTip, indexTip);
    const d2 = getDist(thumbTip, middleTip);
    
    // Nếu bóp nhẹ (khoảng cách nhỏ) => True
    return (d1 < handSize * 0.4) || (d2 < handSize * 0.4);
}

// Xoè tay - Dành riêng cho thao tác VUỐT SANG TRANG
function checkOpenHand(landmarks) {
    const wrist = landmarks[0];
    const middleBase = landmarks[9];
    const handSize = getDist(wrist, middleBase);
    // Ngón trỏ và ngón giữa duỗi ra xa khỏi cổ tay
    return getDist(landmarks[8], wrist) > handSize * 1.4 && getDist(landmarks[12], wrist) > handSize * 1.4;
}

// --- THAY ĐỔI Ở ĐÂY ---
async function toggleHandTracking(forceState = null) {
    const targetState = forceState !== null ? forceState : !isHandTracking;
    const voiceLogContainer = document.getElementById("voice-log-container");
    const cameraPreviewContainer = document.getElementById("camera-preview");

    if (targetState && !isHandTracking) {
        initFaceDetection().then(() => { addLogToUI("👤 Đã tải hệ thống nhận diện khuôn mặt", "log-sys"); }).catch(e => console.log(e));

        if (!camera) {
            camera = new Camera(videoElement, {
                onFrame: async () => { 
                    if (hands) await hands.send({image: videoElement}); 
                    if (faceDetection) { try { await faceDetection.send({image: videoElement}); } catch(e) {} }
                }, width: 320, height: 240
            });
        }
        camera.start(); isHandTracking = true; handBtn.classList.add("listening"); 
        if (voiceLogContainer) voiceLogContainer.style.display = "none";
        if (cameraPreviewContainer) cameraPreviewContainer.style.display = "block"; // Bật khung camera

        addLogToUI("🖐 Đã BẬT Camera Detection", "log-sys");
        let dict = i18nData[currentLang] || i18nData['en'];
        if(dict.handOn) updateAIAssistant(dict.handOn);
    } else if (!targetState && isHandTracking) {
        if (camera) camera.stop();
        isHandTracking = false; handBtn.classList.remove("listening"); 
        if (voiceLogContainer) voiceLogContainer.style.display = "none"; 
        if (cameraPreviewContainer) cameraPreviewContainer.style.display = "none"; // Tắt khung camera
        virtualCursor.style.display = "none";
        isPersonPresent = false; if (!isAISpeaking) setAIAvatarState('idle');
        addLogToUI("⏸ Đã TẮT Camera Detection", "log-sys");
    }
}
handBtn.addEventListener("click", () => toggleHandTracking());

function updatePaddlePosition(index, px, py, minX, maxX) {
    let targetX = Math.max(minX, Math.min(maxX, px)); let targetY = Math.max(32, Math.min(468, py));
    if (Math.hypot(targetX - targetPaddles[index].x, targetY - targetPaddles[index].y) > 2.5) {
        hockeyPaddles[index].vx = targetX - targetPaddles[index].x; hockeyPaddles[index].vy = targetY - targetPaddles[index].y;
        targetPaddles[index].x = targetX; targetPaddles[index].y = targetY; hockeyPaddles[index].x = targetX; hockeyPaddles[index].y = targetY;
    } else { hockeyPaddles[index].vx *= 0.5; hockeyPaddles[index].vy *= 0.5; }
}

function getClickableElementInRadius(x, y, radius) {
    let el = document.elementFromPoint(x, y);
    if (el && isClickableElement(el)) return el;
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    for (let angle of angles) {
        let rad = angle * Math.PI / 180; let nx = x + radius * Math.cos(rad); let ny = y + radius * Math.sin(rad);
        let checkEl = document.elementFromPoint(nx, ny);
        if (checkEl && isClickableElement(checkEl)) return checkEl;
    }
    return el; 
}

function isClickableElement(el) {
    if (el.closest('#hand-btn, #voice-btn, .hand-btn-class, .voice-btn-class')) return false;
    return el.closest('a, button, .clickable-game-card, .dropbtn, [onclick], img:not(.no-zoom), #game-over-overlay button, .game-btn');
}

function onHandResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    let activeHands = [];
    if (results.multiHandLandmarks) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            activeHands.push({
                x: (1 - results.multiHandLandmarks[i][9].x) * 800, y: results.multiHandLandmarks[i][9].y * 500,
                cx: (1 - results.multiHandLandmarks[i][9].x) * window.innerWidth, cy: results.multiHandLandmarks[i][9].y * window.innerHeight,
                landmarks: results.multiHandLandmarks[i]
            });
        }
    }

    if (isGaming && activeGameType === 'shooter') { shooterSlots[0].isTracking = false; shooterSlots[1].isTracking = false; }

    if (activeHands.length > 0) {
        updatePresence(); 
        
        const now = Date.now();
        const canAct = (now - lastGlobalActionTime) > GLOBAL_COOLDOWN; // Delay chung 3 giây cho mọi hành động

        // Disable virtual cursor during active canvas play ONLY for shooter and hockey
        const hideVirtualCursor = isGaming && !isGameOver && (activeGameType === 'shooter' || activeGameType === 'hockey');

        if (hideVirtualCursor) {
            virtualCursor.style.display = "none";
            const isClosed = checkHandClosed(activeHands[0].landmarks);
            
            // Lối thoát App Game (Shooter/Hockey)
            if (isClosed && canAct) { 
                stopGame(); 
                lastGlobalActionTime = now; // Bật cờ Cooldown
                canvasCtx.restore(); 
                return; 
            }

            if (activeGameType === 'shooter') {
                let aliveSlots = [0, 1].filter(s => !shooterSlots[s].isDead);
                if (activeHands.length === 1 && aliveSlots.length > 0) {
                    let hand = activeHands[0]; let bestSlot = aliveSlots[0];
                    if (aliveSlots.length === 2) {
                        if (shooterSlots[0].hasJoined && shooterSlots[1].hasJoined) {
                            let d0 = Math.hypot(hand.x - targetShips[0].x, hand.y - targetShips[0].y);
                            let d1 = Math.hypot(hand.x - targetShips[1].x, hand.y - targetShips[1].y);
                            bestSlot = d0 < d1 ? 0 : 1;
                        } else if (shooterSlots[0].hasJoined) { bestSlot = 0; } else if (shooterSlots[1].hasJoined) { bestSlot = 1; }
                    }
                    assignHandToShip(hand, bestSlot);
                } else if (activeHands.length >= 2 && aliveSlots.length > 0) {
                    let h0 = activeHands[0]; let h1 = activeHands[1];
                    if (aliveSlots.length === 1) {
                        let s = aliveSlots[0];
                        let d0 = Math.hypot(h0.x - targetShips[s].x, h0.y - targetShips[s].y);
                        let d1 = Math.hypot(h1.x - targetShips[s].x, h1.y - targetShips[s].y);
                        assignHandToShip(d0 < d1 ? h0 : h1, s);
                    } else if (aliveSlots.length === 2) {
                        if (shooterSlots[0].hasJoined && shooterSlots[1].hasJoined) {
                            let cost1 = Math.hypot(h0.x - targetShips[0].x, h0.y - targetShips[0].y) + Math.hypot(h1.x - targetShips[1].x, h1.y - targetShips[1].y);
                            let cost2 = Math.hypot(h0.x - targetShips[1].x, h0.y - targetShips[1].y) + Math.hypot(h1.x - targetShips[0].x, h1.y - targetShips[0].y);
                            if (cost1 < cost2) { assignHandToShip(h0, 0); assignHandToShip(h1, 1); } else { assignHandToShip(h1, 0); assignHandToShip(h0, 1); }
                        } else {
                            let sortedHands = [h0, h1].sort((a,b) => a.x - b.x); assignHandToShip(sortedHands[0], 0); assignHandToShip(sortedHands[1], 1);
                        }
                    }
                }

                function assignHandToShip(hand, slotIdx) {
                    if (!shooterSlots[slotIdx].hasJoined) { targetShips[slotIdx].x = hand.x; targetShips[slotIdx].y = hand.y; shooterSlots[slotIdx].x = Math.max(25, Math.min(775, hand.x)); shooterSlots[slotIdx].y = Math.max(30, Math.min(470, hand.y)); }
                    if (Math.hypot(hand.x - targetShips[slotIdx].x, hand.y - targetShips[slotIdx].y) > 2.5) { targetShips[slotIdx].x = hand.x; targetShips[slotIdx].y = hand.y; shooterSlots[slotIdx].x = Math.max(25, Math.min(775, hand.x)); shooterSlots[slotIdx].y = Math.max(30, Math.min(470, hand.y)); }
                    shooterSlots[slotIdx].hasJoined = true; shooterSlots[slotIdx].isTracking = true;
                    drawConnectors(canvasCtx, hand.landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2}); drawLandmarks(canvasCtx, hand.landmarks, {color: '#FF0000', lineWidth: 1});
                }
            } else if (activeGameType === 'hockey') {
                let leftHand = null; let rightHand = null;
                activeHands.forEach(hand => {
                    if (hand.x < 400) {
                        if (!leftHand) leftHand = hand; else { let dCurrent = Math.hypot(leftHand.x - targetPaddles[0].x, leftHand.y - targetPaddles[0].y); let dNew = Math.hypot(hand.x - targetPaddles[0].x, hand.y - targetPaddles[0].y); if (dNew < dCurrent) leftHand = hand; }
                    } else {
                        if (!rightHand) rightHand = hand; else { let dCurrent = Math.hypot(rightHand.x - targetPaddles[1].x, rightHand.y - targetPaddles[1].y); let dNew = Math.hypot(hand.x - targetPaddles[1].x, hand.y - targetPaddles[1].y); if (dNew < dCurrent) rightHand = hand; }
                    }
                });
                if (leftHand) { updatePaddlePosition(0, leftHand.x, leftHand.y, 32, 390); drawConnectors(canvasCtx, leftHand.landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2}); drawLandmarks(canvasCtx, leftHand.landmarks, {color: '#FF0000', lineWidth: 1}); }
                if (rightHand) { updatePaddlePosition(1, rightHand.x, rightHand.y, 410, 768); drawConnectors(canvasCtx, rightHand.landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2}); drawLandmarks(canvasCtx, rightHand.landmarks, {color: '#FF0000', lineWidth: 1}); }
            }
            canvasCtx.restore(); return; 
        }

        // Mouse Emulator (Hoạt động tốt trong Menu, Web và Stylist App)
        let bestHand = activeHands[0];
        if (activeHands.length > 1) {
            let minDist = Infinity;
            activeHands.forEach(hand => {
                let d = Math.hypot(hand.cx - smoothCursor.x, hand.cy - smoothCursor.y);
                if (d < minDist) { minDist = d; bestHand = hand; }
            });
        }
        
        const landmarks = bestHand.landmarks;
        virtualCursor.style.display = "block";
        smoothCursor.x += (bestHand.cx - smoothCursor.x) * SMOOTH_FACTOR;
        smoothCursor.y += (bestHand.cy - smoothCursor.y) * SMOOTH_FACTOR;
        virtualCursor.style.left = smoothCursor.x + "px"; virtualCursor.style.top = smoothCursor.y + "px";

        let hoveredEl = getClickableElementInRadius(smoothCursor.x, smoothCursor.y, 40);
        document.querySelectorAll('.dropdown').forEach(el => el.classList.remove('force-hover'));
        if (hoveredEl) { let dropdown = hoveredEl.closest('.dropdown'); if (dropdown) dropdown.classList.add('force-hover'); }

        const isClosed = checkHandClosed(landmarks);
        const isPinching = checkPinch(landmarks);
        const isOpenHand = checkOpenHand(landmarks);

        // Lệnh click chuột bao hàm cả nắm tay và bóp nhẹ (để tránh miss)
        let isClickGesture = isClosed || isPinching;
        let justClosedZoom = false;
        
        // Bắt đầu bấm (Nhưng bị chặn nếu đang trong cooldown)
        if (!wasHandClosed && isClickGesture) {
            isClicking = true; 
            clickStartX = smoothCursor.x; clickStartY = smoothCursor.y; 
            virtualCursor.classList.add("clicking");
            
            // Xử lý Thoát ảnh Zoom (Cần check canAct)
            if (window.isImageZoomed && window.zoomedImageOverlay && canAct) { 
                closeImageZoom(); 
                justClosedZoom = true; 
                isClicking = false; 
                lastGlobalActionTime = now; // Bật cờ Cooldown
            }
            
            // Lối thoát App Stylist nhanh: nắm tay / bóp
            if (activeGameType === 'stylist' && isGaming && isClosed && canAct) {
                stopGame();
                lastGlobalActionTime = now; // Bật cờ Cooldown
            }
        }

        // Hủy thao tác Click nếu kéo chuột quá xa
        if (isClickGesture && isClicking) { 
            if (Math.hypot(smoothCursor.x - clickStartX, smoothCursor.y - clickStartY) > 50) isClicking = false; 
        }

        // Hoàn thành lệnh Click (Nhả tay ra)
        if (wasHandClosed && !isClickGesture) {
            virtualCursor.classList.remove("clicking");
            
            if (isClicking && !justClosedZoom && hoveredEl && canAct) {
                let clickableEl = hoveredEl.closest('.clickable-game-card, button, a, .dropbtn, [onclick], img:not(.no-zoom)');
                if (clickableEl) {
                    clickableEl.click(); 
                } else { 
                    hoveredEl.click(); 
                }
                addLogToUI("🖱 Đã Click bằng cử chỉ", "log-sys");
                isClicking = false;
                lastGlobalActionTime = now; // Bật cờ Cooldown 3s sau khi click
            }
        }

        wasHandClosed = isClickGesture; 
        const wrist = landmarks[0]; 
        handPath.push({ x: 1 - wrist.x, y: wrist.y }); if (handPath.length > 15) handPath.shift();

        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 3}); drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});

        // Xử lý Vuốt ngang và Cuộn dọc (Bảo vệ bởi Delay 3s)
        if (handPath.length >= 10 && !isGameOver && canAct) {
            const dx = handPath[handPath.length - 1].x - handPath[0].x; 
            const dy = handPath[handPath.length - 1].y - handPath[0].y; 
            
            // Swipe (Vuốt Chuyển Trang): Yêu cầu XÒE TAY, ưu tiên vuốt ngang
            if (isOpenHand && Math.abs(dx) > 0.15 && Math.abs(dx) > Math.abs(dy) * 1.5) { 
                movePage(dx > 0.15 ? -1 : 1); 
                lastGlobalActionTime = now; // Bật cờ Cooldown 3s
                handPath = []; 
                return; 
            }
            
            // Scroll (Kéo trang lên xuống): Yêu cầu BÓP TAY (Pinch), ưu tiên chuyển động dọc
            if (isPinching && Math.abs(dy) > 0.04 && Math.abs(dy) > Math.abs(dx) * 1.2) {
                // Tăng hệ số độ nhạy lên 8 lần để kéo mượt & nhanh hơn
                let dynamicScroll = Math.abs(dy) * window.innerHeight * 8; 
                // Giới hạn max min của mỗi lần cuộn
                dynamicScroll = Math.max(250, Math.min(dynamicScroll, window.innerHeight * 1.2)); 
                
                window.scrollBy({top: dy < 0 ? -dynamicScroll : dynamicScroll, behavior: 'smooth'}); 
                lastGlobalActionTime = now; // Bật cờ Cooldown 3s
                handPath = []; 
                return;
            }
        }
    } else {
        handPath = []; wasHandClosed = false; isClicking = false; virtualCursor.style.display = "none"; virtualCursor.classList.remove("clicking");
    }
    canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
hands.onResults(onHandResults);

// ----------------------------------------------------
// 5. GIỌNG NÓI & AI GEMINI
// ----------------------------------------------------
const API_KEY = "AQ.Ab8RN6LQNhgNQqjQZaKhIBRFEpIx4ChFyCzzvx_asCjRbZ4Tgw";
const voiceBtn = document.getElementById("voice-btn");

const localKeywordMap = [
    { keywords: ["stylist", "nhận diện khuôn mặt", "nhận diện"], action: "start_game", game: "stylist" },
    { keywords: ["space shooter", "bắn ruồi"], action: "start_game", game: "shooter" },
    { keywords: ["air hockey", "khúc côn cầu"], action: "start_game", game: "hockey" },
    { keywords: ["chơi game"], action: "start_game", game: "random" },
    { keywords: ["full screen", "toàn màn hình", "fullscreen", "phóng to"], action: "fullscreen" },
    { keywords: ["thoát", "exit", "close"], action: "exit_action" },
    { keywords: ["reset game", "chơi lại", "restart"], action: "reset_game" },
    { keywords: ["dịch sang tiếng anh", "translate to english", "tiếng anh"], action: "translate_lang", targetLang: "en" },
    { keywords: ["dịch sang tiếng việt", "translate to vietnamese", "tiếng việt"], action: "translate_lang", targetLang: "vi" },
    { keywords: ["dịch sang tiếng trung", "tiếng trung", "trung quốc"], action: "translate_lang", targetLang: "zh" },
    { keywords: ["dịch sang tiếng hàn", "tiếng hàn", "hàn quốc"], action: "translate_lang", targetLang: "ko" },
    { keywords: ["dịch sang tiếng nhật", "tiếng nhật", "nhật bản"], action: "translate_lang", targetLang: "ja" },
    { keywords: ["dịch sang tiếng pháp", "tiếng pháp"], action: "translate_lang", targetLang: "fr" },
    { keywords: ["bật điều khiển tay", "bật chế độ tay", "bật cử chỉ tay", "turn on hand control"], action: "hand_on" },
    { keywords: ["tắt điều khiển tay", "tắt chế độ tay", "tắt cử chỉ tay", "turn off hand control"], action: "hand_off" },
    { keywords: ["sang phải", "tiếp theo"], action: "move_right" },
    { keywords: ["sang trái", "lùi lại"], action: "move_left" },
    { keywords: ["trang chủ", "home"], action: "navigate", page: "home" },
    { keywords: ["sản phẩm", "product"], action: "navigate", page: "product" },
    { keywords: ["vr", "thực tế ảo"], action: "navigate", page: "vr" },
    { keywords: ["ar", "thực tế tăng cường"], action: "navigate", page: "ar" },
    { keywords: ["detection", "nhận diện"], action: "navigate", page: "detection" },
    { keywords: ["giải pháp", "solution"], action: "navigate", page: "solution" },
    { keywords: ["công ty", "company", "về chúng tôi"], action: "navigate", page: "company" },
    { keywords: ["liên hệ", "contact"], action: "navigate", page: "contact" }
];

let isVoiceListening = false; let isCommandProcessing = false; 

if (SpeechRecognition) {
    recognition = new SpeechRecognition(); recognition.lang = 'vi-VN'; recognition.interimResults = false; recognition.continuous = false; 
    voiceBtn.addEventListener("click", () => {
        if (!isVoiceListening) {
            try {
                recognition.start(); isVoiceListening = true; voiceBtn.classList.add("listening");
                addLogToUI("▶ Đã BẬT Điều khiển Giọng nói", "log-sys");
                let dict = i18nData[currentLang] || i18nData['en']; if (dict.voiceOn) updateAIAssistant(dict.voiceOn, true, currentLang);
            } catch(e) {}
        } else {
            isVoiceListening = false; recognition.stop(); voiceBtn.classList.remove("listening"); addLogToUI("⏸ Đã TẮT Điều khiển Giọng nói", "log-sys");
        }
    });
    recognition.onerror = (event) => { if (event.error === 'not-allowed' || event.error === 'aborted') { isVoiceListening = false; voiceBtn.classList.remove("listening"); addLogToUI("❌ Lỗi Micro: Quyền bị từ chối.", "log-error"); } };
    recognition.onresult = async (event) => {
        if (isCommandProcessing || isAISpeaking) return; 
        const result = event.results[event.resultIndex][0]; let transcript = result.transcript.toLowerCase().trim().replace(/[.,!?]/g, "");
        if (result.confidence < 0.6 || transcript.length <= 2 || !transcript.match(/[a-z0-9]/i) || /^([a-zơôoăâeêiuưy])\1+$/i.test(transcript.replace(/\s/g, ''))) return;
        addLogToUI(`🎤 "${transcript}"`, "log-user"); isCommandProcessing = true; 
        try {
            if (isGaming) {
                if (transcript.includes("reset") || transcript.includes("chơi lại")) { resetCurrentGame(); return; }
                if (transcript.includes("full screen") || transcript.includes("fullscreen") || transcript.includes("toàn màn hình")) { toggleFullScreen(); return; }
                if (transcript === "thoát" || transcript === "exit") { toggleFullScreen(true); stopGame(); return; }
            }
            let exactMatch = null;
            for (const item of localKeywordMap) { if (item.keywords.some(kw => transcript.includes(kw))) { exactMatch = item; break; } }
            if (exactMatch) executeLocalAction(exactMatch);
            else {
                addLogToUI("🧠 Đang hỏi AI Gemini...", "log-sys");
                if(aiStatusText) aiStatusText.innerText = "Đang xử lý...";
                await callGeminiToNavigate(transcript); 
            }
        } finally { setTimeout(() => { isCommandProcessing = false; }, 2000); }
    };
    recognition.onend = () => { if (isVoiceListening && !isAISpeaking) { setTimeout(() => { if (isVoiceListening && !isAISpeaking) { try { recognition.start(); } catch (e) {} } }, 500); } };
}

function executeLocalAction(matchObj) {
    if (matchObj.action === "start_game") startGame(matchObj.game);
    else if (matchObj.action === "stop_game") stopGame();
    else if (matchObj.action === "reset_game") resetCurrentGame();
    else if (matchObj.action === "fullscreen") toggleFullScreen();
    else if (matchObj.action === "exit_action") { toggleFullScreen(true); if (isGaming) stopGame(); }
    else if (matchObj.action === "translate_lang") switchWebsiteLanguage(matchObj.targetLang);
    else if (matchObj.action === "hand_on") toggleHandTracking(true);
    else if (matchObj.action === "hand_off") toggleHandTracking(false);
    else if (matchObj.action === "move_right") movePage(1);
    else if (matchObj.action === "move_left") movePage(-1);
    else if (matchObj.action === "navigate") navigateTo(matchObj.page);
}

async function callGeminiToNavigate(text) {
    const prompt = `Bạn là AI Onion Tech Support. Nhiệm vụ:
    1. Lệnh điều hướng (VR, AR, thoát, bật tắt, dịch) trả JSON: {"action": "action_name", "targetLang": "en", "page": "url"}. (start_game, exit_action, fullscreen, translate_lang, toggle_hand, navigate).
    2. Nếu hỏi ngoài luồng, dùng Google Search và trả lời NGẮN (dưới 30 từ): {"action": "action_answer", "response": "trả lời", "lang": "${currentLang}"}.
    CHỈ TRẢ VỀ JSON hợp lệ, KHÔNG diễn giải.`;
    try {
        if (!navigator.onLine) throw new Error("OFFLINE_NETWORK");
        const payload = { contents: [{ parts: [{ text: prompt }] }], tools: [{ googleSearch: {} }] };
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`HTTP_ERROR`);
        const data = await response.json();
        const intent = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/gi, '').replace(/```/g, '').trim());
        if (intent.action === "start_game") startGame(intent.game || 'random');
        else if (intent.action === "exit_action") { toggleFullScreen(true); if (isGaming) stopGame(); }
        else if (intent.action === "fullscreen") toggleFullScreen();
        else if (intent.action === "translate_lang") switchWebsiteLanguage(intent.targetLang);
        else if (intent.action === "toggle_hand") toggleHandTracking(intent.state);
        else if (intent.action === "navigate") navigateTo(intent.page);
        else if (intent.action === "action_answer") updateAIAssistant(intent.response, true, intent.lang || currentLang);
    } catch (error) { 
        let fallbackMatch = null;
        for (const item of localKeywordMap) { if (item.keywords.some(kw => text.includes(kw))) { fallbackMatch = item; break; } }
        if (fallbackMatch) executeLocalAction(fallbackMatch);
        else { addLogToUI("❌ Lỗi mạng/Offline.", "log-error"); updateAIAssistant("Xin lỗi, tôi không xử lý được.", true, currentLang, true); }
    }
}