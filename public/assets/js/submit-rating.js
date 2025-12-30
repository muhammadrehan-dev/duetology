import { database } from './firebase-config.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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