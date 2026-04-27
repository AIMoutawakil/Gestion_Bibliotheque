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

function displayBooks(booksToDisplay) {
    const container = document.getElementById('books-container');
    container.innerHTML = '';

    if (booksToDisplay.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">Aucun livre trouvé.</div>`;
        return;
    }

    booksToDisplay.forEach(book => {
        // On récupère le stock disponible
        const stockDispo = book.available_quantity !== undefined ? parseInt(book.available_quantity) : parseInt(book.totalQuantity);
        
        const isAvailable = stockDispo > 0;
        const stockColor = isAvailable ? '#166534' : '#991b1b'; // Vert foncé ou Rouge foncé
        const stockBg = isAvailable ? '#dcfce7' : '#fee2e2'; // Fond vert clair ou rouge clair
        const stockText = isAvailable ? `En stock : <span class="stock-number">${stockDispo}</span>` : 'Rupture de stock';
        
        // ASTUCE : On passe "this" dans le onclick pour que la fonction sache exactement sur QUEL bouton on a cliqué !
        const btnHTML = isAvailable 
            ? `<button onclick="emprunterLivre(${book.id || book.book_id}, this)" class="btn-primary" style="width: 100%; padding: 12px; border: none; border-radius: 8px; background: royalblue; color: white; cursor: pointer; font-weight: bold; transition: 0.2s;">Emprunter</button>`
            : `<button disabled style="width: 100%; padding: 12px; border: none; border-radius: 8px; background: #cbd5e1; color: white; font-weight: bold;">Indisponible</button>`;

        // On remplace le mot fixe "Livre" par la vraie catégorie du livre en haut à droite
        const categoryBadge = book.category_name || book.category || 'Livre';

        const cardHTML = `
            <article class="book-card" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; display: flex; flex-direction: column;">
                <header class="book-header" style="height: 220px; position: relative;">
                    <img src="${book.image_url || book.imageUrl || 'https://placehold.co/400x600/eeeeee/31343C?text=Livre'}" style="width: 100%; height: 100%; object-fit: cover;">
                    <span class="badge-category" style="position: absolute; top: 10px; right: 10px; background: white; color: royalblue; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                        ${categoryBadge}
                    </span>
                </header>
                
                <div class="book-body" style="padding: 20px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <h3 style="font-size: 1.1rem; margin-bottom: 5px; color: #1e293b;">${book.title}</h3>
                        <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 20px;">Par ${book.author}</p>
                    </div>
                    
                    <footer style="display: flex; flex-direction: column; gap: 15px; align-items: center;">
                        <span class="status-badge" style="font-size: 0.85rem; font-weight: 600; padding: 5px 12px; border-radius: 8px; color: ${stockColor}; background-color: ${stockBg}; width: 100%; text-align: center;">
                            ${stockText}
                        </span>
                        ${btnHTML}
                    </footer>
                </div>
            </article>
        `;
        container.innerHTML += cardHTML;
    });
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