let allBooks = []; 
let allCategories = []; 
let activeCategory = 'all'; 

document.addEventListener('DOMContentLoaded', () => {
    fetchBooks();

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    // ========================================================
    // GESTION DE LA MODALE DES CATÉGORIES
    // ========================================================
    const catSearchTrigger = document.getElementById('category-search');
    const catModal = document.getElementById('categoryModal');
    const closeCatModalBtn = document.getElementById('closeCatModalBtn');
    const modalCatSearchInput = document.getElementById('modal-category-search');

    if (catSearchTrigger) {
        catSearchTrigger.addEventListener('click', () => {
            if (catModal) {
                catModal.classList.add('active');
                if (modalCatSearchInput) {
                    modalCatSearchInput.value = ''; 
                    setTimeout(() => modalCatSearchInput.focus(), 100); 
                }
                afficherCategoriesDansModale(''); 
            }
        });
    }

    if (closeCatModalBtn) {
        closeCatModalBtn.addEventListener('click', () => {
            if (catModal) catModal.classList.remove('active');
        });
    }

    if (catModal) {
        catModal.addEventListener('click', (e) => {
            if (e.target === catModal) catModal.classList.remove('active');
        });
    }

    if (modalCatSearchInput) {
        modalCatSearchInput.addEventListener('input', (e) => {
            afficherCategoriesDansModale(e.target.value);
        });
    }
    // ========================================================

    const dispoCheckbox = document.getElementById('filter-dispo');
    if (dispoCheckbox) dispoCheckbox.addEventListener('change', applyFilters);

    const langCheckboxes = document.querySelectorAll('.filter-lang');
    langCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);
});

function fetchBooks() {
    const timestamp = new Date().getTime();
    fetch(`index.php/api/books?t=${timestamp}`)
        .then(response => {
            if (!response.ok) throw new Error("Erreur serveur");
            return response.json();
        })
        .then(books => {
            allBooks = books; 
            extraireCategories(); 
            applyFilters();   
        })
        .catch(error => {
            document.getElementById('books-container').innerHTML = 
                `<div style="color: red; padding: 20px;">Erreur de connexion à la base de données.</div>`;
        });
}

// --- SYSTÈME DE CATÉGORIES DYNAMIQUES ---
function extraireCategories() {
    const catSet = new Set();
    allBooks.forEach(book => {
        const catName = book.category_name || book.categoryName || book.category;
        if (catName && catName.trim() !== "") {
            catSet.add(catName);
        }
    });
    allCategories = Array.from(catSet).sort();
    afficherCategoriesSidebar();
}

function afficherCategoriesSidebar() {
    const catList = document.getElementById('category-list');
    if (!catList) return;

    let html = `<button class="cat-btn ${activeCategory === 'all' ? 'active' : ''}" data-category="all">Toutes les catégories</button>`;
    
    const premieresCategories = allCategories.slice(0, 6);
    premieresCategories.forEach(cat => {
        html += `<button class="cat-btn ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`;
    });

    catList.innerHTML = html;
    configurerEcouteursCategories('#category-list .cat-btn');
}

function afficherCategoriesDansModale(recherche) {
    const grid = document.getElementById('modal-category-grid');
    if (!grid) return;

    let html = `<button class="modal-cat-btn ${activeCategory === 'all' ? 'active' : ''}" data-category="all">📁 Toutes les catégories</button>`;
    
    const categoriesFiltrees = allCategories.filter(cat => cat.toLowerCase().includes(recherche.toLowerCase()));

    categoriesFiltrees.forEach(cat => {
        html += `<button class="modal-cat-btn ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`;
    });

    if (categoriesFiltrees.length === 0 && recherche !== '') {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">Aucune catégorie trouvée.</div>`;
        return;
    }

    grid.innerHTML = html;
    configurerEcouteursCategories('#modal-category-grid .modal-cat-btn');
}

function configurerEcouteursCategories(selecteur) {
    document.querySelectorAll(selecteur).forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeCategory = e.target.dataset.category;
            
            document.getElementById('catalog-title').textContent = e.target.textContent.replace('📁 ', '');
            
            afficherCategoriesSidebar(); 
            
            const catModal = document.getElementById('categoryModal');
            if(catModal) catModal.classList.remove('active');

            applyFilters();
        });
    });
}

// --- LOGIQUE DE FILTRAGE DES LIVRES ---
function applyFilters() {
    const searchTerm = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase() : '';
    const dispoCheckbox = document.getElementById('filter-dispo');
    const onlyAvailable = dispoCheckbox ? dispoCheckbox.checked : false;
    const checkedLangs = Array.from(document.querySelectorAll('.filter-lang:checked')).map(cb => cb.value);

    let filteredBooks = allBooks.filter(book => {
        const bookTitle = book.title ? book.title.toLowerCase() : '';
        const bookAuthor = book.author ? book.author.toLowerCase() : '';
        const matchesSearch = bookTitle.includes(searchTerm) || bookAuthor.includes(searchTerm);
        
        const categoryName = book.category_name || book.categoryName || book.category || "";
        const matchesCategory = (activeCategory === 'all') || (categoryName === activeCategory);

        const stockDispo = book.available_quantity !== undefined ? parseInt(book.available_quantity) : parseInt(book.totalQuantity || 0);
        const matchesDispo = onlyAvailable ? (stockDispo > 0) : true;

        const bookLang = book.langue || book.language_name || book.languageName || "Français"; 
        const matchesLang = checkedLangs.length === 0 ? true : checkedLangs.includes(bookLang);

        return matchesSearch && matchesCategory && matchesDispo && matchesLang;
    });

    const sortSelect = document.getElementById('sort-select');
    const sortValue = sortSelect ? sortSelect.value : 'new';
    
    if (sortValue === 'az') {
        filteredBooks.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } 
    else if (sortValue === 'new') {
        filteredBooks.sort((a, b) => (b.id || b.book_id || 0) - (a.id || a.book_id || 0));
    } 
    else if (sortValue === 'pop') {
        filteredBooks.sort((a, b) => (b.popularite || b.emprunts || b.totalQuantity || 0) - (a.popularite || a.emprunts || a.totalQuantity || 0));
    }

    displayBooks(filteredBooks);
}

// --- AFFICHAGE DE LA GRILLE DE LIVRES ---
function displayBooks(booksToDisplay) {
    const container = document.getElementById('books-container');
    if(!container) return;
    container.innerHTML = '';

    if (booksToDisplay.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">Aucun livre trouvé avec ces filtres.</div>`;
        return;
    }

    booksToDisplay.forEach(book => {
        const stockDispo = book.available_quantity !== undefined ? parseInt(book.available_quantity) : parseInt(book.totalQuantity || 0);
        const isAvailable = stockDispo > 0;
        const badgeClass = isAvailable ? 'dispo' : 'emprunte';
        const badgeText = isAvailable ? 'Disponible' : 'Indisponible';
        const imageUrl = book.image_url || book.imageUrl || 'https://placehold.co/400x600/eeeeee/31343C?text=' + encodeURIComponent(book.title || 'Livre');
        const bookId = book.id || book.book_id;

        const cardHTML = `
            <article class="catalog-card">
                <div class="card-img-wrapper" style="cursor: pointer;" onclick="window.location.href='details.html?id=${bookId}'">
                    <img src="${imageUrl}" alt="${book.title}" onerror="this.src='https://placehold.co/400x600/eeeeee/31343C?text=Image'">
                    <span class="status-pill ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-info" style="display: flex; flex-direction: column; flex-grow: 1;">
                    <div style="flex-grow: 1;">
                        <h4 style="cursor: pointer;" onclick="window.location.href='details.html?id=${bookId}'">${book.title}</h4>
                        <p style="margin-bottom: 15px;">${book.author}</p>
                    </div>
                    ${isAvailable ? `
                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: auto;">
                        <button onclick="emprunterLivre(${bookId}, this)" style="width: 100%; padding: 10px; font-size: 1rem; font-weight: 600; border: none; border-radius: 8px; background: #5a67d8; color: white; cursor: pointer; transition: 0.2s;">Emprunter</button>
                    </div>
                    ` : `
                    <div style="margin-top: auto;">
                        <button disabled style="width: 100%; padding: 10px; font-size: 1rem; font-weight: 600; border: none; background: #cbd5e1; color: white; border-radius: 8px; cursor: not-allowed;">Rupture de stock</button>
                    </div>
                    `}
                </div>
            </article>
        `;
        container.innerHTML += cardHTML;
    });
}

// --- FONCTION D'EMPRUNT SIMPLIFIÉE ---
function emprunterLivre(bookId, btnElement) {
    const userJson = sessionStorage.getItem('user');
    if (!userJson) {
        alert("Veuillez vous connecter pour emprunter un livre.");
        window.location.href = 'login.html';
        return;
    }

    const qtyAEmprunter = 1; // Toujours 1 maintenant
    const originalText = btnElement.innerText;
    
    btnElement.innerText = "⏳ En cours...";
    btnElement.disabled = true;

    fetch('index.php/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId, quantity: qtyAEmprunter })
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.erreur || "Erreur lors de l'emprunt.");
        return data;
    })
    .then(data => {
        alert("✅ Succès : Livre emprunté !\n⏳ Vous avez 15 jours pour le restituer.");
        btnElement.innerText = "Emprunté !";
        btnElement.style.backgroundColor = "#22c55e"; // Devient vert
        
        setTimeout(() => fetchBooks(), 1500); 
    })
    .catch(error => {
        alert("❌ " + error.message);
        btnElement.innerText = originalText;
        btnElement.disabled = false;
    });
}

// --- ENVOYER UN MESSAGE À L'ADMIN ---
function envoyerMessageAdmin() {
    const userJson = sessionStorage.getItem('user');
    if (!userJson) {
        alert("Vous devez être connecté pour envoyer un message.");
        window.location.href = 'login.html';
        return;
    }

    const textArea = document.getElementById('student-message-text');
    const message = textArea.value.trim();
    const btnSend = document.getElementById('btn-send-msg');

    if (message === "") {
        alert("Veuillez écrire un message avant de l'envoyer.");
        return;
    }

    const originalText = btnSend.innerText;
    btnSend.innerText = "Envoi en cours...";
    btnSend.disabled = true;
    btnSend.style.opacity = "0.7";

    fetch('index.php/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.erreur || "Erreur inconnue");
        return data;
    })
    .then(data => {
        // CORRECTION ICI : Le bon message de succès pour le formulaire de contact !
        alert("✅ " + (data.message || "Votre message a été envoyé à l'administration !"));
        textArea.value = ""; 
        const modal = document.getElementById('messageModal');
        if (modal) modal.classList.remove('active'); 
    })
    .catch(error => {
        alert("❌ Erreur : " + error.message);
    })
    .finally(() => {
        btnSend.innerText = originalText;
        btnSend.disabled = false;
        btnSend.style.opacity = "1";
    });
}