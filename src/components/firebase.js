// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-OllvirI-TFULNVZs5IwiPqTP1OuDTGM",
  authDomain: "todo-list-app-38312.firebaseapp.com",
  projectId: "todo-list-app-38312",
  storageBucket: "todo-list-app-38312.firebasestorage.app",
  messagingSenderId: "349988396386",
  appId: "1:349988396386:web:b1b93d2457f31c33be603b",
  measurementId: "G-8LWJN3XCX0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;