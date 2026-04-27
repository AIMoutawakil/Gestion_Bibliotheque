// public/js/details.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (!bookId) {
        window.location.href = 'catalogue.html';
        return;
    }

    fetchBookDetails(bookId);
});

function fetchBookDetails(id) {
    fetch('index.php/api/books/' + id)
        .then(response => {
            if (!response.ok) throw new Error('Livre non trouvé');
            return response.json();
        })
        .then(book => {
            displayBookDetails(book);
        })
        .catch(error => {
            document.getElementById('book-details-container').innerHTML = 
                '<div class="alert alert-danger">Erreur : Impossible de charger les détails.</div>';
        });
}

function displayBookDetails(book) {
    const container = document.getElementById('book-details-container');
    const userJson = sessionStorage.getItem('user'); // Vérifier si on est connecté
    
    let empruntHTML = '';
    
    if (book.isAvailable) {
        if (userJson) {
            // Si on est connecté, le bouton est cliquable et déclenche la fonction
            empruntHTML = `<button class="btn btn-success btn-lg" onclick="emprunterLivre(${book.id})">Emprunter ce livre</button>`;
        } else {
            // Si non connecté, bouton désactivé avec un message
            empruntHTML = `
                <button class="btn btn-secondary btn-lg" disabled>Emprunter ce livre</button>
                <p class="text-danger small mt-2"><strong>Vous devez être connecté pour emprunter.</strong></p>
            `;
        }
    } else {
        empruntHTML = `<button class="btn btn-danger btn-lg" disabled>Indisponible (Rupture de stock)</button>`;
    }

    container.innerHTML = `
        <div class="col-md-8 offset-md-2">
            <div class="card shadow-lg">
                <div class="card-header bg-primary text-white">
                    <h3 class="mb-0">${book.title}</h3>
                </div>
                <div class="card-body">
                    <h5 class="text-muted mb-4">Auteur : ${book.author}</h5>
                    <h6>Description :</h6>
                    <p class="lead">${book.description ? book.description : 'Aucune description disponible pour ce livre.'}</p>
                    <hr>
                    <div class="row text-center mb-4">
                        <div class="col-6">
                            <span class="text-muted">Stock total</span><br>
                            <h4 class="text-dark">${book.totalQuantity}</h4>
                        </div>
                        <div class="col-6">
                            <span class="text-muted">Disponibles</span><br>
                            <h4 class="${book.isAvailable ? 'text-success' : 'text-danger'}">${book.availableQuantity}</h4>
                        </div>
                    </div>
                    <div class="text-center">
                        ${empruntHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Fonction qui envoie la demande d'emprunt à PHP
function emprunterLivre(bookId) {
    fetch('index.php/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(result => {
        if (result.status === 200) {
            alert("🎉 Succès : " + result.body.message);
            // On recharge la page pour voir le stock diminuer en direct
            window.location.reload(); 
        } else {
            alert("❌ Erreur : " + result.body.erreur);
        }
    })
    .catch(error => {
        alert("❌ Erreur réseau lors de l'emprunt.");
    });
}