// public/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // On cache l'erreur et on vide la mémoire par sécurité
        errorBox.classList.add('d-none');
        sessionStorage.clear();
        localStorage.clear();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // On modifie le texte du bouton pendant le chargement
        const submitBtn = loginForm.querySelector('.submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Connexion...';
        submitBtn.disabled = true;

        fetch('index.php/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(response => {
            if (!response.ok) throw new Error('Adresse email ou mot de passe incorrect.');
            return response.json();
        })
        .then(data => {
            // Succès ! On sauvegarde les infos de base et on redirige
            sessionStorage.setItem('user', JSON.stringify(data.user));
            
            if (data.user.role === 'ADMIN') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'catalogue.html';
            }
        })
        .catch(error => {
            // Échec : on affiche la boîte rouge
            errorBox.textContent = error.message;
            errorBox.classList.remove('d-none');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });
});