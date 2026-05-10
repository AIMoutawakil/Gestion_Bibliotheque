// public/js/catalogue.js

let allBooks = []; // On garde tous les livres en mémoire pour filtrer très vite

document.addEventListener('DOMContentLoaded', () => {
    // 1. Charger les livres au démarrage
    fetchBooks();

    // 2. Activer la barre de recherche
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    // 3. Activer les boutons de catégories
    const categoryButtons = document.querySelectorAll('.cat-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Enlever la classe 'active' de tous les boutons
            categoryButtons.forEach(b => b.classList.remove('active'));
            // L'ajouter au bouton cliqué
            e.target.classList.add('active');
            
            // Changer le grand titre
            document.getElementById('catalog-title').textContent = e.target.textContent;
            
            // Appliquer les filtres
            applyFilters();
        });
    });
});

function fetchBooks() {
    const timestamp = new Date().getTime();
    fetch(`index.php/api/books?t=${timestamp}`)
        .then(response => {
            if (!response.ok) throw new Error("Erreur serveur");
            return response.json();
        })
        .then(books => {
            allBooks = books; // On sauvegarde
            displayBooks(allBooks); // On affiche tout
        })
        .catch(error => {
            document.getElementById('books-container').innerHTML = 
                `<div style="color: red; padding: 20px;">Erreur de connexion à la base de données.</div>`;
        });
}

function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const activeCategory = document.querySelector('.cat-btn.active').dataset.category;

    const filteredBooks = allBooks.filter(book => {
        // Condition 1 : Est-ce que le texte correspond au titre ou à l'auteur ?
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || 
                              book.author.toLowerCase().includes(searchTerm);
        
        // Condition 2 : Est-ce que la catégorie correspond ? (Ou si "all" est sélectionné)
        // Note: Assure-toi que la propriété s'appelle bien book.categoryName ou book.category dans ton JSON PHP
        const categoryName = book.category_name || book.category || "";
        const matchesCategory = (activeCategory === 'all') || (categoryName === activeCategory);

        return matchesSearch && matchesCategory;
    });

    displayBooks(filteredBooks);
}

// public/js/catalogue.js

// Dans js/catalogue.js

function displayBooks(booksToDisplay) {
    const container = document.getElementById('books-container');
    container.innerHTML = '';

    if (booksToDisplay.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">Aucun livre trouvé avec ces filtres.</div>`;
        return;
    }

    booksToDisplay.forEach(book => {
        // Déterminer la disponibilité
        const stockDispo = book.available_quantity !== undefined ? parseInt(book.available_quantity) : parseInt(book.totalQuantity);
        const isAvailable = stockDispo > 0;
        
        // Configuration du badge
        const badgeClass = isAvailable ? 'dispo' : 'emprunte';
        const badgeText = isAvailable ? 'Disponible' : 'Emprunté';
        
        // Gestion de l'image (avec sécurité si elle manque)
        const imageUrl = book.image_url || book.imageUrl || 'https://placehold.co/400x600/eeeeee/31343C?text=' + encodeURIComponent(book.title);

        // NOUVELLE CARTE ENRICHIE
        const cardHTML = `
            <article class="catalog-card" onclick="ouvrirDetailsLivre(${book.id || book.book_id})">
                <div class="card-img-wrapper">
                    <img src="${imageUrl}" alt="${book.title}" onerror="this.src='https://placehold.co/400x600/eeeeee/31343C?text=Image'">
                    <span class="status-pill ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-info">
                    <h4>${book.title}</h4>
                    <p>${book.author}</p>
                </div>
            </article>
        `;
        
        container.innerHTML += cardHTML;
    });
}

// L'action déclenchée quand l'étudiant clique sur un livre
function ouvrirDetailsLivre(bookId) {
    console.log("L'étudiant a cliqué sur le livre ID :", bookId);
    
    // Prochaine étape : Rediriger vers la page de détails !
    // window.location.href = `details.html?id=${bookId}`;
}

function actionClicLivre(bookId) {
    console.log("Livre cliqué ! ID :", bookId);
    // Prêt pour la suite !
}

// === LA FONCTION POUR LA SUITE ===
// C'est ici qu'on mettra ton code quand tu me diras ce qu'on fait après le clic !
function actionClicLivre(bookId) {
    console.log("Livre cliqué ! ID :", bookId);
    // En attente de tes instructions...
}
// CORRECTION : On ajoute 'buttonElement' pour modifier le bouton cliqué
function emprunterLivre(bookId, buttonElement) {
    const user = JSON.parse(sessionStorage.getItem('user'));

    if (!user) {
        alert("Vous devez être connecté pour emprunter un livre.");
        window.location.href = 'login.html';
        return;
    }

    if (confirm("Voulez-vous vraiment emprunter ce livre ?")) {
        // On change le texte du bouton pour faire patienter l'utilisateur
        const originalText = buttonElement.innerText;
        buttonElement.innerText = "Traitement...";
        buttonElement.disabled = true;
        buttonElement.style.opacity = "0.7";

        fetch('index.php/api/borrow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ book_id: bookId })
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.erreur || "Une erreur est survenue.");
            return data;
        })
.then(data => {
            alert("✅ " + data.message);
            
            const footerElement = buttonElement.parentElement;
            const stockNumberElement = footerElement.querySelector('.stock-number');
            
            if (stockNumberElement) {
                let currentStock = parseInt(stockNumberElement.innerText);
                currentStock--; // On enlève 1 au stock visuellement
                stockNumberElement.innerText = currentStock; // On met à jour l'écran

                // S'il n'y a plus de stock, on grise le bouton définitivement
                if (currentStock <= 0) {
                    buttonElement.innerText = "Indisponible";
                    buttonElement.style.background = "#cbd5e1";
                    buttonElement.disabled = true; // On désactive le bouton
                    buttonElement.style.opacity = "1";
                    footerElement.querySelector('.status-badge').innerHTML = "Rupture de stock";
                    footerElement.querySelector('.status-badge').style.color = "#991b1b";
                    footerElement.querySelector('.status-badge').style.backgroundColor = "#fee2e2";
                } else {
                    // Sinon on remet le bouton normal
                    buttonElement.innerText = "Emprunter";
                    buttonElement.disabled = false;
                    buttonElement.style.opacity = "1";
                }
            }

            // ❌ LA LIGNE fetchBooks() A ÉTÉ SUPPRIMÉE ICI !
        })
        .catch(error => {
            alert("❌ Erreur : " + error.message);
            // En cas d'erreur, on remet le bouton à son état normal
            buttonElement.innerText = originalText;
            buttonElement.disabled = false;
            buttonElement.style.opacity = "1";
        });
    }
}