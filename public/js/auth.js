document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();

    if (sessionStorage.getItem('user')) {
        verifierEtAfficherRetard();
    }
});

function updateNavbar() {
    const authZone = document.getElementById('auth-zone');
    if (!authZone) return;

    const userJson = sessionStorage.getItem('user');
    
    if (userJson) {
        const user = JSON.parse(userJson);
        
        const nameParts = user.name.split(' ');
        let initials = nameParts[0].charAt(0).toUpperCase();
        if (nameParts.length > 1) {
            initials += nameParts[1].charAt(0).toUpperCase();
        }

        let boutonAdmin = '';
        if (user.role === 'ADMIN') {
            boutonAdmin = `<a href="admin-dashboard.html" style="background: #eab308; color: #1e293b; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-right: 15px; font-size: 0.9rem;">⚙️ Administration</a>`;
        }

        authZone.innerHTML = `
            <div style="display: flex; align-items: center;">
                ${boutonAdmin}
                <div class="user-profile" style="display: flex; align-items: center; gap: 10px; margin-right: 15px;">
                    <div class="avatar" style="background: royalblue; color: white; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem;">${initials}</div>
                    <span class="user-name" style="font-weight: 600; color: #1e293b;">${user.name}</span>
                </div>
                <button onclick="logout()" class="btn-logout" style="border: none; background: #ef4444; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s;">Déconnexion</button>
            </div>
        `;
    } else {
        authZone.innerHTML = `
            <div style="display: inline-flex; align-items: center; gap: 15px;">
                <a href="login.html" style="color: #1e293b; font-weight: 600; text-decoration: none;">Connexion</a>
                <a href="register.html" style="background: royalblue; color: white; padding: 8px 15px; border-radius: 8px; text-decoration: none; font-weight: 600;">S'inscrire</a>
            </div>
        `;
    }
}

function logout() {
    sessionStorage.clear();
    localStorage.clear();
    
    fetch('index.php/api/logout', { method: 'POST' })
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch(err => {
            window.location.href = 'login.html';
        });
}

function verifierEtAfficherRetard() {
    const timestamp = new Date().getTime();
    fetch(`index.php/api/check-retards?t=${timestamp}`)
        .then(response => {
            if (!response.ok) throw new Error("Erreur serveur");
            return response.json();
        })
        .then(data => {
            if (data.retards > 0) {
                afficherBandeauRouge(data.retards);
            }
        })
        .catch(error => console.error("Impossible de vérifier les retards :", error));
}

function afficherBandeauRouge(nbRetards) {
    const bandeau = document.createElement('div');
    bandeau.style.backgroundColor = '#ef4444'; 
    bandeau.style.color = 'white';
    bandeau.style.textAlign = 'center';
    bandeau.style.padding = '12px 20px';
    bandeau.style.fontWeight = '700';
    bandeau.style.fontSize = '1.05rem';
    bandeau.style.position = 'sticky';
    bandeau.style.top = '0'; 
    bandeau.style.zIndex = '9999'; 
    bandeau.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
    bandeau.style.letterSpacing = '0.5px';
    
    const pluriel = nbRetards > 1 ? 's' : '';
    bandeau.innerHTML = `
        <span style="font-size: 1.2rem; margin-right: 10px;">⚠️</span> 
        ALERTE : Vous avez <u>${nbRetards} livre${pluriel} en retard</u> ! Vos droits d'emprunt sont suspendus jusqu'à restitution.
    `;

    document.body.insertBefore(bandeau, document.body.firstChild);
}
