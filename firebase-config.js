// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyDB-o6KXhBm3UHJ69BVmDsIWza4kCeo04Y",
  authDomain: "brynerobgeneral.firebaseapp.com",
  databaseURL: "https://brynerobgeneral-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "brynerobgeneral",
  storageBucket: "brynerobgeneral.firebasestorage.app",
  messagingSenderId: "259011665639",
  appId: "1:259011665639:web:593b409ff778f0d19e0c42"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
window.database = firebase.database();

console.log('Firebase initialized successfully!');