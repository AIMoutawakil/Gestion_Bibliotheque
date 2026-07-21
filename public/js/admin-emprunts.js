let allBorrowings = [];

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

    fetchBorrowings();

    const searchInput = document.getElementById('searchBorrowInput');
    const filterStatus = document.getElementById('filterStatusInput');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterStatus) filterStatus.addEventListener('change', applyFilters);
});

function checkSecurity(response) {
    if (response.status === 401 || response.status === 403) {
        sessionStorage.clear();
        alert("🔒 Changement de compte détecté. Veuillez vous reconnecter en tant qu'Administrateur.");
        window.location.href = 'login.html';
        return Promise.reject("Session conflict");
    }
    if (!response.ok) throw new Error("Erreur lors de la récupération des données");
    return response.json();
}

function fetchBorrowings() {
    const t = new Date().getTime();
    fetch(`index.php/api/admin/borrowings?t=${t}`)
        .then(checkSecurity) // On passe par le bouclier
        .then(data => {
            if (data.erreur) throw new Error(data.erreur);
            allBorrowings = data;
            applyFilters(); 
        })
        .catch(error => {
            if(error !== "Session conflict") {
                const tbody = document.getElementById('borrowings-table-body');
                if(tbody) {
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red; padding: 20px;">Erreur : ${error.message}</td></tr>`;
                }
            }
        });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchBorrowInput') ? document.getElementById('searchBorrowInput').value.toLowerCase() : '';
    const statusFilter = document.getElementById('filterStatusInput') ? document.getElementById('filterStatusInput').value : 'ALL';

    const filteredBorrowings = allBorrowings.filter(b => {
        const userName = (b.student_name || b.user_name || '').toLowerCase();
        const userEmail = (b.student_email || b.user_email || '').toLowerCase();
        const bookTitle = (b.book_title || '').toLowerCase();
        
        const matchesSearch = userName.includes(searchTerm) || userEmail.includes(searchTerm) || bookTitle.includes(searchTerm);

        let realStatus = b.status; 
        if (realStatus === 'EN_COURS') {
            const today = new Date();
            today.setHours(0,0,0,0);
            const dueDate = new Date(b.due_date);
            if (today > dueDate) {
                realStatus = 'EN_RETARD';
            }
        }

        const matchesStatus = (statusFilter === 'ALL') || (realStatus === statusFilter);

        return matchesSearch && matchesStatus;
    });

    renderTable(filteredBorrowings);
}

function renderTable(borrowingsToDisplay) {
    const tbody = document.getElementById('borrowings-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (borrowingsToDisplay.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 30px;">Aucun emprunt ne correspond à votre recherche.</td></tr>`;
        return;
    }

    borrowingsToDisplay.forEach(b => {
        const borrowDate = new Date(b.borrow_date).toLocaleDateString('fr-FR');
        const dueDateObj = new Date(b.due_date);
        const dueDate = dueDateObj.toLocaleDateString('fr-FR');
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        let realStatus = b.status; 
        let badgeHtml = '';
        let actionHtml = '';
        let delayText = '';

        if (realStatus === 'RETOURNE') {
            badgeHtml = `<span class="badge-status badge-retourne">🟢 Retourné</span>`;
            actionHtml = `<span style="color: #64748b; font-size: 0.9rem; font-style: italic;">Rendu le ${new Date(b.return_date).toLocaleDateString('fr-FR')}</span>`;
        } 
        else {
            const timeDiff = dueDateObj.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); 

            if (daysDiff < 0) {
                realStatus = 'EN_RETARD';
                const retardJours = Math.abs(daysDiff);
                badgeHtml = `<span class="badge-status badge-retard">🔴 En retard</span>`;
                delayText = `<br><span style="color: #ef4444; font-size: 0.8rem; font-weight: bold;">(Retard : ${retardJours} jour${retardJours > 1 ? 's' : ''})</span>`;
            } else if (daysDiff === 0) {
                badgeHtml = `<span class="badge-status badge-encours" style="background: #fef08a; color: #854d0e;">⚠️ Dernier jour</span>`;
            } else {
                badgeHtml = `<span class="badge-status badge-encours">🔵 En cours</span>`;
                delayText = `<br><span style="color: #64748b; font-size: 0.8rem;">(Reste ${daysDiff} jour${daysDiff > 1 ? 's' : ''})</span>`;
            }

            actionHtml = `<button onclick="validerRetour(${b.id})" style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: 0.2s;">✅ Valider le retour</button>`;
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #f1f5f9";
        
        tr.innerHTML = `
            <td style="padding: 15px 20px;">
                <div style="font-weight: 600; color: #1e293b;">${b.student_name || b.user_name || 'Utilisateur inconnu'}</div>
                <div style="font-size: 0.85rem; color: #64748b;">${b.student_email || b.user_email || ''}</div>
            </td>
            <td style="padding: 15px 20px; font-weight: 500;">
                ${b.book_title || 'Livre inconnu'}
            </td>
            <td style="padding: 15px 20px; color: #475569;">
                ${borrowDate}
            </td>
            <td style="padding: 15px 20px; color: #475569;">
                ${dueDate} ${delayText}
            </td>
            <td style="padding: 15px 20px;">
                ${badgeHtml}
            </td>
            <td style="padding: 15px 20px; text-align: center;">
                ${actionHtml}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function validerRetour(borrowingId) {
    if (!confirm("Confirmez-vous que l'étudiant a bien rendu ce livre ?\nLe stock sera automatiquement mis à jour.")) {
        return;
    }

    fetch(`index.php/api/admin/borrowings/${borrowingId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.erreur || "Erreur lors de la restitution.");
        return data;
    })
    .then(data => {
        alert("✅ " + data.message);
        fetchBorrowings();
    })
    .catch(error => {
        alert("❌ Erreur : " + error.message);
    });
}
