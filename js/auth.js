import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentRole = 'student';

window.selectRole = (role) => {
    currentRole = role;
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('roleTitle').textContent = role === 'teacher' ? 'Teacher Login' : 'Student Login';
    document.getElementById('regRole').textContent = role.charAt(0).toUpperCase() + role.slice(1);
};

window.toggleRegister = () => {
    document.querySelector('.login-box').style.display = 
        document.querySelector('.login-box').style.display === 'none' ? 'block' : 'none';
    document.querySelector('.register-box').style.display = 
        document.querySelector('.register-box').style.display === 'none' ? 'block' : 'none';
};

window.register = async () => {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
            name, email, role: currentRole, createdAt: new Date()
        });
        alert('Registered! Please login.');
        toggleRegister();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.login = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
        const role = userDoc.data().role;
        window.location.href = role === 'teacher' ? 'teacher.html' : 'student.html';
    } catch (e) {
        alert('Login failed: ' + e.message);
    }
};

window.logout = async () => {
    await signOut(auth);
    window.location.href = 'index.html';
};

onAuthStateChanged(auth, async (user) => {
    if (!user && !window.location.href.includes('index.html')) {
        window.location.href = 'index.html';
    }
});