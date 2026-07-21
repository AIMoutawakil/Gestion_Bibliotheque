document.addEventListener('DOMContentLoaded', () => {

    const userJson = sessionStorage.getItem('user');
    if (!userJson) { 
        window.location.href = 'login.html'; 
        return; 
    }
    
    const user = JSON.parse(userJson);
    if (user.role !== 'ADMIN') {
        alert("Accès refusé !");
        window.location.href = 'catalogue.html';
        return;
    }

    chargerStatistiques();
});

function chargerStatistiques() {

    Promise.all([
        fetch('index.php/api/books').then(res => res.json()),
        fetch('index.php/api/admin/students').then(res => res.json()),
        fetch('index.php/api/admin/borrowings').then(res => {

            if(!res.ok) return []; 
            return res.json();
        }).catch(() => []) 
    ])
    .then(([books, students, borrowings]) => {
        
        let totalBooks = 0;
        if (Array.isArray(books)) {
            totalBooks = books.reduce((sum, book) => sum + parseInt(book.totalQuantity || book.total_quantity || 0), 0);
        }
        document.getElementById('kpi-total-books').textContent = totalBooks;

        let totalStudents = 0;
        let activeBorrowings = 0;
        let overdueBorrowings = 0;
        let alertesHTML = "";

        if (Array.isArray(students)) {
            totalStudents = students.length;

            students.forEach(student => {
                const encours = parseInt(student.active_borrowings || 0);
                const retards = parseInt(student.overdue_borrowings || 0);

                activeBorrowings += encours;
                overdueBorrowings += retards;

                if (retards > 0) {
                    alertesHTML += `
                        <div class="alert-item">
                            <span class="alert-text">⚠️ ${student.name} a des retards</span>
                            <span class="alert-badge">${retards} livre(s)</span>
                        </div>
                    `;
                }
                
                if (encours >= 3) {
                    alertesHTML += `
                        <div class="warning-item">
                            <span class="warning-text">🛑 ${student.name} a atteint le quota</span>
                            <span class="alert-badge" style="background: #f59e0b;">3 livres</span>
                        </div>
                    `;
                }
            });
        }

        document.getElementById('kpi-total-students').textContent = totalStudents;
        document.getElementById('kpi-active-borrowings').textContent = activeBorrowings;
        document.getElementById('kpi-overdue-borrowings').textContent = overdueBorrowings;

        const alertsContainer = document.getElementById('alerts-container');
        if (alertesHTML === "") {
            alertsContainer.innerHTML = `<p style="color: #10b981; text-align: center; font-weight: 500; padding: 20px;">✅ Tout est en ordre ! Aucun retard et aucun dépassement de quota.</p>`;
        } else {
            alertsContainer.innerHTML = alertesHTML;
        }

        const tbody = document.getElementById('recent-borrowings-body');
        
        if (Array.isArray(borrowings) && borrowings.length > 0) {
            tbody.innerHTML = '';
            
            // On ne prend que les 5 plus récents
            const recent = borrowings.slice(0, 5);
            
            recent.forEach(b => {
                const isOverdue = b.status === 'EN_COURS' && new Date(b.due_date) < new Date();
                let statusBadge = '';
                
                if (b.status === 'RETOURNÉ') {
                    statusBadge = '<span style="background: #d1fae5; color: #065f46; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">Retourné</span>';
                } else if (isOverdue) {
                    statusBadge = '<span style="background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">En retard</span>';
                } else {
                    statusBadge = '<span style="background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">En cours</span>';
                }

                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 12px 10px;">${b.user_name || 'Étudiant'}</td>
                        <td style="padding: 12px 10px;">${b.book_title || 'Livre'}</td>
                        <td style="padding: 12px 10px;">${b.borrow_date ? new Date(b.borrow_date).toLocaleDateString('fr-FR') : '-'}</td>
                        <td style="padding: 12px 10px;">${statusBadge}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 20px; color: #64748b;">Aucun emprunt récent trouvé.</td></tr>';
        }

    })
    .catch(err => {
        console.error("Erreur lors du chargement du dashboard :", err);
        document.getElementById('recent-borrowings-body').innerHTML = '<tr><td colspan="4" class="text-center text-danger">Erreur de connexion au serveur.</td></tr>';
    });
}
