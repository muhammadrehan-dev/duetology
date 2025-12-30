import { database } from './firebase-config.js';
import { ref, onValue, update, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const ratingsContainer = document.getElementById('ratingsContainer');
const loadingDiv = document.getElementById('loading');
const noRatingsDiv = document.getElementById('noRatings');
const departmentFilter = document.getElementById('departmentFilter');
const searchInput = document.getElementById('searchInput');
const starsFilter = document.getElementById('starsFilter');

let allRatings = [];
let teacherStats = {};

// localStorage key for tracking helpful ratings
const HELPFUL_RATINGS_KEY = 'duetology_helpful_ratings';

// Get list of rating IDs that user has marked as helpful
function getHelpfulRatings() {
    const helpful = localStorage.getItem(HELPFUL_RATINGS_KEY);
    return helpful ? JSON.parse(helpful) : [];
}

// Add rating ID to helpful list
function addHelpfulRating(ratingId) {
    const helpful = getHelpfulRatings();
    if (!helpful.includes(ratingId)) {
        helpful.push(ratingId);
        localStorage.setItem(HELPFUL_RATINGS_KEY, JSON.stringify(helpful));
    }
}

// Check if user has marked rating as helpful
function hasMarkedHelpful(ratingId) {
    const helpful = getHelpfulRatings();
    return helpful.includes(ratingId);
}

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

// Calculate teacher statistics
function calculateTeacherStats(ratings) {
    const stats = {};
    
    ratings.forEach(rating => {
        const key = `${rating.teacherName}_${rating.department}`;
        
        if (!stats[key]) {
            stats[key] = {
                teacherName: rating.teacherName,
                department: rating.department,
                totalRatings: 0,
                totalStars: 0,
                ratings: []
            };
        }
        
        stats[key].totalRatings++;
        stats[key].totalStars += rating.stars;
        stats[key].ratings.push(rating);
    });
    
    return stats;
}

// Create star display
function createStarDisplay(rating, averageRating = null) {
    const displayRating = averageRating !== null ? averageRating : rating;
    let stars = '';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(displayRating)) {
            stars += '<span class="star filled">★</span>';
        } else if (i === Math.ceil(displayRating) && displayRating % 1 !== 0) {
            stars += '<span class="star half-filled">★</span>';
        } else {
            stars += '<span class="star empty">★</span>';
        }
    }
    
    return stars;
}

// Create teacher card with all ratings and quick rate button
function createTeacherCard(teacherKey) {
    const stats = teacherStats[teacherKey];
    const averageRating = (stats.totalStars / stats.totalRatings).toFixed(1);
    
    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.dataset.department = stats.department;
    card.dataset.teacherName = stats.teacherName.toLowerCase();
    card.dataset.averageRating = averageRating;
    
    // Sort ratings by timestamp (newest first)
    const sortedRatings = [...stats.ratings].sort((a, b) => b.timestamp - a.timestamp);
    
    // Create individual rating cards
    const ratingCards = sortedRatings.map(rating => {
        const hasMarked = hasMarkedHelpful(rating.id);
        const helpfulClass = hasMarked ? 'marked-helpful' : '';
        const helpfulStyle = hasMarked ? 'color: #10b981; cursor: not-allowed;' : '';
        
        return `
            <div class="individual-rating">
                <div class="rating-header">
                    <div class="stars-display">${createStarDisplay(rating.stars)}</div>
                    <span class="rating-date">${formatDate(rating.timestamp)}</span>
                </div>
                <p class="rating-review">${escapeHtml(rating.review)}</p>
                <div class="rating-footer">
                    <button class="helpful-btn ${helpfulClass}" data-id="${rating.id}" ${hasMarked ? 'disabled' : ''} style="${helpfulStyle}">
                        👍 Helpful (<span class="helpful-count">${rating.helpful || 0}</span>)
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    card.innerHTML = `
        <div class="teacher-header">
            <div class="teacher-info">
                <h3 class="teacher-name">${escapeHtml(stats.teacherName)}</h3>
                <span class="teacher-department">${escapeHtml(stats.department)}</span>
            </div>
            <div class="teacher-rating">
                <div class="average-rating">${averageRating}</div>
                <div class="stars-display">${createStarDisplay(null, parseFloat(averageRating))}</div>
                <div class="rating-count">${stats.totalRatings} review${stats.totalRatings > 1 ? 's' : ''}</div>
                <a href="rate-teacher.html?teacher=${encodeURIComponent(stats.teacherName)}&dept=${encodeURIComponent(stats.department)}" class="btn btn-primary" style="margin-top: 12px; padding: 8px 16px; font-size: 0.9rem; text-decoration: none;">
                    ⭐ Rate This Teacher
                </a>
            </div>
        </div>
        <div class="ratings-list">
            ${ratingCards}
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

// Display ratings
function displayRatings(ratingsToShow) {
    ratingsContainer.innerHTML = '';
    
    if (ratingsToShow.length === 0) {
        loadingDiv.classList.add('hidden');
        noRatingsDiv.classList.remove('hidden');
        return;
    }
    
    loadingDiv.classList.add('hidden');
    noRatingsDiv.classList.add('hidden');
    
    // Calculate stats for filtered ratings
    const filteredStats = calculateTeacherStats(ratingsToShow);
    
    // Sort teachers by average rating (highest first)
    const sortedTeachers = Object.keys(filteredStats).sort((a, b) => {
        const avgA = filteredStats[a].totalStars / filteredStats[a].totalRatings;
        const avgB = filteredStats[b].totalStars / filteredStats[b].totalRatings;
        return avgB - avgA;
    });
    
    // Create and append cards
    sortedTeachers.forEach(teacherKey => {
        teacherStats[teacherKey] = filteredStats[teacherKey];
        const card = createTeacherCard(teacherKey);
        ratingsContainer.appendChild(card);
    });
    
    // Add helpful button listeners
    document.querySelectorAll('.helpful-btn').forEach(btn => {
        btn.addEventListener('click', handleHelpful);
    });
}

// Handle helpful button click
async function handleHelpful(e) {
    const btn = e.currentTarget;
    const ratingId = btn.dataset.id;
    const helpfulCountSpan = btn.querySelector('.helpful-count');
    
    // Check if already marked
    if (hasMarkedHelpful(ratingId)) {
        return;
    }
    
    try {
        // Disable button immediately
        btn.disabled = true;
        
        const ratingRef = ref(database, `teacher-ratings/${ratingId}`);
        const snapshot = await get(ratingRef);
        
        if (snapshot.exists()) {
            const currentHelpful = snapshot.val().helpful || 0;
            await update(ratingRef, {
                helpful: currentHelpful + 1
            });
            
            // Update UI
            helpfulCountSpan.textContent = currentHelpful + 1;
            btn.style.color = '#10b981';
            btn.style.cursor = 'not-allowed';
            btn.classList.add('marked-helpful');
            
            // Save to localStorage
            addHelpfulRating(ratingId);
        }
    } catch (error) {
        console.error('Error marking as helpful:', error);
        btn.disabled = false;
    }
}

// Filter ratings
function filterRatings() {
    const department = departmentFilter.value;
    const searchTerm = searchInput.value.toLowerCase().trim();
    const minStars = starsFilter.value;
    
    let filtered = allRatings;
    
    // Filter by department
    if (department !== 'all') {
        filtered = filtered.filter(r => r.department === department);
    }
    
    // Filter by teacher name
    if (searchTerm) {
        filtered = filtered.filter(r => 
            r.teacherName.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by minimum star rating
    if (minStars !== 'all') {
        const minStarsNum = parseInt(minStars);
        filtered = filtered.filter(r => r.stars >= minStarsNum);
    }
    
    displayRatings(filtered);
}

// Event listeners
departmentFilter.addEventListener('change', filterRatings);
searchInput.addEventListener('input', filterRatings);
starsFilter.addEventListener('change', filterRatings);

// Load ratings from Firebase
const ratingsRef = ref(database, 'teacher-ratings');
onValue(ratingsRef, (snapshot) => {
    const data = snapshot.val();
    
    if (!data) {
        allRatings = [];
        displayRatings([]);
        return;
    }
    
    // Convert object to array and sort by timestamp (newest first)
    allRatings = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
    
    // Display all ratings initially
    filterRatings();
});
