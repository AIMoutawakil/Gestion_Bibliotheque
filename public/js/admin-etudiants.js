// public/js/admin-etudiants.js

let allStudents = [];
let allMessages = [];

document.addEventListener('DOMContentLoaded', () => {
    const userJson = sessionStorage.getItem('user');
    if (!userJson) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userJson);
    if (user.role !== 'ADMIN') {
        window.location.href = 'catalogue.html';
        return;
    }

    loadStudentsData();
    loadMessagesData();

    const searchStudent = document.getElementById('searchStudent');
    if(searchStudent) searchStudent.addEventListener('input', filterStudents);
    
    const searchMessage = document.getElementById('searchMessage');
    if(searchMessage) searchMessage.addEventListener('input', filterMessages);
});

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (tabName === 'students') {
        document.querySelector("button[onclick=\"switchTab('students')\"]").classList.add('active');
        document.getElementById('students-tab').classList.add('active');
    } else if (tabName === 'messages') {
        document.querySelector("button[onclick=\"switchTab('messages')\"]").classList.add('active');
        document.getElementById('messages-tab').classList.add('active');
    }
}

// 🚨 LE BOUCLIER ANTI-BUG : Gère les conflits de session automatiquement
function checkSecurity(response) {
    if (response.status === 401 || response.status === 403) {
        sessionStorage.clear(); // On nettoie le navigateur
        alert("🔒 Changement de compte détecté. Veuillez vous reconnecter en tant qu'Administrateur.");
        window.location.href = 'login.html';
        return Promise.reject("Session conflict"); // Bloque l'affichage des erreurs rouges
    }
    if (!response.ok) throw new Error("Erreur de chargement des données");
    return response.json();
}

function loadStudentsData() {
    const t = new Date().getTime();
    fetch(`index.php/api/admin/students?t=${t}`)
        .then(checkSecurity) // On passe par le bouclier
        .then(data => {
            if(data.erreur) throw new Error(data.erreur);
            allStudents = data;
            renderStudents(allStudents);
        })
        .catch(err => {
            if(err !== "Session conflict") {
                const tbody = document.getElementById('students-table-body');
                if(tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">Erreur : ${err.message}</td></tr>`;
            }
        });
}

function renderStudents(studentsList) {
    const tbody = document.getElementById('students-table-body');
    if(!tbody) return;
    tbody.innerHTML = '';

    if (studentsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:30px;">Aucun étudiant trouvé.</td></tr>`;
        return;
    }

    studentsList.forEach(student => {
        const totalHistorique = parseInt(student.total_historique || 0); 
        const totalActive = parseInt(student.active_borrowings || 0);
        const totalOverdue = parseInt(student.overdue_borrowings || 0);
        
        let statusHtml = '';
        if (totalOverdue > 0) {
            statusHtml = `<span class="status-badge en-retard">🔴 Bloqué (${totalOverdue} retard)</span>`;
        } else {
            statusHtml = `<span class="status-badge en-regle">🟢 En règle</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">👤 ${student.name || 'Inconnu'}</td>
            <td style="color: #475569;">${student.email || ''}</td>
            <td style="text-align: center; font-weight: bold; color: #10b981; font-size: 1.1rem;">${totalHistorique}</td>
            <td style="text-align: center; font-weight: 600; color: #4f46e5;">${totalActive} / 3</td>
            <td style="text-align: center; font-weight: 700; color: ${totalOverdue > 0 ? '#ef4444' : '#64748b'};">${totalOverdue}</td>
            <td>${statusHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterStudents() {
    const text = document.getElementById('searchStudent').value.toLowerCase();
    const filtered = allStudents.filter(s => 
        (s.name && s.name.toLowerCase().includes(text)) || 
        (s.email && s.email.toLowerCase().includes(text))
    );
    renderStudents(filtered);
}

function loadMessagesData() {
    const t = new Date().getTime();
    fetch(`index.php/api/admin/messages?t=${t}`)
        .then(checkSecurity) // On passe par le bouclier
        .then(data => {
            if(data.erreur) throw new Error(data.erreur);
            allMessages = data;
            const msgCount = document.getElementById('msg-count');
            if(msgCount) msgCount.textContent = allMessages.length;
            renderMessages(allMessages);
        })
        .catch(err => {
            if(err !== "Session conflict") {
                const container = document.getElementById('messages-container');
                if(container) container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Erreur : ${err.message}</div>`;
            }
        });
}

function renderMessages(messagesList) {
    const container = document.getElementById('messages-container');
    if(!container) return;
    container.innerHTML = '';

    if (messagesList.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #64748b; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;">Aucun message reçu.</div>`;
        return;
    }

    messagesList.forEach(msg => {
        const dateObj = new Date(msg.created_at);
        const dateStr = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });

        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
            <div class="message-header">
                <div class="student-info">
                    <h4>💬 ${msg.student_name || 'Inconnu'}</h4>
                    <span>${msg.student_email || ''}</span>
                </div>
                <div class="message-date">Le ${dateStr}</div>
            </div>
            <div class="message-body">${msg.message}</div>
        `;
        container.appendChild(card);
    });
}

function filterMessages() {
    const text = document.getElementById('searchMessage').value.toLowerCase();
    const filtered = allMessages.filter(m => 
        (m.student_name && m.student_name.toLowerCase().includes(text)) || 
        (m.message && m.message.toLowerCase().includes(text)) ||
        (m.student_email && m.student_email.toLowerCase().includes(text))
    );
    renderMessages(filtered);
}