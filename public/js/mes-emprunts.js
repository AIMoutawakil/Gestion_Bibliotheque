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

// Fonction utilitaire pour formater la date en JJ/MM/AAAA
function formaterDateFR(dateSQL) {
    if (!dateSQL) return "";
    const date = new Date(dateSQL);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function displayBorrowings(borrowings) {
    const container = document.getElementById('my-borrowings-container');
    container.innerHTML = '';

    if (borrowings.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #64748b; width: 100%;">Vous n'avez aucun emprunt en cours.</div>`;
        return;
    }

    borrowings.forEach(b => {
        // 1. Gestion de l'image (avec sécurité si elle manque)
        const imageUrl = b.image_url || b.imageUrl || 'https://placehold.co/400x600/eeeeee/31343C?text=' + encodeURIComponent(b.title);

        // 2. Formatage des dates
        const dateEmprunt = formaterDateFR(b.borrow_date);
        const dateLimite = formaterDateFR(b.due_date);

        // 3. Gestion dynamique du statut (Couleurs du badge)
        let badgeText = "En cours";
        let badgeBg = "#e0e7ff"; // Fond violet très clair (comme sur ta photo)
        let badgeColor = "#3730a3"; // Texte violet foncé
        let dateColor = "#64748b"; // Couleur normale pour la date

        if (b.status === 'EN_RETARD') {
            badgeText = "En retard";
            badgeBg = "#fee2e2"; // Fond rouge clair
            badgeColor = "#991b1b"; // Texte rouge foncé
            dateColor = "#dc2626"; // Date en rouge pour alerter
        } else if (b.status === 'RENDU') {
            badgeText = "Rendu";
            badgeBg = "#dcfce7"; // Fond vert clair
            badgeColor = "#166534"; // Texte vert foncé
        }

        // 4. La structure HTML exacte de ta capture d'écran
        const cardHTML = `
            <article style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; display: flex; flex-direction: column; transition: transform 0.2s;">
                
                <!-- LA MAGIE EST ICI : aspect-ratio: 2 / 3 donne exactement la forme du catalogue -->
                <header style="width: 100%; aspect-ratio: 2 / 3; position: relative;">
                    <img src="${imageUrl}" alt="${b.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                    <span style="position: absolute; top: 10px; right: 10px; background-color: ${badgeBg}; color: ${badgeColor}; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                        ${badgeText}
                    </span>
                </header>
                
                <!-- Zone de texte légèrement ajustée pour la nouvelle largeur -->
                <div style="padding: 15px; flex-grow: 1; display: flex; flex-direction: column;">
                    <h3 style="font-size: 1rem; color: #1e293b; margin-bottom: 12px; font-weight: 700; line-height: 1.3;">${b.title}</h3>
                    
                    <div style="font-size: 0.75rem; color: #64748b; line-height: 1.5; margin-top: auto;">
                        <p style="margin: 0; padding-bottom: 5px; border-bottom: 1px solid #f1f5f9;"><strong>Emprunté le :</strong><br> ${dateEmprunt}</p>
                        <p style="margin: 5px 0 0 0;"><strong>À rendre le :</strong><br> <span style="color: ${dateColor}; font-weight: ${b.status === 'EN_RETARD' ? 'bold' : 'normal'};">${dateLimite}</span></p>
                    </div>
                </div>
                
            </article>
        `;
        
        container.innerHTML += cardHTML;
    });
}