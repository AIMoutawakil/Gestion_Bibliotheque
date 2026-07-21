
        document.addEventListener('DOMContentLoaded', () => {
            const memoireUtilisateur = sessionStorage.getItem('user');
            
            const zoneBoutons = document.getElementById('nav-auth-section'); 
            
            if (memoireUtilisateur && zoneBoutons) {
                const utilisateur = JSON.parse(memoireUtilisateur);
                const nom = utilisateur.fullname || utilisateur.name || 'Étudiant';
                
                zoneBoutons.innerHTML = `
                    <span style="font-weight: 500; color: #64748b; margin-right: 15px;">👋 Bonjour, ${nom}</span>
                    <button onclick="seDeconnecterForce()" style="color: #ef4444; border: 1px solid #ef4444; padding: 8px 16px; border-radius: 8px; background: transparent; cursor: pointer; font-weight: bold;">Déconnexion</button>
                `;
            }
        });

        function seDeconnecterForce() {
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = 'index.html'; // On renvoie à l'accueil
        }
    
