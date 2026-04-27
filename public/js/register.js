// public/js/register.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorBox = document.getElementById('register-error');

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        errorBox.classList.add('d-none');

        const prenom = document.getElementById('prenom').value;
        const nom = document.getElementById('nom').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const submitBtn = registerForm.querySelector('.submit');
        submitBtn.textContent = 'Création en cours...';
        submitBtn.disabled = true;

        // On fusionne le prénom et le nom pour la base de données
        const fullName = `${prenom} ${nom}`;

        fetch('index.php/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: fullName, email: email, password: password })
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.erreur || 'Erreur lors de l\'inscription.');
            return data;
        })
        .then(data => {
            // Si le compte est créé, on redirige vers le login avec un petit délai
            submitBtn.textContent = 'Succès ! Redirection...';
            submitBtn.style.backgroundColor = 'green';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        })
        .catch(error => {
            errorBox.textContent = error.message;
            errorBox.classList.remove('d-none');
            submitBtn.textContent = "S'inscrire";
            submitBtn.disabled = false;
        });
    });
});