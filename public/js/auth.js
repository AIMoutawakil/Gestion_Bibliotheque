// public/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const authZone = document.getElementById('auth-zone');
    const userJson = sessionStorage.getItem('user');

    if (authZone) {
        if (userJson) {
            const user = JSON.parse(userJson);
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff&rounded=true&size=35`;
            
            // NOUVEAU : On prépare un bouton d'administration (vide par défaut)
            let boutonAdmin = '';
            // Si c'est un ADMIN, on remplit le bouton
            if (user.role === 'ADMIN') {
                boutonAdmin = `<a href="admin.html" class="btn btn-warning btn-sm me-2 text-dark fw-bold">⚙️ Administration</a>`;
            }

            authZone.innerHTML = `
            <div class="user-profile">
                <div class="avatar">${initials}</div>
                <span class="user-name">${user.name}</span> 
            </div>
            <button onclick="logout()" class="btn-logout">Déconnexion</button>
        `;
        } else {
            authZone.innerHTML = `<a href="login.html" class="btn btn-outline-light">Connexion</a>`;
        }
    }
});
// Dans ton fichier auth.js ou l'endroit où tu gères la session

function updateNavbar() {
    const authZone = document.getElementById('auth-zone');
    if (!authZone) return;

    const userJson = sessionStorage.getItem('user');
    
    if (userJson) {
        // Utilisateur connecté
        const user = JSON.parse(userJson);
        
        // On récupère les initiales (ex: "Alice Dupont" -> "AD")
        const nameParts = user.name.split(' ');
        let initials = nameParts[0].charAt(0).toUpperCase();
        if (nameParts.length > 1) {
            initials += nameParts[1].charAt(0).toUpperCase();
        }

        authZone.innerHTML = `
            <div class="user-profile">
                <div class="avatar">${initials}</div>
                <span class="user-name">${user.name}</span>
            </div>
            <button onclick="logout()" class="btn-logout">Déconnexion</button>
        `;
    } else {
        // Utilisateur non connecté
        authZone.innerHTML = `
            <a href="login.html" style="color: #1e293b; font-weight: 600; text-decoration: none; margin-right: 15px;">Connexion</a>
            <a href="register.html" style="background: royalblue; color: white; padding: 8px 15px; border-radius: 8px; text-decoration: none; font-weight: 600;">S'inscrire</a>
        `;
    }
}

// Assure-toi d'appeler cette fonction au chargement !
document.addEventListener('DOMContentLoaded', updateNavbar);

function logout() {
    // 1. On efface ce qui est stocké dans le navigateur
    sessionStorage.clear();
    localStorage.clear();
    
    // 2. On attend que le PHP détruise la session, PUIS on redirige
    // CORRECTION du chemin : on ajoute index.php/api/logout pour être sûr
    fetch('index.php/api/logout', { method: 'POST' })
        .then(() => {
            // 3. On redirige SEULEMENT quand le serveur a répondu
            window.location.href = 'login.html';
        })
        .catch(err => {
            // Par sécurité, on redirige quand même en cas de problème réseau
            window.location.href = 'login.html';
        });
}