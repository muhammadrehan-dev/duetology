// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '8578662221:AAH_O5I0ebg_yLWjj-PgDJOJV7-ViEqm42k';
const TELEGRAM_CHAT_ID = '8488968721';

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
        console.log('ipify.org failed, trying next service...');
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
            console.log('ipapi.co failed, trying next service...');
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
            console.log('ip-api.com failed, trying next service...');
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
            console.log('Cloudflare trace failed');
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

// Format message for Telegram
function formatTelegramMessage(info) {
    return `
🔔 <b>New Visitor on DUETology</b>

📱 <b>Device Info:</b>
• Type: ${info.deviceType}
• Browser: ${info.browser}
• Platform: ${info.platform}
• Screen: ${info.screenResolution}

🌐 <b>Location:</b>
• IP: <code>${info.ip}</code>
• City: ${info.city || 'N/A'}
• Region: ${info.region || 'N/A'}
• Country: ${info.country || 'N/A'} (${info.countryCode || 'N/A'})
• ISP: ${info.isp || 'N/A'}
• Timezone: ${info.timezone || 'N/A'}

📄 <b>Page Info:</b>
• Page: ${info.pageTitle}
• URL: ${info.page}
• Referrer: ${info.referrer}

⏰ <b>Time:</b> ${info.timestamp}

🔗 <b>User Agent:</b>
<code>${info.userAgent}</code>
    `.trim();
}

// Send to Telegram with timeout
async function sendToTelegram(info) {
    const message = formatTelegramMessage(info);
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (response.ok) {
            console.log('✅ Analytics sent to Telegram');
            return true;
        } else {
            console.log('⚠️ Telegram response error:', response.status);
            return false;
        }
    } catch (error) {
        if (error.name === 'TimeoutError') {
            console.log('⚠️ Telegram request timed out (may be blocked in your region)');
        } else {
            console.log('⚠️ Could not reach Telegram:', error.message);
        }
        return false;
    }
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
        console.log('✅ Analytics saved to Firebase');
        return true;
    } catch (error) {
        console.log('❌ Failed to save analytics to Firebase:', error);
        return false;
    }
}

// Track page view
async function trackPageView() {
    console.log('🔍 Tracking page view...');
    
    try {
        const info = await getVisitorInfo();
        
        // Try to send to Telegram (don't wait for it, it might timeout)
        sendToTelegram(info).catch(() => {
            // Silently fail if Telegram is blocked
        });
        
        // Save to Firebase (primary storage - wait for this)
        const firebaseSuccess = await saveToFirebase(info);
        
        if (firebaseSuccess) {
            console.log('📊 Analytics tracking complete');
        } else {
            console.log('⚠️ Analytics tracking had issues');
        }
    } catch (error) {
        console.log('❌ Analytics tracking failed:', error);
    }
}

// Run analytics on page load
if (TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN' && TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID') {
    // Use setTimeout to avoid blocking page load
    setTimeout(() => {
        trackPageView();
    }, 100);
} else {
    console.log('⚠️ Please configure Telegram bot credentials in analytics.js');
}

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
        console.log('Could not save time spent data');
    }
    
    console.log(`Time spent: ${timeSpent} seconds`);
});
