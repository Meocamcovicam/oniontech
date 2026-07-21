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
// [BẢO VỆ TÊN THƯƠNG HIỆU] KHÔNG DỊCH "ONION TECH" & CÁC TỪ KHÓA
// ----------------------------------------------------
function protectBrandName() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];
    let node;
    const regex = /(Onion Tech|Motion Detection|Face Detection|\bVR\b|\bAR\b|\bDetection\b)/i;
    while (node = walker.nextNode()) {
        if (node.nodeValue.match(regex)) {
            let parent = node.parentElement;
            if (parent && parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE' && !parent.classList.contains('notranslate')) {
                nodesToReplace.push(node);
            }
        }
    }
    nodesToReplace.forEach(n => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = n.nodeValue.replace(/(Onion Tech|Motion Detection|Face Detection|\bVR\b|\bAR\b|\bDetection\b)/gi, '<span class="notranslate">$1</span>');
        while(tempDiv.firstChild) {
            n.parentNode.insertBefore(tempDiv.firstChild, n);
        }
        n.parentNode.removeChild(n);
    });
}

// ----------------------------------------------------
// [HỆ THỐNG DỊCH TỰ ĐỘNG] TIÊM GOOGLE TRANSLATE ELEMENT
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
// 1. TỪ ĐIỂN MAP 100 NGÔN NGỮ & XỬ LÝ TEXT ZERO-TOKEN
// ----------------------------------------------------
const logContent = document.getElementById("log-content");
const aiStatusText = document.getElementById("ai-status-text");

let currentLang = 'vi'; 

const langMap = {
    "việt": "vi", "việt nam": "vi", "anh": "en", "trung": "zh-CN", "trung quốc": "zh-CN", "hoa": "zh-CN",
    "nhật": "ja", "nhật bản": "ja", "hàn": "ko", "hàn quốc": "ko", "pháp": "fr", "đức": "de",
    "tây ban nha": "es", "nga": "ru", "ý": "it", "italia": "it", "thái": "th", "thái lan": "th",
    "indonesia": "id", "mã lai": "ms", "malaysia": "ms", "ấn độ": "hi", "hindi": "hi",
    "ả rập": "ar", "thổ nhĩ kỳ": "tr", "bồ đào nha": "pt", "hà lan": "nl", "thụy điển": "sv",
    "ba lan": "pl", "đan mạch": "da", "phần lan": "fi", "hy lạp": "el", "na uy": "no",
    "séc": "cs", "rumani": "ro", "hungary": "hu", "ukraine": "uk", "philipin": "tl", "philippines": "tl"
};

async function translateZeroToken(text, toLang) {
    try {
        let res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`);
        let data = await res.json();
        return data[0].map(x => x[0]).join('');
    } catch(e) { return text; }
}

function addLogToUI(message, type = "log-sys") {
    const logEl = document.createElement("div");
    logEl.className = `log-msg ${type}`;
    logEl.innerHTML = message.replace(/(Onion Tech|Motion Detection|Face Detection|\bVR\b|\bAR\b|\bDetection\b)/gi, '<span class="notranslate">$1</span>');
    if(logContent) {
        logContent.appendChild(logEl);
        logContent.scrollTop = logContent.scrollHeight;
    }
}

// ----------------------------------------------------
// [HỆ THỐNG AUTO-ROTATE BẰNG AI] Lật khung hình thẳng đứng
// ----------------------------------------------------
let videoRotationAngle = 0; 
let lastRotationTime = 0;
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

function processVideoToOffscreen(videoEl) {
    let vw = videoEl.videoWidth;
    let vh = videoEl.videoHeight;
    if (vw === 0 || vh === 0) return null;

    if (videoRotationAngle === 0 && vw > vh && window.innerHeight > window.innerWidth && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        videoRotationAngle = 90;
    }

    if (videoRotationAngle === 90 || videoRotationAngle === 270) {
        offscreenCanvas.width = vh; 
        offscreenCanvas.height = vw;
    } else {
        offscreenCanvas.width = vw; 
        offscreenCanvas.height = vh;
    }

    offscreenCtx.save();
    if (videoRotationAngle === 90) { offscreenCtx.translate(vh, 0); offscreenCtx.rotate(90 * Math.PI / 180); }
    else if (videoRotationAngle === 180) { offscreenCtx.translate(vw, vh); offscreenCtx.rotate(180 * Math.PI / 180); }
    else if (videoRotationAngle === 270) { offscreenCtx.translate(0, vw); offscreenCtx.rotate(270 * Math.PI / 180); }
    
    offscreenCtx.drawImage(videoEl, 0, 0, vw, vh);
    offscreenCtx.restore();

    return offscreenCanvas;
}

// ----------------------------------------------------
// [FACE TRACKING & PRESENCE LOGIC] Tích hợp cân bằng tự động
// ----------------------------------------------------
let isPersonPresent = false;
let isPlayingMusic = false; 
let presenceTimeout = null;
let faceDetection = null;

function updatePresence() {
    if (!isPersonPresent) {
        isPersonPresent = true;
        if (!isAISpeaking) setAIAvatarState(isPlayingMusic ? 'playmusic' : 'wave'); 
    }
    clearTimeout(presenceTimeout);
    presenceTimeout = setTimeout(() => {
        isPersonPresent = false;
        if (!isAISpeaking) setAIAvatarState(isPlayingMusic ? 'playmusic' : 'idle'); 
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
            if (results.detections && results.detections.length > 0) { 
                updatePresence(); 
                
                let face = results.detections[0];
                if (face.landmarks && face.landmarks.length >= 2) {
                    let rightEye = face.landmarks[0]; 
                    let leftEye = face.landmarks[1];
                    
                    let dx = (leftEye.x - rightEye.x) * offscreenCanvas.width;
                    let dy = (leftEye.y - rightEye.y) * offscreenCanvas.height;
                    let faceAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                    
                    let snap = 0;
                    if (faceAngle > 55 && faceAngle <= 125) snap = 90;
                    else if (faceAngle < -55 && faceAngle >= -125) snap = -90;
                    else if (Math.abs(faceAngle) > 135) snap = 180;
                    
                    if (snap !== 0 && Date.now() - lastRotationTime > 3000) {
                        videoRotationAngle = (videoRotationAngle - snap + 360) % 360;
                        lastRotationTime = Date.now();
                        addLogToUI(`🔄 AI: Đã cân bằng khung hình tự động.`, "log-sys");
                    }
                }
            }
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
    else if (state === 'playmusic') targetSrc = "images/playmusic.mp4"; 

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
    setAIAvatarState('idle'); 
    injectGoogleTranslate(); 
    protectBrandName(); 
    
    setTimeout(() => { switchWebsiteLanguage('vi', true); }, 1500); 
});

// ----------------------------------------------------
// 2. TTS - GOOGLE NATIVE VOICE & TRANSLATE ENGINE
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

    let tl = lang === 'zh' ? 'zh-CN' : lang; 
    let chunks = cleanText.match(/[^.?!,;]+[.?!,;]+/g) || [cleanText]; 

    chunks.forEach(chunk => {
        if (chunk.trim() !== "") audioQueue.push(`https://translate.googleapis.com/translate_tts?client=tw-ob&ie=UTF-8&tl=${tl}&q=${encodeURIComponent(chunk.trim())}`);
    });
    playNextAudioQueue();
}

function playNextAudioQueue() {
    if (audioQueue.length === 0) {
        isAISpeaking = false; 
        setAIAvatarState(isPlayingMusic ? 'playmusic' : (isPersonPresent ? 'wave' : 'idle')); 
        
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
        aiStatusText.innerHTML = text.replace(/(Onion Tech|Motion Detection|Face Detection|\bVR\b|\bAR\b|\bDetection\b)/gi, '<span class="notranslate">$1</span>');
        aiStatusText.style.animation = 'none'; aiStatusText.offsetHeight; aiStatusText.style.animation = 'fadeIn 0.5s';
    }
    addLogToUI(`🤖 AI: "${text}"`, "log-gemini");
    if (speak) speakAI(text, lang, isError);
}

async function speakLocal(viText, isError = false) {
    let finalText = viText;
    if (currentLang !== 'vi') {
        finalText = await translateZeroToken(viText, currentLang);
    }
    updateAIAssistant(finalText, true, currentLang, isError);
}

function switchWebsiteLanguage(targetLang, silent = false) {
    if (targetLang === 'zh') targetLang = 'zh-CN';
    currentLang = targetLang; 
    
    addLogToUI(`🌐 Đã chuyển ngôn ngữ website sang mã: ${targetLang.toUpperCase()}`, "log-success");
    const triggerTranslation = (selectEl) => {
        selectEl.value = targetLang;
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
    if (!silent) speakLocal("Đã chuyển đổi toàn bộ nội dung sang ngôn ngữ mới.");
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
            speakLocal(`Đang chuyển hướng tới trang ${page}.`); 
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

function toggleFullScreen(forceExit = false, silent = false) {
    const container = document.getElementById('game-container');
    const fsBtnIcon = document.querySelector('#btn-fullscreen i');
    if (forceExit || container.classList.contains('fake-fullscreen')) {
        container.classList.remove('fake-fullscreen');
        if (fsBtnIcon) fsBtnIcon.className = "fas fa-expand";
        addLogToUI("🗗 Đã THOÁT chế độ toàn màn hình", "log-sys");
        if (!silent) speakLocal("Đã thoát chế độ toàn màn hình.");
    } else {
        container.classList.add('fake-fullscreen');
        if (fsBtnIcon) fsBtnIcon.className = "fas fa-compress";
        addLogToUI("🗖 Đã BẬT chế độ toàn màn hình", "log-success");
        if (!silent) speakLocal("Đã bật chế độ toàn màn hình.");
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
        addLogToUI("🎮 Đã mở Ứng dụng: Nhận diện khuôn mặt", "log-success");
        speakLocal("Đã mở tính năng nhận diện khuôn mặt và gợi ý thời trang.");
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
            addLogToUI("🎮 Đã mở Game 1: Space Shooter", "log-success");
        } else if (type === 'hockey') {
            document.getElementById('game-title').innerHTML = `<i class="fas fa-table-tennis"></i> Game 2: Air Hockey`;
            hockeyScore = { blue: 0, red: 0 }; resetHockeyPuck();
            document.getElementById('game-status-hud').innerText = `Score: 0`;
            addLogToUI("🎮 Đã mở Game 2: Air Hockey", "log-success");
        }
        speakLocal("Ứng dụng đã khởi động!");
    }
    
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoop();

    setTimeout(() => {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) gameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

function stopGame() {
    if (!isGaming) return;
    isGaming = false; isGameOver = false;
    
    stopStylist(); 
    
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    toggleFullScreen(true, true); 
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('detection-normal-list').style.display = 'block';
    
    addLogToUI("🛑 Đã thoát App và quay lại menu", "log-sys");
    speakLocal("Đã thoát ứng dụng và quay lại trang nhận diện chuyển động.");
    
    navigateTo('detection', '', false);
    setTimeout(() => {
        const detSection = document.getElementById('detection');
        if (detSection) detSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
}

function resetCurrentGame() {
    if (!isGaming) return;
    isGameOver = false;
    document.getElementById('game-over-overlay').style.display = 'none';
    
    if (activeGameType === 'stylist') {
        resetStylist(); 
        addLogToUI("🔄 Đã khởi động lại AI Stylist", "log-success");
        speakLocal("Đã khởi động lại nhận diện khuôn mặt.");
    } else if (activeGameType === 'shooter') {
        shooterScore = 0; shooterGameStarted = false;
        shooterSlots[0].hp = 10; shooterSlots[0].isDead = false; shooterSlots[0].hasJoined = false; shooterSlots[0].isTracking = false;
        shooterSlots[1].hp = 10; shooterSlots[1].isDead = false; shooterSlots[1].hasJoined = false; shooterSlots[1].isTracking = false;
        targetShips = [ { x: 350, y: 440 }, { x: 450, y: 440 } ];
        bullets = []; enemies = []; enemyBullets = []; frameCount = 0;
        document.getElementById('game-status-hud').innerText = `Score: 0`;
        addLogToUI("🔄 Đã chơi lại Game Bắn Ruồi", "log-success");
        speakLocal("Đã chơi lại game bắn ruồi.");
    } else if (activeGameType === 'hockey') {
        hockeyScore = { blue: 0, red: 0 }; resetHockeyPuck();
        targetPaddles = [ { x: 150, y: 250 }, { x: 650, y: 250 } ];
        document.getElementById('game-status-hud').innerText = `Score: 0`;
        addLogToUI("🔄 Đã chơi lại Game Khúc Côn Cầu", "log-success");
        speakLocal("Đã chơi lại game khúc côn cầu.");
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
            
            if (isGameOver) document.getElementById('game-over-overlay').style.display = 'flex';
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
// 3.5. HỆ THỐNG AI STYLIST (CAMERA DETECTION)
// ----------------------------------------------------
let stylistIntervalId = null;
let stylistRenderId = null;
let lastStylistPixels = null;
let isStylistProcessing = false;
let stylistUsageCount = 0; 

function initStylist() {
    resetStylist();
    stylistUsageCount = 0; 
    stylistLog(`Hệ thống AI Stylist - Sẵn sàng (Chu kỳ 20s) [0/4]`, "sys");
    
    const camCanvas = document.getElementById('stylist-cam-canvas');
    const camCtx = camCanvas.getContext('2d');
    const videoEl = document.getElementsByClassName('input_video')[0];

    function renderCam() {
        if (activeGameType === 'stylist' && isGaming) {
            camCtx.save();
            camCtx.translate(camCanvas.width, 0);
            camCtx.scale(-1, 1); 
            
            if (offscreenCanvas && offscreenCanvas.width > 0) {
                camCtx.drawImage(offscreenCanvas, 0, 0, camCanvas.width, camCanvas.height);
            } else if (videoEl && videoEl.videoWidth > 0) {
                camCtx.drawImage(videoEl, 0, 0, camCanvas.width, camCanvas.height);
            }
            
            camCtx.restore();
            stylistRenderId = requestAnimationFrame(renderCam);
        }
    }
    renderCam();

    stylistIntervalId = setInterval(processStylistFrame, 20000);
    setTimeout(processStylistFrame, 5000);
}

function stopStylist() {
    if (stylistIntervalId) clearInterval(stylistIntervalId);
    if (stylistRenderId) cancelAnimationFrame(stylistRenderId);
    lastStylistPixels = null;
    isStylistProcessing = false;
}

function resetStylist() {
    stopStylist();
    stylistUsageCount = 0; 
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
    const currentSrc = (offscreenCanvas && offscreenCanvas.width > 0) ? offscreenCanvas : videoEl;
    if (!currentSrc || !currentSrc.width && !currentSrc.videoWidth) return;
    
    isStylistProcessing = true;
    
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = 32; diffCanvas.height = 32;
    const diffCtx = diffCanvas.getContext('2d');
    diffCtx.drawImage(currentSrc, 0, 0, 32, 32);
    const currentPixels = diffCtx.getImageData(0, 0, 32, 32).data;

    let isDiff = true;
    if (lastStylistPixels) {
        let diffCount = 0;
        for (let i = 0; i < currentPixels.length; i += 4) {
            let oldLuma = 0.299 * lastStylistPixels[i] + 0.587 * lastStylistPixels[i+1] + 0.114 * lastStylistPixels[i+2];
            let newLuma = 0.299 * currentPixels[i] + 0.587 * currentPixels[i+1] + 0.114 * currentPixels[i+2];
            if (Math.abs(oldLuma - newLuma) > 40) diffCount++;
        }
        if ((diffCount / 1024) * 100 < 15) isDiff = false; 
    }

    if (!isDiff) {
        stylistLog("Khách không đổi vị trí/dáng. Bỏ qua để tiết kiệm API.", "warn");
        document.getElementById('stylist-cam-status').innerText = `Đã quét (Giữ Data) [${stylistUsageCount}/4]`;
        isStylistProcessing = false;
        return;
    }

    lastStylistPixels = currentPixels;
    stylistLog("Chuyển động mới / Khách mới. Đang gọi API...", "sys");
    document.getElementById('stylist-cam-status').innerText = `Đang phân tích... [${stylistUsageCount}/4]`;

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = 320; captureCanvas.height = 240;
    captureCanvas.getContext('2d').drawImage(currentSrc, 0, 0, 320, 240);
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

        let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${API_KEY_FACE}`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY_FACE}`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            });
        }
        
        if (!response.ok) throw new Error("API Fallback failed");
        
        const data = await response.json();
        const textJSON = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(textJSON.replace(/```json/gi, '').replace(/```/g, '').trim());
        
        stylistUsageCount++;

        const totalItems = Object.values(parsed).reduce((a, b) => a + (b ? b.length : 0), 0);
        if (totalItems === 0) {
            stylistLog(`Không nhận diện được người rõ ràng. (Lần ${stylistUsageCount}/4)`, "err");
            document.getElementById('stylist-cam-status').innerText = `Không thấy người [${stylistUsageCount}/4]`;
        } else {
            stylistLog(`Phân tích thành công: Đã cập nhật gợi ý. (Lần ${stylistUsageCount}/4)`, "success");
            document.getElementById('stylist-cam-status').innerText = `Đã cập nhật (Mới) [${stylistUsageCount}/4]`;
            updateStylistDOM(parsed);
        }

        if (stylistUsageCount >= 4) {
            stylistLog("✅ Đã đạt giới hạn 4 lần sử dụng. Đóng ứng dụng sau 5 giây...", "warn");
            document.getElementById('stylist-cam-status').innerText = `Hoàn tất [4/4] (Đang đóng...)`;
            setTimeout(() => {
                if (activeGameType === 'stylist' && isGaming) stopGame();
            }, 5000);
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

let lastGlobalActionTime = 0; 
const GLOBAL_COOLDOWN = 3000; 

let handPath = [];
let wasHandClosed = false; let isClicking = false; let clickStartX = 0; let clickStartY = 0;

function getDist(p1, p2) { return Math.hypot(p1.x - p2.x, p1.y - p2.y); }

function checkHandClosed(landmarks) {
    const wrist = landmarks[0]; const middleBase = landmarks[9]; const handSize = getDist(wrist, middleBase); 
    const isIndexFolded = getDist(landmarks[8], wrist) < handSize * 1.3;
    const isMiddleFolded = getDist(landmarks[12], wrist) < handSize * 1.3;
    return isIndexFolded && isMiddleFolded;
}

function checkPinch(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const wrist = landmarks[0];
    const middleBase = landmarks[9];
    const handSize = getDist(wrist, middleBase);
    const d1 = getDist(thumbTip, indexTip);
    const d2 = getDist(thumbTip, middleTip);
    return (d1 < handSize * 0.5) || (d2 < handSize * 0.5);
}

function checkOpenHand(landmarks) {
    const wrist = landmarks[0];
    const middleBase = landmarks[9];
    const handSize = getDist(wrist, middleBase);
    return getDist(landmarks[8], wrist) > handSize * 1.4 && getDist(landmarks[12], wrist) > handSize * 1.4;
}

async function toggleHandTracking(forceState = null) {
    const targetState = forceState !== null ? forceState : !isHandTracking;
    const voiceLogContainer = document.getElementById("voice-log-container");
    const cameraPreviewContainer = document.getElementById("camera-preview");

    if (targetState && !isHandTracking) {
        initFaceDetection().then(() => { addLogToUI("👤 Đã tải hệ thống nhận dạng không gian", "log-sys"); }).catch(e => console.log(e));

        if (!camera) {
            const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            camera = new Camera(videoElement, {
                onFrame: async () => { 
                    let processed = processVideoToOffscreen(videoElement);
                    if (!processed) return;
                    
                    if (hands) await hands.send({image: processed}); 
                    if (faceDetection) { try { await faceDetection.send({image: processed}); } catch(e) {} }
                }, 
                width: 320, 
                height: 240,
                facingMode: isMobileDevice ? 'user' : undefined
            });
        }
        camera.start(); isHandTracking = true; handBtn.classList.add("listening"); 
        if (voiceLogContainer) voiceLogContainer.style.display = "none";
        if (cameraPreviewContainer) cameraPreviewContainer.style.display = "block"; 

        addLogToUI("🖐 Đã BẬT Camera Detection", "log-sys");
        speakLocal("Đã bật chế độ điều khiển bằng cử chỉ tay.");
    } else if (!targetState && isHandTracking) {
        if (camera) camera.stop();
        isHandTracking = false; handBtn.classList.remove("listening"); 
        if (voiceLogContainer) voiceLogContainer.style.display = "none"; 
        if (cameraPreviewContainer) cameraPreviewContainer.style.display = "none"; 
        virtualCursor.style.display = "none";
        isPersonPresent = false; if (!isAISpeaking) setAIAvatarState(isPlayingMusic ? 'playmusic' : 'idle');
        
        addLogToUI("⏸ Đã TẮT Camera Detection", "log-sys");
        speakLocal("Đã tắt điều khiển bằng tay.");
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
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    canvasElement.style.transform = "none";

    let activeHands = [];
    if (results.multiHandLandmarks) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            let lm = results.multiHandLandmarks[i][9]; 
            let rawX = lm.x;
            let rawY = lm.y;
            let adjustedX = 1 - rawX; 
            let adjustedY = rawY; 

            activeHands.push({
                x: adjustedX * 800, y: adjustedY * 500,
                cx: adjustedX * window.innerWidth, cy: adjustedY * window.innerHeight,
                landmarks: results.multiHandLandmarks[i]
            });
        }
    }

    if (isGaming && activeGameType === 'shooter') { shooterSlots[0].isTracking = false; shooterSlots[1].isTracking = false; }

    if (activeHands.length > 0) {
        updatePresence(); 
        
        const now = Date.now();
        const canAct = (now - lastGlobalActionTime) > GLOBAL_COOLDOWN; 
        const hideVirtualCursor = isGaming && !isGameOver && (activeGameType === 'shooter' || activeGameType === 'hockey');

        if (hideVirtualCursor) {
            virtualCursor.style.display = "none";
            const isExitGesture = checkHandClosed(activeHands[0].landmarks) || checkPinch(activeHands[0].landmarks);
            
            if (isExitGesture && canAct) { 
                stopGame(); 
                lastGlobalActionTime = now; 
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

        let isClickGesture = isClosed || isPinching;
        let justClosedZoom = false;
        
        if (!wasHandClosed && isClickGesture) {
            isClicking = true; 
            clickStartX = smoothCursor.x; clickStartY = smoothCursor.y; 
            virtualCursor.classList.add("clicking");
            
            if (window.isImageZoomed && window.zoomedImageOverlay && canAct) { 
                closeImageZoom(); 
                justClosedZoom = true; 
                isClicking = false; 
                lastGlobalActionTime = now; 
            }
            
            if (activeGameType === 'stylist' && isGaming && canAct) {
                stopGame();
                lastGlobalActionTime = now;
            }
        }

        if (isClickGesture && isClicking) { 
            if (Math.hypot(smoothCursor.x - clickStartX, smoothCursor.y - clickStartY) > 50) isClicking = false; 
        }

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
                lastGlobalActionTime = now; 
            }
        }

        wasHandClosed = isClickGesture; 
        const wrist = landmarks[0]; 
        
        handPath.push({ x: wrist.x, y: wrist.y }); if (handPath.length > 15) handPath.shift();

        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 3}); drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});

        if (handPath.length >= 10 && !isGameOver && canAct) {
            const rawDx = handPath[handPath.length - 1].x - handPath[0].x; 
            const rawDy = handPath[handPath.length - 1].y - handPath[0].y; 
            
            let dx = -rawDx; 
            let dy = rawDy;

            if (isOpenHand && Math.abs(dx) > 0.15 && Math.abs(dx) > Math.abs(dy) * 1.5) { 
                movePage(dx > 0.15 ? -1 : 1); 
                lastGlobalActionTime = now; 
                handPath = []; 
                canvasCtx.restore(); 
                return; 
            }
            
            if (isPinching && Math.abs(dy) > 0.04 && Math.abs(dy) > Math.abs(dx) * 1.2) {
                let dynamicScroll = Math.abs(dy) * window.innerHeight * 8; 
                dynamicScroll = Math.max(250, Math.min(dynamicScroll, window.innerHeight * 1.2)); 
                
                window.scrollBy({top: dy < 0 ? -dynamicScroll : dynamicScroll, behavior: 'smooth'}); 
                lastGlobalActionTime = now; 
                handPath = []; 
                canvasCtx.restore(); 
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
// 5. GIỌNG NÓI & AI GEMINI (TÍCH HỢP MUSIC, ẢNH/VIDEO RESTRICTIONS)
// ----------------------------------------------------
const API_KEY_VOICE = atob("QUl6YVN5QkpsZ05zNE93WFRKTkN5YVlBUk5faUpaQ2EzYktjb0NN");
const API_KEY_FACE = atob("QVEuQWI4Uk42SjBjNGR4bENJV29iTHZ2SWlzbTFYVFdjbWlBeGFHU3VyWnFpZE5Za3JSQ0E=");

const voiceBtn = document.getElementById("voice-btn");

// [TỐI ƯU HÓA] Thêm bộ nhớ đệm Cache để tiết kiệm token
const aiResponseCache = new Map();

const localKeywordMap = [
    { keywords: ["phát nhạc random", "mở nhạc random", "phát nhạc ngẫu nhiên", "mở nhạc ngẫu nhiên"], action: "play_music_random" },
    { keywords: ["phát nhạc", "bật nhạc", "mở nhạc", "nghe nhạc", "bật nhạc lofi", "mở nhạc lofi", "nghe nhạc lofi", "bật nhạc cozy", "mở nhạc cozy", "nghe nhạc cozy"], action: "play_music" },
    { keywords: ["chuyển bài hát", "bật bài tiếp theo", "bài tiếp theo", "đổi bài", "chuyển bài", "next song"], action: "next_music" },
    { keywords: ["tắt nhạc", "tắt bài hát", "ngừng nhạc", "dừng phát nhạc hoàn toàn"], action: "stop_music" },
    { keywords: ["dừng nhạc", "tạm dừng nhạc", "pause nhạc"], action: "pause_music" },
    { keywords: ["chạy nhạc tiếp", "tiếp tục nhạc", "phát tiếp", "phát lại nhạc", "tiếp tục phát nhạc"], action: "resume_music" },

    { keywords: ["face detection", "nhận diện khuôn mặt", "ai stylist", "trợ lý thời trang"], action: "start_game", game: "stylist" },
    { keywords: ["chơi game space shooter", "chơi space shooter", "bắn ruồi", "bắn súng không gian", "phi thuyền"], action: "start_game", game: "shooter" },
    { keywords: ["chơi game air hockey", "chơi air hockey", "khúc côn cầu", "bóng bàn"], action: "start_game", game: "hockey" },
    { keywords: ["chơi game", "giải trí"], action: "start_game", game: "random" },
    { keywords: ["chơi lại", "làm lại", "bắt đầu lại"], action: "reset_game" },
    
    { keywords: ["bật điều khiển tay", "bật chế độ tay", "bật cử chỉ tay", "dùng tay", "kích hoạt điều khiển tay"], action: "hand_on" },
    { keywords: ["tắt điều khiển tay", "tắt chế độ tay", "tắt cử chỉ tay", "ngừng dùng tay", "vô hiệu hóa điều khiển tay"], action: "hand_off" },
    { keywords: ["toàn màn hình", "phóng to"], action: "fullscreen" },
    { keywords: ["thoát", "đóng", "tắt", "rời khỏi"], action: "exit_action" },

    { keywords: ["sang phải", "tiếp theo", "trang sau"], action: "move_right" },
    { keywords: ["sang trái", "lùi lại", "trang trước"], action: "move_left" },
    { keywords: ["trang chủ", "màn hình chính"], action: "navigate", page: "home" },
    { keywords: ["sản phẩm"], action: "navigate", page: "product" },
    { keywords: ["thực tế ảo", "vr"], action: "navigate", page: "vr" },
    { keywords: ["thực tế tăng cường", "ar"], action: "navigate", page: "ar" }, 
    { keywords: ["nhận diện chuyển động", "motion detection", "nhận diện", "detection"], action: "navigate", page: "detection" }, 
    { keywords: ["giải pháp"], action: "navigate", page: "solution" },
    { keywords: ["công ty", "về chúng tôi"], action: "navigate", page: "company" },
    { keywords: ["liên hệ", "hỗ trợ"], action: "navigate", page: "contact" }
];

let isVoiceListening = false; let isCommandProcessing = false; 

if (SpeechRecognition) {
    recognition = new SpeechRecognition(); 
    recognition.lang = 'vi-VN'; 
    recognition.interimResults = false; 
    recognition.continuous = false; 

    voiceBtn.addEventListener("click", () => {
        if (!isVoiceListening) {
            try {
                isVoiceListening = true; 
                voiceBtn.classList.add("listening");
                addLogToUI("▶ Đã BẬT Điều khiển Giọng nói", "log-sys");
                speakLocal("Đã bật chế độ điều khiển bằng giọng nói."); 
            } catch(e) {}
        } else {
            isVoiceListening = false; 
            try { recognition.stop(); } catch(e) {}
            voiceBtn.classList.remove("listening"); 
            addLogToUI("⏸ Đã TẮT Điều khiển Giọng nói", "log-sys");
            speakLocal("Đã tắt nhận diện giọng nói.");
        }
    });

    recognition.onerror = (event) => { 
        if (event.error === 'not-allowed' || event.error === 'aborted') { 
            isVoiceListening = false; voiceBtn.classList.remove("listening"); 
            addLogToUI("❌ Lỗi Micro: Quyền bị từ chối.", "log-error"); 
        } 
    };

    recognition.onresult = async (event) => {
        if (isCommandProcessing || isAISpeaking) return; 
        const result = event.results[event.resultIndex][0]; 
        let originalTranscript = result.transcript.toLowerCase().trim().replace(/[.,!?]/g, "");
        if (result.confidence < 0.6 || originalTranscript.length <= 2 || !originalTranscript.match(/[a-z0-9]/i) || /^([a-zơôoăâeêiuưy])\1+$/i.test(originalTranscript.replace(/\s/g, ''))) return;
        
        addLogToUI(`🎤 "${originalTranscript}"`, "log-user"); 
        isCommandProcessing = true; 
        try { recognition.stop(); } catch(e) {} 

        try {
            let viTranscript = originalTranscript;
            if (originalTranscript.length > 2) {
                viTranscript = await translateZeroToken(originalTranscript, 'vi');
                viTranscript = viTranscript.toLowerCase().trim().replace(/[.,!?]/g, "");
                if (viTranscript !== originalTranscript) {
                    addLogToUI(`🔤 Ý nghĩa (VN): "${viTranscript}"`, "log-sys");
                }
            }

            if (isGaming) {
                if (viTranscript.includes("chơi lại") || viTranscript.includes("làm lại")) { resetCurrentGame(); return; }
                if (viTranscript.includes("full screen") || viTranscript.includes("toàn màn hình") || viTranscript.includes("phóng to")) { toggleFullScreen(); return; }
                if (localKeywordMap.find(m => m.action === "exit_action").keywords.some(kw => viTranscript.includes(kw) && !viTranscript.includes("nhạc"))) { 
                    toggleFullScreen(true, true); stopGame(); return; 
                }
            }

            let exactMatch = null;
            let langMatch = viTranscript.match(/^(?:phiên )?(?:dịch|chuyển|đổi) (?:sang|thành|qua) (?:tiếng|ngôn ngữ) (.+)$/);
            if (langMatch) {
                let langName = langMatch[1].trim();
                let targetLang = langMap[langName];
                if (targetLang) {
                    exactMatch = { action: "translate_lang", targetLang: targetLang };
                }
            }

            if (!exactMatch) {
                for (const item of localKeywordMap) { 
                    if (item.keywords.some(kw => viTranscript.includes(kw) || originalTranscript.includes(kw))) { 
                        exactMatch = item; break; 
                    } 
                }
            }

            if (exactMatch) {
                executeLocalAction(exactMatch);
            } else {
                addLogToUI("🧠 Đang hỏi AI Gemini (Chat/Lệnh phức tạp)...", "log-sys");
                if(aiStatusText) aiStatusText.innerText = "Đang suy nghĩ...";
                await callGeminiToNavigate(viTranscript, originalTranscript); 
            }
        } finally { 
            setTimeout(() => { isCommandProcessing = false; }, 2000); 
        }
    };
    recognition.onend = () => { if (isVoiceListening && !isAISpeaking) { setTimeout(() => { if (isVoiceListening && !isAISpeaking) { try { recognition.start(); } catch (e) {} } }, 500); } };
}

function executeLocalAction(matchObj) {
    if (matchObj.action === "start_game") startGame(matchObj.game);
    else if (matchObj.action === "stop_game") stopGame();
    else if (matchObj.action === "reset_game") resetCurrentGame();
    else if (matchObj.action === "fullscreen") toggleFullScreen();
    else if (matchObj.action === "exit_action") { 
        toggleFullScreen(true, true); 
        if (isGaming) stopGame(); 
        else {
            navigateTo('detection', "", false);
            speakLocal("Đã thoát và quay lại trang nhận diện.");
        } 
    }
    else if (matchObj.action === "translate_lang") switchWebsiteLanguage(matchObj.targetLang);
    else if (matchObj.action === "hand_on") toggleHandTracking(true);
    else if (matchObj.action === "hand_off") toggleHandTracking(false);
    else if (matchObj.action === "move_right") movePage(1);
    else if (matchObj.action === "move_left") movePage(-1);
    else if (matchObj.action === "navigate") navigateTo(matchObj.page);
    
    else if (matchObj.action === "play_music") playMusicLogic(false);
    else if (matchObj.action === "play_music_random") playMusicLogic(true);
    else if (matchObj.action === "next_music") nextMusicTrack();
    else if (matchObj.action === "stop_music") stopMusicLogic();
    else if (matchObj.action === "pause_music") pauseMusicLogic();
    else if (matchObj.action === "resume_music") resumeMusicLogic();
}

// Hàm bổ trợ thực thi Intent từ Gemini
function executeGeminiIntent(intent) {
    if (intent.action === "start_game") startGame(intent.game || 'random');
    else if (intent.action === "exit_action") { 
        toggleFullScreen(true, true); 
        if (isGaming) stopGame(); 
        else { navigateTo('detection', "", false); speakLocal("Đã thoát và quay lại trang nhận diện."); } 
    }
    else if (intent.action === "fullscreen") toggleFullScreen();
    else if (intent.action === "translate_lang") switchWebsiteLanguage(intent.targetLang);
    else if (intent.action === "toggle_hand") toggleHandTracking(intent.state !== undefined ? intent.state : null);
    else if (intent.action === "navigate") navigateTo(intent.page);
    
    else if (intent.action === "play_music") playMusicLogic(false);
    else if (intent.action === "play_music_random") playMusicLogic(true);
    else if (intent.action === "next_music") nextMusicTrack();
    else if (intent.action === "stop_music") stopMusicLogic();
    else if (intent.action === "pause_music") pauseMusicLogic();
    else if (intent.action === "resume_music") resumeMusicLogic();
    
    else if (intent.action === "chat" || intent.action === "action_answer") {
        updateAIAssistant(intent.response, true, intent.lang || currentLang);
        if (intent.trigger_music) {
            setTimeout(() => { playMusicLogic(false); }, 1500);
        }
    }
}

// [CẬP NHẬT TỐI ƯU TOKEN] HÀM GỌI GEMINI XỬ LÝ CHATBOT VÀ LỆNH
async function callGeminiToNavigate(viText, originalText = viText) {
    // 1. Kiểm tra Cache cục bộ
    const cacheKey = originalText.toLowerCase().trim();
    if (aiResponseCache.has(cacheKey)) {
        addLogToUI("⚡ Lấy kết quả từ Cache (Tiết kiệm token)", "log-success");
        const cachedIntent = aiResponseCache.get(cacheKey);
        executeGeminiIntent(cachedIntent);
        return;
    }

    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    let timeOfDay = "buổi sáng";
    if (currentHour >= 12 && currentHour < 18) timeOfDay = "buổi chiều";
    else if (currentHour >= 18) timeOfDay = "buổi tối";
    const timeString = currentTime.toLocaleTimeString('vi-VN');

    // 2. Dynamic Tooling: Chỉ gắn Search khi gặp từ khóa cần thiết
    const needsSearch = /(thời tiết|tin tức|giá|hôm nay|ai là|cái gì|ở đâu)/i.test(viText);
    let payload = {
        contents: [{ parts: [{ text: "" }] }]
    };
    
    if (needsSearch) {
        payload.tools = [{ googleSearch: {} }];
        addLogToUI("🔍 Bật Google Search để tra cứu...", "log-sys");
    }

    // 3. Prompt Rút Gọn (Giảm thiểu token gửi đi)
    const prompt = `Bạn là trợ lý AI của Onion Tech. Xưng "Tôi". Hiện tại: Hà Nội, ${timeString} (${timeOfDay}).
Gốc: "${originalText}" | Dịch: "${viText}"
Nhiệm vụ: Trả về JSON, KHÔNG giải thích.
- Phản hồi đúng ngôn ngữ của câu gốc.
- Nếu yêu cầu tạo ảnh/video/nhạc cụ thể/nhạc ko hợp lệ (rock, edm) -> action: "chat", từ chối lịch sự.
- Nhạc hợp lệ (lofi, cozy, random) -> action: "play_music" (hoặc play_music_random).
- Điều khiển (mở trang chủ, game, bật/tắt tay, dịch web) -> action: navigate, start_game, translate_lang, toggle_hand.
- Trò chuyện -> action: "chat". (Hỏi thăm ngắn gọn <30 từ. Nếu user buồn -> an ủi & trigger_music: true).
Format: {"action": "chat", "response": "Câu trả lời", "lang": "Mã ISO", "trigger_music": true/false}`;

    payload.contents[0].parts[0].text = prompt;

    try {
        if (!navigator.onLine) throw new Error("OFFLINE_NETWORK");
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY_VOICE}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error(`HTTP_ERROR`);
        
        const data = await response.json();
        let resultText = data.candidates[0].content.parts[0].text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const intent = JSON.parse(resultText);

        // 4. Lưu kết quả vào Cache (Giới hạn 50 câu để chống tràn RAM)
        if (aiResponseCache.size > 50) {
            const firstKey = aiResponseCache.keys().next().value;
            aiResponseCache.delete(firstKey);
        }
        aiResponseCache.set(cacheKey, intent);
        
        // Thực thi hành động
        executeGeminiIntent(intent);
        
    } catch (error) { 
        console.error("Gemini Error: ", error);
        let fallbackMatch = null;
        for (const item of localKeywordMap) {
            if (item.keywords.some(kw => viText.includes(kw))) { fallbackMatch = item; break; }
        }
        if (fallbackMatch) { executeLocalAction(fallbackMatch); } 
        else {
            addLogToUI("❌ Lỗi mạng hoặc AI quá tải.", "log-error");
            speakLocal("Xin lỗi, tôi không thể xử lý thông tin này ngay bây giờ.", true);
        }
    }
}

// ----------------------------------------------------
// 6. HỆ THỐNG PHÁT NHẠC (HIDDEN MUSIC PLAYER)
// ----------------------------------------------------
// BẠN HÃY CHÈN ĐÚNG TÊN FILE NHẠC CỦA BẠN VÀO MẢNG BÊN DƯỚI NHÉ!
let musicPlaylist = [
    "music/song1.mp3",
    "music/song2.mp3",
    "music/song3.mp3",
    "music/song4.mp3"
]; 
const audioPlayer = new Audio();
let currentMusicIndex = 0;
let isMusicRandom = false;
let isMusicInitialized = false;

audioPlayer.addEventListener('ended', () => {
    nextMusicTrack(true); 
});

function playMusicLogic(random = false) {
    if (musicPlaylist.length === 0) {
        speakLocal("Không tìm thấy bài hát nào trong danh sách.");
        return;
    }
    isMusicRandom = random;
    if (isMusicRandom) {
        currentMusicIndex = Math.floor(Math.random() * musicPlaylist.length);
    } else {
        currentMusicIndex = 0;
    }
    audioPlayer.src = musicPlaylist[currentMusicIndex];
    audioPlayer.play().catch(e => console.log("Lỗi phát nhạc:", e));
    isMusicInitialized = true;
    isPlayingMusic = true;
    
    // Đổi Avatar sang Play Music ngay lập tức nếu AI không đang nói
    if (!isAISpeaking) setAIAvatarState('playmusic');
    
    // Chỉ báo qua UI để không đè lên câu nói an ủi của Chatbot (nếu gọi từ Chat)
    addLogToUI(`🎵 Đang phát nhạc: ${musicPlaylist[currentMusicIndex]}`, "log-sys");
}

function nextMusicTrack(isAutoNext = false) {
    if (!isMusicInitialized) {
        if(!isAutoNext) speakLocal("Vui lòng phát nhạc trước khi chuyển bài.");
        return;
    }
    if (isMusicRandom) {
        let newIndex = currentMusicIndex;
        while (newIndex === currentMusicIndex && musicPlaylist.length > 1) {
            newIndex = Math.floor(Math.random() * musicPlaylist.length);
        }
        currentMusicIndex = newIndex;
    } else {
        currentMusicIndex = (currentMusicIndex + 1) % musicPlaylist.length;
    }
    audioPlayer.src = musicPlaylist[currentMusicIndex];
    audioPlayer.play().catch(e => console.log(e));
    isPlayingMusic = true;
    
    if (!isAISpeaking) setAIAvatarState('playmusic');
    if (!isAutoNext) speakLocal("Đã chuyển bài hát tiếp theo.");
    addLogToUI(`🎵 Đang phát: ${musicPlaylist[currentMusicIndex]}`, "log-sys");
}

function stopMusicLogic() {
    if (!isMusicInitialized) return;
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    isMusicInitialized = false;
    isPlayingMusic = false;
    
    if (!isAISpeaking) setAIAvatarState(isPersonPresent ? 'wave' : 'idle');
    speakLocal("Đã tắt nhạc hoàn toàn.");
    addLogToUI(`🎵 Đã tắt nhạc.`, "log-sys");
}

function pauseMusicLogic() {
    if (!isMusicInitialized) return;
    audioPlayer.pause();
    isPlayingMusic = false;
    
    if (!isAISpeaking) setAIAvatarState(isPersonPresent ? 'wave' : 'idle');
    speakLocal("Đã tạm dừng nhạc.");
    addLogToUI(`🎵 Đã tạm dừng nhạc.`, "log-sys");
}

function resumeMusicLogic() {
    if (!isMusicInitialized) {
        speakLocal("Chưa có bài hát nào đang mở.");
        return;
    }
    audioPlayer.play().catch(e => console.log(e));
    isPlayingMusic = true;
    
    if (!isAISpeaking) setAIAvatarState('playmusic');
    speakLocal("Đã tiếp tục phát nhạc.");
    addLogToUI(`🎵 Tiếp tục phát.`, "log-sys");
}