// public/js/mes-emprunts.js

document.addEventListener('DOMContentLoaded', () => {
    // Sécurité Frontend : vérifier si on a les infos de session
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    fetchMyBorrowings();
});

function fetchMyBorrowings() {
    // 💣 L'ASTUCE ANTI-CACHE
    const timestamp = new Date().getTime();
    const url = `index.php/api/my-borrowings?t=${timestamp}`;

    fetch(url, { cache: 'no-store' })
        .then(response => {
            if (response.status === 401) {
                // Si le serveur PHP dit qu'on n'est pas connecté (ex: session expirée dans un autre navigateur)
                sessionStorage.clear();
                window.location.href = 'login.html';
                throw new Error('Session expirée');
            }
            if (!response.ok) throw new Error('Erreur lors de la récupération des données');
            
            return response.json();
        })
        .then(borrowings => {
            displayBorrowings(borrowings);
        })
        .catch(error => {
            // CORRECTION : On utilise le bon ID 'my-borrowings-container' pour afficher l'erreur
            const container = document.getElementById('my-borrowings-container');
            if (container) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1; color: red;">
                        Erreur : impossible de charger l'historique (${error.message}).
                    </div>
                `;
            }
        });
}

function displayBorrowings(borrowings) {
    // CORRECTION : On utilise l'ID de la grille HTML, pas celui d'un tableau !
    const container = document.getElementById('my-borrowings-container');
    if (!container) return; // Sécurité

    container.innerHTML = ''; // On vide le message de "Chargement..."

    // Si l'utilisateur n'a rien emprunté
    if (borrowings.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <h3 style="color: #1e293b; margin-bottom: 10px;">Aucun emprunt en cours</h3>
                <p style="color: #64748b; margin-bottom: 20px;">Vous n'avez pas encore emprunté de livres.</p>
                <a href="catalogue.html" class="btn-primary" style="display: inline-block; text-decoration: none;">Découvrir le catalogue</a>
            </div>
        `;
        return;
    }

    // On parcourt les emprunts et on crée une CARTE pour chacun
    borrowings.forEach(b => {
        // Formatage des dates
        const dateEmprunt = new Date(b.borrow_date).toLocaleDateString('fr-FR');
        const dateLimite = (b.due_date && b.due_date !== '0000-00-00') ? new Date(b.due_date).toLocaleDateString('fr-FR') : 'Non définie';

        // Gestion des couleurs des badges
        let badgeClass = 'status-encours';
        let badgeText = 'En cours';

        if (b.status === 'RETOURNE') {
            badgeClass = 'status-rendu';
            badgeText = 'Rendu';
        } else if (b.status === 'EN_RETARD') {
            badgeClass = 'status-retard';
            badgeText = 'En retard';
        }

        // Création de la carte HTML (Le même design que ton catalogue)
        const cardHTML = `
            <article class="book-card">
                <header class="book-header" style="height: 200px; position: relative;">
                    <img src="${b.image_url || 'https://placehold.co/400x600/eeeeee/31343C?text=' + encodeURIComponent(b.title)}" class="book-cover" style="width: 100%; height: 100%; object-fit: cover;">
                    <span class="badge-category status-badge ${badgeClass}" style="position: absolute; top: 10px; right: 10px;">
                        ${badgeText}
                    </span>
                </header>
                
                <div class="book-body" style="padding: 15px;">
                    <h3 class="book-title" style="font-size: 1.1rem; margin-bottom: 10px;">${b.title}</h3>
                    
                    <div style="font-size: 0.85rem; color: #475569;">
                        <p style="margin-bottom: 5px;"><strong>Emprunté le :</strong> ${dateEmprunt}</p>
                        <p><strong>À rendre le :</strong> <span style="color: ${b.status === 'EN_RETARD' ? 'red' : 'inherit'};">${dateLimite}</span></p>
                    </div>
                </div>
            </article>
        `;
        
        container.innerHTML += cardHTML;
    });
}