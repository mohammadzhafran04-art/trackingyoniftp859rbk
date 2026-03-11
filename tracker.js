/**
 * User Tracking Script
 * Melacak pengguna ketika keluar dari website
 *Versi Simple - Simpan ke localStorage dan console
 */

// Konfigurasi pelacakan
const TRACKING_CONFIG = {
    trackingId: 'user_' + Math.random().toString(36).substr(2, 9),
    sessionStart: Date.now()
};

// Data yang akan dilacak
let trackingData = {
    trackingId: TRACKING_CONFIG.trackingId,
    sessionStart: TRACKING_CONFIG.sessionStart,
    pageUrl: window.location.href,
    pageTitle: document.title,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    platform: navigator.platform,
    cookiesEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine
};

// Fungsi untuk menyimpan data pelacakan ke localStorage
function sendTrackingData(data, type = 'pageview') {
    const payload = {
        ...data,
        eventType: type,
        timestamp: Date.now(),
        timeOnPage: Date.now() - TRACKING_CONFIG.sessionStart
    };

    // SIMPAN KE LOCALSTORAGE - Ini yang terpenting!
    // Data akan tersimpan就算 tab ditutup
    let history = JSON.parse(localStorage.getItem('userTrackingHistory') || '[]');
    history.push(payload);
    
    // Batasi hanya 50 data terakhir
    if (history.length > 50) history = history.slice(-50);
    
    localStorage.setItem('userTrackingHistory', JSON.stringify(history));
    localStorage.setItem('lastTrackingData', JSON.stringify(payload));
    
    // SIMPAN TRACKING ID ke localStorage - agar bisa identification user lama
    localStorage.setItem('userTrackingId', TRACKING_CONFIG.trackingId);
    localStorage.setItem('lastVisit', Date.now());
    
    console.log('📊 Tracking:', type, payload);
    console.log('📊 Total history:', history.length);
}

// Fungsi fingerprint untuk identification user
function getFingerprint() {
    const fp = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cores: navigator.hardwareConcurrency,
        memory: navigator.deviceMemory,
        plugins: navigator.plugins.length,
        doNotTrack: navigator.doNotTrack
    };
    return btoa(JSON.stringify(fp)).substring(0, 50);
}

// Cek jika user sudah pernah datang sebelumnya
function checkReturningUser() {
    const lastVisit = localStorage.getItem('lastVisit');
    const savedId = localStorage.getItem('userTrackingId');
    const fingerprint = getFingerprint();
    
    if (lastVisit) {
        const hoursSinceLastVisit = (Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60);
        console.log(`👋 Welcome back! Last visit: ${hoursSinceLastVisit.toFixed(1)} hours ago`);
        console.log(`🔑 Your User ID: ${savedId || TRACKING_CONFIG.trackingId}`);
        console.log(`🔍 Fingerprint: ${fingerprint}`);
    }
}

// Fungsi untuk melacak saat pengguna Maus Keluar (mouse leave window)
function trackMouseLeave() {
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0) {
            // Mouse keluar dari atas (likely closing tab)
            sendTrackingData(trackingData, 'mouse_leave_top');
        }
    });
}

// Fungsi untuk melacak saat pengguna menutup tab/browser
function trackPageUnload() {
    // Sebelum unload - menggunakan beforeunload
    window.addEventListener('beforeunload', (e) => {
        const timeOnPage = Date.now() - TRACKING_CONFIG.sessionStart;
        trackingData.timeOnPage = timeOnPage;
        
        // Kirim data menggunakan Beacon
        sendTrackingData(trackingData, 'before_unload');
    });

    // Saat unload (tab ditutup)
    window.addEventListener('unload', () => {
        sendTrackingData(trackingData, 'unload');
    });

    // Saat pagehide (khusus untuk mobile/iOS)
    window.addEventListener('pagehide', () => {
        sendTrackingData(trackingData, 'pagehide');
    });
}

// Fungsi untuk melacak visibilitas halaman (user switch tab/minimize)
function trackVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            sendTrackingData(trackingData, 'page_hidden');
        } else {
            sendTrackingData(trackingData, 'page_visible');
        }
    });
}

// Fungsi untuk melacak fokus jendela
function trackWindowFocus() {
    window.addEventListener('blur', () => {
        sendTrackingData(trackingData, 'window_blur');
    });
    
    window.addEventListener('focus', () => {
        sendTrackingData(trackingData, 'window_focus');
    });
}

// Fungsi untuk melacak scroll depth
let maxScroll = 0;
function trackScrollDepth() {
    window.addEventListener('scroll', () => {
        const scrollPercent = Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            trackingData.maxScrollDepth = maxScroll;
        }
    });
}

// Inisialisasi semua pelacakan
function initTracking() {
    // Kirim data saat halaman dimuat
    sendTrackingData(trackingData, 'page_load');
    
    // Aktifkan semua pelacakan
    trackMouseLeave();
    trackPageUnload();
    trackVisibilityChange();
    trackWindowFocus();
    trackScrollDepth();
    
    console.log('Tracking initialized with ID:', TRACKING_CONFIG.trackingId);
}

// Jalankan saat DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
} else {
    initTracking();
}

// Export untuk penggunaan eksternal
window.UserTracker = {
    sendEvent: (eventName, eventData) => {
        sendTrackingData({ ...trackingData, customEvent: eventName, ...eventData }, 'custom_event');
    },
    getTrackingId: () => TRACKING_CONFIG.trackingId
};

