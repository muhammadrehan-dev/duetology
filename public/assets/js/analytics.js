// Get visitor information
async function getVisitorInfo() {
    const info = {
        timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
        page: window.location.pathname,
        pageTitle: document.title,
        referrer: document.referrer || 'Direct',
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine
    };

    // Get device type
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) {
        info.deviceType = 'Mobile';
    } else if (/tablet|ipad/i.test(ua)) {
        info.deviceType = 'Tablet';
    } else {
        info.deviceType = 'Desktop';
    }

    // Get browser info
    if (ua.indexOf('Chrome') > -1) {
        info.browser = 'Chrome';
    } else if (ua.indexOf('Safari') > -1) {
        info.browser = 'Safari';
    } else if (ua.indexOf('Firefox') > -1) {
        info.browser = 'Firefox';
    } else if (ua.indexOf('Edge') > -1) {
        info.browser = 'Edge';
    } else {
        info.browser = 'Other';
    }

    // Get basic timezone info (always works)
    info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Try to get IP info from multiple CORS-friendly services
    let ipInfoFetched = false;
    
    // Service 1: ipify.org for IP only (very reliable, CORS-friendly)
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json', {
            signal: AbortSignal.timeout(3000)
        });
        const ipData = await ipResponse.json();
        info.ip = ipData.ip;
        ipInfoFetched = true;
    } catch (error) {
        // Silent fail
    }

    // Service 2: Try ipapi.co (if not blocked)
    if (!ipInfoFetched) {
        try {
            const response = await fetch('https://ipapi.co/json/', {
                signal: AbortSignal.timeout(3000)
            });
            const data = await response.json();
            
            info.ip = data.ip;
            info.city = data.city;
            info.region = data.region;
            info.country = data.country_name;
            info.countryCode = data.country_code;
            info.isp = data.org;
            info.latitude = data.latitude;
            info.longitude = data.longitude;
            ipInfoFetched = true;
        } catch (error) {
            // Silent fail
        }
    }

    // Service 3: Try ip-api.com via HTTPS (if not blocked)
    if (!ipInfoFetched) {
        try {
            const response = await fetch('https://ip-api.com/json/', {
                signal: AbortSignal.timeout(3000)
            });
            const data = await response.json();
            
            info.ip = data.query;
            info.city = data.city;
            info.region = data.regionName;
            info.country = data.country;
            info.countryCode = data.countryCode;
            info.isp = data.isp;
            info.latitude = data.lat;
            info.longitude = data.lon;
            ipInfoFetched = true;
        } catch (error) {
            // Silent fail
        }
    }

    // Service 4: Cloudflare trace (very reliable)
    if (!ipInfoFetched) {
        try {
            const response = await fetch('https://1.1.1.1/cdn-cgi/trace', {
                signal: AbortSignal.timeout(3000)
            });
            const text = await response.text();
            const lines = text.split('\n');
            const traceData = {};
            lines.forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) traceData[key] = value;
            });
            
            info.ip = traceData.ip || 'Unknown';
            info.country = traceData.loc || 'Unknown';
            info.countryCode = traceData.loc || 'XX';
            ipInfoFetched = true;
        } catch (error) {
            // Silent fail
        }
    }

    // If all services fail, use defaults
    if (!ipInfoFetched || !info.ip) {
        info.ip = 'Not available';
        info.city = 'Unknown';
        info.region = 'Unknown';
        info.country = 'Unknown';
        info.countryCode = 'XX';
        info.isp = 'Unknown';
        info.latitude = null;
        info.longitude = null;
    }

    return info;
}

// Save to Firebase Analytics
import { database } from './firebase-config.js';
import { ref, push } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

async function saveToFirebase(info) {
    try {
        const analyticsRef = ref(database, 'analytics');
        await push(analyticsRef, {
            ...info,
            timestamp: Date.now()
        });
        return true;
    } catch (error) {
        return false;
    }
}

// Track page view
async function trackPageView() {
    try {
        const info = await getVisitorInfo();
        
        // Save to Firebase (primary storage - wait for this)
        await saveToFirebase(info);
    } catch (error) {
        // Silent fail
    }
}

// Run analytics on page load
setTimeout(() => {
    trackPageView();
}, 100);

// Track time spent on page
let startTime = Date.now();
window.addEventListener('beforeunload', async () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    // Try to save time spent to Firebase using sendBeacon for reliability
    try {
        const analyticsRef = ref(database, 'time-spent');
        await push(analyticsRef, {
            page: window.location.pathname,
            timeSpent: timeSpent,
            timestamp: Date.now()
        });
    } catch (error) {
        // Silent fail
    }
});
