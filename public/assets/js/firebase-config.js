// Import Firebase modules from CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAXcj6QoshaW5EkQ5leDI6V19YBvurSJXk",
    authDomain: "duet-e2e-chat.firebaseapp.com",
    databaseURL: "https://duet-e2e-chat-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "duet-e2e-chat",
    storageBucket: "duet-e2e-chat.firebasestorage.app",
    messagingSenderId: "239054230046",
    appId: "1:239054230046:web:74715ed3a3cd7a32c8d40f",
    measurementId: "G-J159XQD28T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Export for use in other files
export { database };