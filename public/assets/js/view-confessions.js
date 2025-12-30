import { database } from './firebase-config.js';
import { ref, onValue, update, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const confessionsContainer = document.getElementById('confessionsContainer');
const loadingDiv = document.getElementById('loading');
const noConfessionsDiv = document.getElementById('noConfessions');
const categoryFilter = document.getElementById('categoryFilter');

let allConfessions = [];

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Create confession card
function createConfessionCard(confession) {
    const card = document.createElement('div');
    card.className = 'confession-card';
    card.dataset.category = confession.category;
    
    const categoryColors = {
        love: '#ec4899',
        work: '#8b5cf6',
        family: '#10b981',
        friendship: '#3b82f6',
        secret: '#f59e0b',
        regret: '#ef4444',
        happiness: '#14b8a6',
        general: '#6366f1',
        other: '#64748b'
    };
    
    const categoryColor = categoryColors[confession.category] || categoryColors.general;
    
    card.innerHTML = `
        <span class="confession-category" style="background: ${categoryColor}">
            ${confession.category}
        </span>
        <p class="confession-text">${escapeHtml(confession.text)}</p>
        <div class="confession-meta">
            <span class="confession-date">${formatDate(confession.timestamp)}</span>
            <button class="like-btn" data-id="${confession.id}">
                ❤️ <span class="like-count">${confession.likes || 0}</span>
            </button>
        </div>
    `;
    
    return card;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Display confessions
function displayConfessions(confessions) {
    confessionsContainer.innerHTML = '';
    
    if (confessions.length === 0) {
        loadingDiv.classList.add('hidden');
        noConfessionsDiv.classList.remove('hidden');
        return;
    }
    
    loadingDiv.classList.add('hidden');
    noConfessionsDiv.classList.add('hidden');
    
    confessions.forEach(confession => {
        const card = createConfessionCard(confession);
        confessionsContainer.appendChild(card);
    });
    
    // Add like button listeners
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', handleLike);
    });
}

// Handle like button click
async function handleLike(e) {
    const btn = e.currentTarget;
    const confessionId = btn.dataset.id;
    const likeCountSpan = btn.querySelector('.like-count');
    
    try {
        const confessionRef = ref(database, `confessions/${confessionId}`);
        const snapshot = await get(confessionRef);
        
        if (snapshot.exists()) {
            const currentLikes = snapshot.val().likes || 0;
            await update(confessionRef, {
                likes: currentLikes + 1
            });
            
            likeCountSpan.textContent = currentLikes + 1;
            btn.style.color = '#ec4899';
            btn.disabled = true;
        }
    } catch (error) {
        console.error('Error updating likes:', error);
    }
}

// Filter confessions by category
function filterConfessions(category) {
    if (category === 'all') {
        displayConfessions(allConfessions);
    } else {
        const filtered = allConfessions.filter(c => c.category === category);
        displayConfessions(filtered);
    }
}

// Category filter event
categoryFilter.addEventListener('change', (e) => {
    filterConfessions(e.target.value);
});

// Load confessions from Firebase
const confessionsRef = ref(database, 'confessions');
onValue(confessionsRef, (snapshot) => {
    const data = snapshot.val();
    
    if (!data) {
        allConfessions = [];
        displayConfessions([]);
        return;
    }
    
    // Convert object to array and sort by timestamp (newest first)
    allConfessions = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply current filter
    filterConfessions(categoryFilter.value);
});