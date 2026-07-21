
let allBooks = []; 
let currentCategoryId = null; 

document.addEventListener('DOMContentLoaded', () => {
    fetchBooks();
    setupLiveSearch(); 
});

function fetchBooks() {
    fetch('index.php/api/books')
        .then(response => response.json())
        .then(books => {
            allBooks = books; 
            displayBooks(allBooks); 
            generateCategories(allBooks); 
        })
        .catch(error => {
            document.getElementById('books-container').innerHTML = 
                '<div class="loading-state" style="color: red;">Erreur de chargement. Vérifiez votre serveur.</div>';
        });
}

function displayBooks(booksToDisplay) {
    const container = document.getElementById('books-container');
    container.innerHTML = '';

    const user = JSON.parse(sessionStorage.getItem('user'));

    booksToDisplay.forEach(book => {
        const isAvailable = book.availableQuantity > 0;
        const stockClass = isAvailable ? 'stock-in' : 'stock-out';
        const stockText = isAvailable ? `En stock : ${book.availableQuantity}` : 'Rupture';

        const cardHTML = `
            <article class="book-card">
                <header class="book-header">
                    <img src="${book.imageUrl || 'https://placehold.co/400x600?text=' + encodeURIComponent(book.title)}" class="book-cover">
                    <span class="badge-category">${book.categoryName}</span>
                </header>
                <div class="book-body">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">Par ${book.author}</p>
                    <footer class="book-footer">
                        <span class="badge-stock ${stockClass}">${stockText}</span>
                        ${isAvailable 
                            ? `<button onclick="emprunterLivre(${book.id})" class="btn-primary">Emprunter</button>`
                            : `<button disabled class="btn-primary" style="background:#ccc">Indisponible</button>`
                        }
                    </footer>
                </div>
            </article>
        `;
        container.innerHTML += cardHTML;
    });
}

function emprunterLivre(bookId) {
    const user = JSON.parse(sessionStorage.getItem('user'));

    if (!user) {
        alert("Vous devez être connecté pour emprunter un livre.");
        window.location.href = 'login.html';
        return;
    }

    if (confirm("Voulez-vous vraiment emprunter ce livre ?")) {
        
        fetch('index.php/api/borrow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                book_id: bookId // <-- La bonne orthographe attendue par ton PHP !
            })
        })
        .then(async response => {
            const data = await response.json();
            // Si le PHP a renvoyé une erreur (ex: code 400 ou 401)
            if (!response.ok) {
                throw new Error(data.erreur || "Une erreur est survenue.");
            }
            return data;
        })
        .then(data => {
            // Succès ! Le PHP a renvoyé data.message
            alert("✅ " + data.message);
            fetchBooks(); // On rafraîchit la liste pour voir le stock baisser en direct
        })
        .catch(error => {
            // Échec (Livre indisponible, erreur serveur...)
            alert("❌ Erreur : " + error.message);
        });
    }
}

function generateCategories(books) {
    const listContainer = document.getElementById('categories-list');
    
    // On extrait les catégories uniques
    const categoriesMap = new Map();
    books.forEach(book => {
        if (book.categoryName && book.categoryId) {
            categoriesMap.set(book.categoryId, book.categoryName);
        }
    });

    listContainer.innerHTML = `
        <li class="category-item active" onclick="filterByCategory(null, 'Tous les livres', this)">
            Toutes les catégories
        </li>
    `;

    categoriesMap.forEach((name, id) => {
        listContainer.innerHTML += `
            <li class="category-item" onclick="filterByCategory(${id}, '${name}', this)">
                ${name}
            </li>
        `;
    });
}

function filterByCategory(categoryId, categoryName, clickedElement) {
    currentCategoryId = categoryId; // On mémorise où on est
    document.getElementById('catalogue-title').textContent = categoryName;

    document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
    // On l'ajoute uniquement sur le bouton cliqué
    clickedElement.classList.add('active');

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    if (categoryId === null) {
        displayBooks(allBooks);
    } else {
        const filteredBooks = allBooks.filter(book => book.categoryId === categoryId);
        displayBooks(filteredBooks);
    }
}

function setupLiveSearch() {
    const searchInput = document.getElementById('search-input');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const motCle = e.target.value.toLowerCase();

            const filteredBooks = allBooks.filter(book => {
                const correspondRecherche = book.title.toLowerCase().includes(motCle) || 
                                            book.author.toLowerCase().includes(motCle);
                
                const correspondCategorie = (currentCategoryId === null) || (book.categoryId === currentCategoryId);

                return correspondRecherche && correspondCategorie;
            });

            displayBooks(filteredBooks);
        });
    }
}
