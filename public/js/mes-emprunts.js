// public/js/mes-emprunts.js

let myBorrowings = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Vérification de la connexion
    const userJson = sessionStorage.getItem('user');
    if (!userJson) {
        alert("Veuillez vous connecter pour voir vos emprunts.");
        window.location.href = 'login.html';
        return;
    }

    // 2. Charger les emprunts
    fetchMyBorrowings();

    // 3. Activer la barre de recherche
    const searchInput = document.getElementById('searchMyBooks');
    if (searchInput) {
        searchInput.addEventListener('input', applySearch);
    }
});

function fetchMyBorrowings() {
    const timestamp = new Date().getTime();
    fetch(`index.php/api/my-borrowings?t=${timestamp}`)
        .then(response => {
            if (!response.ok) throw new Error("Erreur serveur");
            return response.json();
        })
        .then(data => {
            if (data.erreur) throw new Error(data.erreur);
            myBorrowings = data;
            applySearch(); 
        })
        .catch(error => {
            document.getElementById('my-borrowings-list').innerHTML = 
                `<div style="text-align: center; color: red; padding: 20px;">Erreur : ${error.message}</div>`;
        });
}

function applySearch() {
    const searchTerm = document.getElementById('searchMyBooks').value.toLowerCase();
    
    const filteredBorrowings = myBorrowings.filter(b => {
        // 💡 CORRECTION : On cherche "title" ou "book_title"
        const title = (b.title || b.book_title || '').toLowerCase();
        const author = (b.author || '').toLowerCase();
        return title.includes(searchTerm) || author.includes(searchTerm);
    });

    renderBorrowings(filteredBorrowings);
}

function renderBorrowings(borrowingsToDisplay) {
    const container = document.getElementById('my-borrowings-list');
    if (!container) return;

    container.innerHTML = '';

    if (borrowingsToDisplay.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #64748b; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;">Vous n'avez aucun emprunt correspondant.</div>`;
        return;
    }

    borrowingsToDisplay.forEach(b => {
        const imageUrl = b.image_url || b.imageUrl || 'https://placehold.co/400x600/eeeeee/31343C?text=Livre';
        
        // 💡 CORRECTION : Gestion propre du titre
        const finalTitle = b.title || b.book_title || 'Livre inconnu';

        // Gestion des dates
        const borrowDate = new Date(b.borrow_date).toLocaleDateString('fr-FR');
        const dueDateObj = new Date(b.due_date);
        const dueDateStr = dueDateObj.toLocaleDateString('fr-FR');
        
        // Calcul des jours restants
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const timeDiff = dueDateObj.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); 

        let cardStyle = '';
        let badgeHtml = '';
        let datesHtml = `<p style="margin-bottom: 5px; color: #64748b; font-size: 0.9rem;">Emprunté le : <strong style="color: #475569;">${borrowDate}</strong></p>`;

        // Application du code couleur et des dates
        if (b.status === 'RETOURNE') {
            cardStyle = 'border-left-color: #cbd5e1; opacity: 0.7;'; 
            
            // 💡 CORRECTION : On vérifie que la date de retour existe pour éviter "Invalid Date"
            const returnDate = b.return_date ? new Date(b.return_date).toLocaleDateString('fr-FR') : 'Inconnue';
            
            datesHtml += `<p style="margin-bottom: 15px; color: #64748b; font-size: 0.9rem;">Rendu le : <strong style="color: #475569;">${returnDate}</strong></p>`;
            badgeHtml = `<span class="badge-texte" style="background: #f1f5f9; color: #475569;">✅ Restitué</span>`;
        } 
        else {
            datesHtml += `<p style="margin-bottom: 15px; color: #64748b; font-size: 0.9rem;">À rendre max le : <strong style="color: #1e293b;">${dueDateStr}</strong></p>`;

            if (daysDiff < 0) {
                cardStyle = 'status-rouge';
                badgeHtml = `<span class="badge-texte badge-rouge">⚠️ En retard de ${Math.abs(daysDiff)} jour(s)</span>`;
            } 
            else if (daysDiff <= 3) {
                cardStyle = 'status-jaune';
                badgeHtml = `<span class="badge-texte badge-jaune">⏳ À rendre dans ${daysDiff} jour(s)</span>`;
            } 
            else {
                cardStyle = 'status-vert';
                badgeHtml = `<span class="badge-texte badge-vert">✅ Il reste ${daysDiff} jours</span>`;
            }
        }

        const cardHtml = `
            <div class="emprunt-card ${cardStyle}">
                <img src="${imageUrl}" alt="Couverture">
                <div class="emprunt-info">
                    <h3>${finalTitle}</h3>
                    ${datesHtml}
                    ${badgeHtml}
                </div>
            </div>
        `;
        
        container.innerHTML += cardHtml;
    });
}