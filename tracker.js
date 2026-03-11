/**
 * User Tracking Script
 * Melacak pengguna ketika keluar dari website
 */

// Konfigurasi pelacakan
const TRACKING_CONFIG = {
    endpoint: '/api/track', // Endpoint untuk mengirim data
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

// Fungsi untuk mengirim data pelacakan menggunakan Beacon API
function sendTrackingData(data, type = 'pageview') {
    const payload = {
        ...data,
        eventType: type,
        timestamp: Date.now(),
        timeOnPage: Date.now() - TRACKING_CONFIG.sessionStart
    };

    // Menggunakan Beacon API (paling可靠 untuk saat unload)
    if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(TRACKING_CONFIG.endpoint, blob);
        console.log('Tracking data sent via Beacon:', payload);
    } else {
        // Fallback ke fetch
        fetch(TRACKING_CONFIG.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(err => console.error('Tracking error:', err));
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

