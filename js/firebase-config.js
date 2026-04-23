import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⬇️⬇️⬇️ REPLACE WITH YOUR ACTUAL CONFIG FROM FIREBASE ⬇️⬇️⬇️
const firebaseConfig = {
    apiKey: "AIzaSyAYs4AbrHJRLaGqCG7-BpJmrB99uajRYtM",
    authDomain: "teacher-student-portal-b1fed.firebaseapp.com",
    projectId: "teacher-student-portal-b1fed",
    storageBucket: "teacher-student-portal-b1fed.firebasestorage.app",
    messagingSenderId: "553128972767",
    appId: "1:553128972767:web:96a77d5907c054bcb2746a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);