import { database } from './firebase-config.js';
import { ref, push, set, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Get form elements
const form = document.getElementById('ratingForm');
const teacherNameInput = document.getElementById('teacherName');
const departmentInput = document.getElementById('department');
const reviewInput = document.getElementById('review');
const charCount = document.getElementById('charCount');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');
const ratingValue = document.getElementById('ratingValue');
const ratingText = document.getElementById('ratingText');
const teacherSuggestions = document.getElementById('teacherSuggestions');
const quickSelectGrid = document.getElementById('quickSelectGrid');
const existingTeachersSection = document.getElementById('existingTeachersSection');

let allRatings = [];
let teachersList = [];

// Star rating functionality
const stars = document.querySelectorAll('.star');
let selectedRating = 0;

stars.forEach(star => {
    // Hover effect
    star.addEventListener('mouseenter', () => {
        const rating = parseInt(star.dataset.rating);
        highlightStars(rating);
    });

    // Click to select
    star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.rating);
        ratingValue.value = selectedRating;
        highlightStars(selectedRating);
        updateRatingText(selectedRating);
    });
});

// Reset stars on mouse leave
document.getElementById('starRating').addEventListener('mouseleave', () => {
    highlightStars(selectedRating);
});

function highlightStars(rating) {
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateRatingText(rating) {
    const texts = {
        1: '⭐ Poor',
        2: '⭐⭐ Fair',
        3: '⭐⭐⭐ Good',
        4: '⭐⭐⭐⭐ Very Good',
        5: '⭐⭐⭐⭐⭐ Excellent'
    };
    ratingText.textContent = texts[rating] || 'Click to rate';
}

// Character counter
reviewInput.addEventListener('input', () => {
    const count = reviewInput.value.length;
    charCount.textContent = count;
    
    if (count > 1400) {
        charCount.style.color = '#ef4444';
    } else {
        charCount.style.color = '#94a3b8';
    }
});

// Show message
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

// Calculate teacher statistics
function calculateTeacherStats() {
    const stats = {};
    
    allRatings.forEach(rating => {
        const key = `${rating.teacherName}_${rating.department}`;
        
        if (!stats[key]) {
            stats[key] = {
                teacherName: rating.teacherName,
                department: rating.department,
                totalRatings: 0,
                totalStars: 0
            };
        }
        
        stats[key].totalRatings++;
        stats[key].totalStars += rating.stars;
    });
    
    // Convert to array
    teachersList = Object.values(stats).map(stat => ({
        ...stat,
        averageRating: (stat.totalStars / stat.totalRatings).toFixed(1)
    }));
    
    // Sort by average rating (highest first)
    teachersList.sort((a, b) => b.averageRating - a.averageRating);
}

// Display quick select teachers
function displayQuickSelect() {
    if (teachersList.length === 0) {
        existingTeachersSection.style.display = 'none';
        return;
    }
    
    existingTeachersSection.style.display = 'block';
    quickSelectGrid.innerHTML = '';
    
    teachersList.forEach(teacher => {
        const card = document.createElement('div');
        card.className = 'teacher-quick-select';
        card.innerHTML = `
            <span class="quick-select-name">${escapeHtml(teacher.teacherName)}</span>
            <div class="quick-select-info">
                <span class="quick-select-dept">${escapeHtml(teacher.department)}</span>
                <span class="quick-select-rating">⭐ ${teacher.averageRating}</span>
            </div>
        `;
        
        card.addEventListener('click', () => {
            selectTeacher(teacher.teacherName, teacher.department);
        });
        
        quickSelectGrid.appendChild(card);
    });
}

// Select teacher from quick select
function selectTeacher(name, dept) {
    teacherNameInput.value = name;
    departmentInput.value = dept;
    
    // Visual feedback
    document.querySelectorAll('.teacher-quick-select').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Focus on rating
    document.getElementById('starRating').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Autocomplete suggestions
teacherNameInput.addEventListener('input', () => {
    const searchTerm = teacherNameInput.value.trim().toLowerCase();
    
    if (searchTerm.length < 2) {
        teacherSuggestions.classList.remove('show');
        return;
    }
    
    const matches = teachersList.filter(teacher => 
        teacher.teacherName.toLowerCase().includes(searchTerm)
    );
    
    if (matches.length === 0) {
        teacherSuggestions.innerHTML = '<div class="no-suggestions">No matching teachers. Enter a new name.</div>';
        teacherSuggestions.classList.add('show');
        return;
    }
    
    teacherSuggestions.innerHTML = matches.map(teacher => `
        <div class="suggestion-item" data-name="${escapeHtml(teacher.teacherName)}" data-dept="${escapeHtml(teacher.department)}">
            <span class="suggestion-name">${escapeHtml(teacher.teacherName)}</span>
            <div class="suggestion-dept">
                <span>${escapeHtml(teacher.department)}</span>
                <span class="suggestion-rating">⭐ ${teacher.averageRating} (${teacher.totalRatings} reviews)</span>
            </div>
        </div>
    `).join('');
    
    teacherSuggestions.classList.add('show');
    
    // Add click listeners to suggestions
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.name;
            const dept = item.dataset.dept;
            teacherNameInput.value = name;
            departmentInput.value = dept;
            teacherSuggestions.classList.remove('show');
        });
    });
});

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!teacherNameInput.contains(e.target) && !teacherSuggestions.contains(e.target)) {
        teacherSuggestions.classList.remove('show');
    }
});

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check for URL parameters (from "Rate this teacher" button)
function checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    const teacher = params.get('teacher');
    const dept = params.get('dept');
    
    if (teacher && dept) {
        teacherNameInput.value = decodeURIComponent(teacher);
        departmentInput.value = decodeURIComponent(dept);
        
        // Scroll to form
        setTimeout(() => {
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
    }
}

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const teacherName = teacherNameInput.value.trim();
    const department = departmentInput.value;
    const rating = parseInt(ratingValue.value);
    const review = reviewInput.value.trim();
    
    // Validation
    if (!teacherName) {
        showMessage('Please enter teacher name', 'error');
        return;
    }
    
    if (!department) {
        showMessage('Please select a department', 'error');
        return;
    }
    
    if (!rating || rating < 1 || rating > 5) {
        showMessage('Please select a star rating', 'error');
        return;
    }
    
    if (!review) {
        showMessage('Please write a review', 'error');
        return;
    }
    
    if (review.length < 20) {
        showMessage('Review must be at least 20 characters', 'error');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        // Create a reference to the ratings collection
        const ratingsRef = ref(database, 'teacher-ratings');
        
        // Create a new rating with a unique ID
        const newRatingRef = push(ratingsRef);
        
        // Rating data
        const ratingData = {
            id: newRatingRef.key,
            teacherName: teacherName,
            department: department,
            stars: rating,
            review: review,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            approved: true,
            helpful: 0
        };
        
        // Save to Firebase
        await set(newRatingRef, ratingData);
        
        // Success
        showMessage('Rating submitted successfully! 🎉', 'success');
        form.reset();
        charCount.textContent = '0';
        selectedRating = 0;
        highlightStars(0);
        ratingText.textContent = 'Click to rate';
        
        // Redirect to view ratings after 2 seconds
        setTimeout(() => {
            window.location.href = 'view-ratings.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting rating:', error);
        showMessage('Failed to submit rating. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Rating';
    }
});

// Load existing ratings for autocomplete
const ratingsRef = ref(database, 'teacher-ratings');
onValue(ratingsRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
        allRatings = Object.values(data);
        calculateTeacherStats();
        displayQuickSelect();
    }
});

// Check URL params on page load
checkURLParams();
