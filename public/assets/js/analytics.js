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

    // Get IP and location info (using ipapi.co - free service)
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        info.ip = data.ip;
        info.city = data.city;
        info.region = data.region;
        info.country = data.country_name;
        info.countryCode = data.country_code;
        info.timezone = data.timezone;
        info.isp = data.org;
        info.latitude = data.latitude;
        info.longitude = data.longitude;
    } catch (error) {
        console.log('Could not fetch IP info:', error);
        info.ip = 'Unknown';
        info.location = 'Unknown';
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

// Send to Telegram
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
            })
        });

        if (response.ok) {
            console.log('Analytics sent to Telegram');
        }
    } catch (error) {
        console.log('Failed to send analytics:', error);
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
        console.log('Analytics saved to Firebase');
    } catch (error) {
        console.log('Failed to save analytics to Firebase:', error);
    }
}

// Track page view
async function trackPageView() {
    const info = await getVisitorInfo();
    
    // Send to Telegram
    await sendToTelegram(info);
    
    // Save to Firebase
    await saveToFirebase(info);
}

// Run analytics on page load
if (TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN' && TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID') {
    trackPageView();
} else {
    console.log('⚠️ Please configure Telegram bot credentials in analytics.js');
}

// Track time spent on page
let startTime = Date.now();
window.addEventListener('beforeunload', () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    // You can send this to Firebase if needed
    console.log(`Time spent: ${timeSpent} seconds`);
});
