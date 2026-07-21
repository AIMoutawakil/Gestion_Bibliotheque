document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        errorBox.classList.add('d-none');
        sessionStorage.clear();
        localStorage.clear();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

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

            sessionStorage.setItem('user', JSON.stringify(data.user));
            
            if (data.user.role === 'ADMIN') {
                window.location.href = 'admin-dashboard.html';
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
