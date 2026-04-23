import { auth, db } from './firebase-config.js';
import { collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentStudent = null;
let currentSession = null;
let answers = {};
let timerInterval;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentStudent = user;
        loadMySubmissions();
    }
});

window.joinSession = async () => {
    const code = document.getElementById('joinCode').value.toUpperCase();
    
    const q = query(collection(db, 'sessions'), where('code', '==', code));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        alert('Invalid code!');
        return;
    }
    
    currentSession = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    
    const subQ = query(collection(db, 'submissions'), 
        where('sessionCode', '==', code),
        where('studentId', '==', currentStudent.uid));
    const subSnap = await getDocs(subQ);
    
    if (!subSnap.empty) {
        alert('You already submitted this session!');
        return;
    }
    
    document.getElementById('activeSession').style.display = 'block';
    document.getElementById('sessionTitle').textContent = `${currentSession.title} (${currentSession.type})`;
    
    if (currentSession.timeLimit > 0) {
        let timeLeft = currentSession.timeLimit * 60;
        timerInterval = setInterval(() => {
            timeLeft--;
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            document.getElementById('timer').textContent = `⏱️ ${mins}:${secs.toString().padStart(2,'0')}`;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                submitExam();
            }
        }, 1000);
    } else {
        document.getElementById('timer').textContent = '⏱️ No time limit';
    }
    
    loadQuestions(code);
};

const loadQuestions = async (code) => {
    const q = query(collection(db, 'questions'), where('sessionCode', '==', code));
    const snapshot = await getDocs(q);
    
    let html = '';
    let idx = 1;
    
    snapshot.forEach(doc => {
        const ques = doc.data();
        const qid = doc.id;
        
        html += `<div class="question-box">
            <p><strong>Q${idx}.</strong> ${ques.text}</p>`;
        
        if (ques.type === 'mcq') {
            html += `<div class="options">
                ${['A','B','C','D'].map(opt => `
                    <label><input type="radio" name="${qid}" value="${opt}" onchange="saveAnswer('${qid}', 'mcq', '${opt}')"> ${opt}. ${ques.options[opt]}</label>
                `).join('')}
            </div>`;
        } else if (ques.type === 'written') {
            html += `<textarea onblur="saveAnswer('${qid}', 'written', this.value)" placeholder="Write your answer here..."></textarea>`;
        } else if (ques.type === 'image') {
            html += `<input type="file" accept="image/*" onchange="uploadImage('${qid}', this)" class="file-input">
                     <p style="font-size:12px;color:#666;">Max 500KB recommended</p>
                     <div id="preview-${qid}"></div>`;
        }
        
        html += `</div>`;
        idx++;
    });
    
    document.getElementById('questionsList').innerHTML = html;
};

window.saveAnswer = (qid, type, value) => {
    answers[qid] = { type, value };
};

window.uploadImage = async (qid, input) => {
    const file = input.files[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
        alert('Image is large. Compressing...');
    }
    
    try {
        const compressedFile = await imageCompression(file, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1024,
            useWebWorker: true
        });
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64String = e.target.result;
            answers[qid] = { type: 'image', value: base64String };
            document.getElementById(`preview-${qid}`).innerHTML = 
                `<img src="${base64String}" style="max-width:200px; border:1px solid #ddd; border-radius:5px;">`;
        };
        reader.readAsDataURL(compressedFile);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error processing image. Try a smaller image.');
    }
};

window.submitExam = async () => {
    clearInterval(timerInterval);
    
    if (Object.keys(answers).length === 0) {
        if (!confirm('No answers saved. Submit anyway?')) return;
    }
    
    try {
        await addDoc(collection(db, 'submissions'), {
            sessionCode: currentSession.code,
            sessionId: currentSession.id,
            studentId: currentStudent.uid,
            studentEmail: currentStudent.email,
            answers,
            submittedAt: new Date(),
            score: null,
            feedback: null
        });
        
        alert('Submitted successfully!');
        document.getElementById('activeSession').style.display = 'none';
        document.getElementById('joinCode').value = '';
        loadMySubmissions();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

const loadMySubmissions = async () => {
    const q = query(collection(db, 'submissions'), where('studentId', '==', currentStudent.uid));
    const snapshot = await getDocs(q);
    
    let html = '';
    snapshot.forEach(doc => {
        const d = doc.data();
        html += `<div class="submission-item">
            <p><strong>Session:</strong> ${d.sessionCode}</p>
            <p><strong>Score:</strong> ${d.score !== null ? d.score : 'Not graded yet'}</p>
            <p>${d.feedback ? `<strong>Feedback:</strong> ${d.feedback}` : ''}</p>
        </div>`;
    });
    
    document.getElementById('mySubmissions').innerHTML = html || '<p>No submissions yet</p>';
};