import { auth, db } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentTeacher = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentTeacher = user;
        loadMySessions();
    }
});

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

window.createSession = async () => {
    const type = document.getElementById('sessionType').value;
    const title = document.getElementById('sessionTitle').value;
    const desc = document.getElementById('sessionDesc').value;
    const timeLimit = parseInt(document.getElementById('timeLimit').value) || 0;
    
    const code = generateCode();
    
    try {
        await addDoc(collection(db, 'sessions'), {
            code, type, title, description: desc, timeLimit,
            teacherId: currentTeacher.uid,
            teacherEmail: currentTeacher.email,
            createdAt: new Date(),
            status: 'active'
        });
        
        document.getElementById('generatedCode').innerHTML = 
            `<h4>✅ Created! Code: <span class="highlight">${code}</span></h4>
             <p>Share this code with students</p>`;
        
        document.getElementById('questionSection').style.display = 'block';
        document.getElementById('qSessionCode').value = code;
        loadMySessions();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

document.getElementById('questionType').addEventListener('change', (e) => {
    document.getElementById('mcqOptions').style.display = 
        e.target.value === 'mcq' ? 'block' : 'none';
});

window.addQuestion = async () => {
    const code = document.getElementById('qSessionCode').value;
    const type = document.getElementById('questionType').value;
    const text = document.getElementById('questionText').value;
    
    let questionData = { sessionCode: code, type, text, createdAt: new Date() };
    
    if (type === 'mcq') {
        questionData.options = {
            A: document.getElementById('optA').value,
            B: document.getElementById('optB').value,
            C: document.getElementById('optC').value,
            D: document.getElementById('optD').value
        };
        questionData.correctAnswer = document.getElementById('correctOpt').value;
    }
    
    try {
        await addDoc(collection(db, 'questions'), questionData);
        alert('Question added!');
        document.getElementById('questionText').value = '';
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.loadSubmissions = async () => {
    const code = document.getElementById('evalCode').value.toUpperCase();
    const q = query(collection(db, 'submissions'), where('sessionCode', '==', code));
    const snapshot = await getDocs(q);
    
    let html = '';
    snapshot.forEach(doc => {
        const data = doc.data();
        html += `
            <div class="submission-card">
                <p><strong>Student:</strong> ${data.studentEmail}</p>
                <p><strong>Submitted:</strong> ${data.submittedAt?.toDate().toLocaleString()}</p>
                <div class="answers">${formatAnswers(data.answers)}</div>
                <div class="grading">
                    <input type="number" id="score-${doc.id}" placeholder="Score" value="${data.score || ''}">
                    <input type="text" id="feedback-${doc.id}" placeholder="Feedback" value="${data.feedback || ''}">
                    <button onclick="gradeSubmission('${doc.id}')" class="btn-small">Save Grade</button>
                </div>
            </div>
        `;
    });
    
    document.getElementById('submissionsList').innerHTML = html || '<p>No submissions yet</p>';
};

const formatAnswers = (answers) => {
    if (!answers) return '<p>No answers</p>';
    
    return Object.entries(answers).map(([qid, ans]) => {
        if (ans.type === 'image') {
            if (ans.value.startsWith('data:image')) {
                return `
                    <div style="margin:10px 0;">
                        <p><strong>📷 Image Answer:</strong></p>
                        <img src="${ans.value}" style="max-width:300px; max-height:300px; border:2px solid #667eea; border-radius:8px; cursor:pointer;" 
                             onclick="window.open('${ans.value}')" title="Click to enlarge">
                    </div>`;
            }
        }
        if (ans.type === 'mcq') return `<p><strong>MCQ Answer:</strong> ${ans.value}</p>`;
        return `<p><strong>Written:</strong> ${ans.value}</p>`;
    }).join('');
};

window.gradeSubmission = async (subId) => {
    const score = document.getElementById(`score-${subId}`).value;
    const feedback = document.getElementById(`feedback-${subId}`).value;
    
    await updateDoc(doc(db, 'submissions', subId), { 
        score: Number(score), 
        feedback, 
        gradedAt: new Date() 
    });
    alert('Graded!');
};

const loadMySessions = async () => {
    const q = query(collection(db, 'sessions'), where('teacherId', '==', currentTeacher.uid));
    const snapshot = await getDocs(q);
    
    let html = '';
    snapshot.forEach(doc => {
        const d = doc.data();
        html += `<div class="session-item">
            <span class="badge ${d.type}">${d.type}</span>
            <strong>${d.title}</strong> - Code: <span style="color:#667eea;font-weight:bold;">${d.code}</span>
        </div>`;
    });
    document.getElementById('mySessions').innerHTML = html || '<p>No sessions yet</p>';
};