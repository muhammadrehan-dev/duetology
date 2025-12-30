import { database } from './firebase-config.js';
import { ref, push, set, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Get form elements
const form = document.getElementById('confessionForm');
const confessionInput = document.getElementById('confession');
const categoryInput = document.getElementById('category');
const charCount = document.getElementById('charCount');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');

// Character counter
confessionInput.addEventListener('input', () => {
    const count = confessionInput.value.length;
    charCount.textContent = count;
    
    if (count > 900) {
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
    
    const confessionText = confessionInput.value.trim();
    const category = categoryInput.value;
    
    if (!confessionText) {
        showMessage('Please write your confession', 'error');
        return;
    }
    
    if (confessionText.length < 10) {
        showMessage('Confession must be at least 10 characters', 'error');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        // Create a reference to the confessions collection
        const confessionsRef = ref(database, 'confessions');
        
        // Create a new confession with a unique ID
        const newConfessionRef = push(confessionsRef);
        
        // Confession data
        const confessionData = {
            id: newConfessionRef.key,
            text: confessionText,
            category: category,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            likes: 0,
            approved: true
        };
        
        // Save to Firebase
        await set(newConfessionRef, confessionData);
        
        // Success
        showMessage('Confession submitted successfully! 🎉', 'success');
        form.reset();
        charCount.textContent = '0';
        
        // Redirect to view page after 2 seconds
        setTimeout(() => {
            window.location.href = 'view.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting confession:', error);
        showMessage('Failed to submit confession. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Confession';
    }
});