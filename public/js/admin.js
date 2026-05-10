// --- VARIABLES GLOBALES ---
let adminCatalog = []; 
let modeEditionId = null; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. SÉCURITÉ : Vérification de l'Admin
    const userJson = sessionStorage.getItem('user');
    if (!userJson) { window.location.href = 'login.html'; return; }
    
    const user = JSON.parse(userJson);
    if (user.role !== 'ADMIN') {
        alert("Accès refusé !");
        window.location.href = 'catalogue.html';
        return;
    }

    // 2. CHARGEMENT DES LIVRES
    fetchBookStats();   

    // 3. GESTION DU FORMULAIRE DE LA MODALE
    const form = document.getElementById('addBookForm');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('coverImage');
            let imageValue = document.getElementById('existing_image_url').value;

            // La fonction qui envoie les données à PHP
            const envoyerAuServeur = (finalImageBase64) => {
                const bookData = {
                    title: document.getElementById('title').value,
                    author: document.getElementById('author').value,
                    categoryId: document.getElementById('category').value, 
                    newCategoryName: document.getElementById('newCategoryName').value,
                    languageId: document.getElementById('language').value, // NOUVEAU
                    newLanguageName: document.getElementById('newLanguageName').value, // NOUVEAU
                    totalQuantity: document.getElementById('quantity').value,
                    isbn: document.getElementById('isbn').value,
                    synopsis: document.getElementById('synopsis').value,
                    imageUrl: finalImageBase64 
                };

                let fetchUrl = modeEditionId !== null ? `index.php/api/books/${modeEditionId}` : 'index.php/api/books';
                let fetchMethod = modeEditionId !== null ? 'PUT' : 'POST';

                fetch(fetchUrl, {
                    method: fetchMethod,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookData)
                })
                .then(response => response.json().then(data => ({ status: response.status, body: data })))
                .then(result => {
                    if (result.status === 201 || result.status === 200) {
                        alert("🎉 " + (result.body.message || "Livre enregistré avec succès !"));
                        
                        closeModal('addBookModal');
                        form.reset(); 
                        document.getElementById('existing_image_url').value = ''; 
                        document.getElementById('imagePreview').innerHTML = '<span>Aucune image sélectionnée</span>';
                        fetchBookStats(); // Recharge le tableau
                        
                    } else {
                        alert("❌ Erreur : " + result.body.erreur);
                    }
                })
                .catch(error => {
                    alert("❌ Erreur réseau. Vérifiez votre connexion au serveur.");
                    console.error(error);
                });
            };

            // CONVERSION DE L'IMAGE
            if (fileInput && fileInput.files.length > 0) {
                const reader = new FileReader();
                reader.onload = function(event) { envoyerAuServeur(event.target.result); };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                envoyerAuServeur(imageValue); 
            }
        });
    }
});

// =========================================================
// --- VARIABLES DE SCALABILITÉ (Pagination, Tri, Filtre) ---
// =========================================================
let currentPage = 1;
const itemsPerPage = 10; 
let currentSort = { column: null, order: 'asc' }; 

// Écouteurs d'événements pour la recherche et le filtre
document.getElementById('searchBookInput')?.addEventListener('input', () => { currentPage = 1; mettreAJourVue(); });
document.getElementById('filterCategoryInput')?.addEventListener('change', () => { currentPage = 1; mettreAJourVue(); });

// =========================================================
// --- CHARGEMENT ET VUE GLOBALE ---
// =========================================================
        
function fetchBookStats() {
    fetch('index.php/api/books')
        .then(res => res.json())
        .then(books => {
            adminCatalog = books;
            mettreAJourVue(); 
        })
        .catch(err => console.error("Erreur chargement livres", err));
}

// Gère la Recherche + Filtre + Tri + Pagination
function mettreAJourVue() {
    let filteredBooks = adminCatalog.filter(book => {
        const searchInput = document.getElementById('searchBookInput');
        const filterInput = document.getElementById('filterCategoryInput');
        
        const searchTxt = searchInput ? searchInput.value.toLowerCase() : '';
        const catFilter = filterInput ? filterInput.value : '';
        const bookCat = String(book.categoryId || book.category_id || book.category || '');

        const matchesSearch = (book.title && book.title.toLowerCase().includes(searchTxt)) ||
                              (book.author && book.author.toLowerCase().includes(searchTxt)) ||
                              (book.isbn && String(book.isbn).includes(searchTxt));
        
        const matchesCat = catFilter === "" || bookCat === catFilter;

        return matchesSearch && matchesCat;
    });

    if (currentSort.column) {
        filteredBooks.sort((a, b) => {
            let valA, valB;
            
            if (currentSort.column === 'title') { 
                valA = (a.title || '').toLowerCase(); valB = (b.title || '').toLowerCase(); 
            }
            if (currentSort.column === 'category') { 
                valA = parseInt(a.categoryId || a.category_id || a.category || 0); 
                valB = parseInt(b.categoryId || b.category_id || b.category || 0); 
            }
            if (currentSort.column === 'language') {
                valA = (a.languageName || a.language_name || "Français").toLowerCase();
                valB = (b.languageName || b.language_name || "Français").toLowerCase();
            }
            if (currentSort.column === 'stock') {
                valA = a.available_quantity !== undefined ? parseInt(a.available_quantity) : parseInt(a.totalQuantity || 0);
                valB = b.available_quantity !== undefined ? parseInt(b.available_quantity) : parseInt(b.totalQuantity || 0);
            }

            if (valA < valB) return currentSort.order === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBooks = filteredBooks.slice(startIndex, startIndex + itemsPerPage);

    afficherTableauLivres(paginatedBooks);
    afficherPagination(totalPages);
}

function trierTableau(column) {
    if (currentSort.column === column) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.order = 'asc';
    }
    mettreAJourVue();
}

function changerPage(page) {
    currentPage = page;
    mettreAJourVue();
}

// =========================================================
// --- AFFICHAGE HTML (TABLEAU) ---
// =========================================================

function afficherTableauLivres(listeLivres) {
    const tbody = document.getElementById('books-table-body');
    if(!tbody) return;
    
    tbody.innerHTML = ''; 

    if (listeLivres.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">Aucun livre ne correspond à votre recherche.</td></tr>';
        return;
    }

    // 💡 LE DICTIONNAIRE DE TRADUCTION DES CATÉGORIES
    const categoriesMap = {
        1: "Informatique", 2: "Roman", 3: "Sciences", 4: "Histoire", 5: "Philosophie"
    };

    // 💡 NOUVEAU : LE DICTIONNAIRE DES LANGUES
    const languagesMap = {
        1: "Français",
        2: "Anglais",
        3: "Arabe"
    };

    listeLivres.forEach(book => {
        const imageUrl = book.imageUrl || book.image_url || 'https://placehold.co/400x600/eeeeee/31343C?text=Livre';
        const stockDispo = book.available_quantity !== undefined ? book.available_quantity : book.totalQuantity;
        
        // Les IDs
        const catId = book.categoryId || book.category_id || book.category;
        const langId = book.languageId || book.language_id || book.language;

        // Les Traductions (On utilise la Map si le serveur ne renvoie pas le nom !)
        const categoryLabel = book.categoryName || book.category_name || categoriesMap[catId] || catId;
        
        // 🚨 LA LIGNE À CORRIGER EST ICI 🚨
        const langLabel = book.languageName || book.language_name || languagesMap[langId] || "Français";        
        
        const stockStyle = stockDispo <= 0 ? 'color: #ef4444;' : (stockDispo == 1 ? 'color: #f59e0b;' : 'color: #10b981;');
        
        const bookId = book.id || book.book_id;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${imageUrl}" alt="Couverture" style="width: 40px; height: 60px; object-fit: cover;"></td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${categoryLabel}</td>
            <td>${langLabel}</td>
            <td style="${stockStyle}">${stockDispo}</td>
            <td>
                <button onclick="preparerModification(${bookId})" style="padding: 4px 8px; margin-right: 5px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">✏️ Modifier</button>
                <button onclick="supprimerLivre(${bookId})" style="padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Supprimer</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

    


function afficherPagination(totalPages) {
    const paginationDiv = document.getElementById('admin-pagination');
    if(!paginationDiv) return;
    paginationDiv.innerHTML = '';

    if (totalPages <= 1) return;

    paginationDiv.innerHTML += `<button onclick="changerPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} style="padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};">&laquo;</button>`;

    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        paginationDiv.innerHTML += `<button onclick="changerPage(${i})" style="padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: ${isActive ? 'royalblue' : 'white'}; color: ${isActive ? 'white' : 'black'}; font-weight: ${isActive ? 'bold' : 'normal'}; cursor: pointer;">${i}</button>`;
    }

    paginationDiv.innerHTML += `<button onclick="changerPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} style="padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};">&raquo;</button>`;
}

// =========================================================
// --- ACTIONS : MODIFIER & SUPPRIMER ---
// =========================================================

function preparerModification(id) {
    const book = adminCatalog.find(b => (b.id === id || b.book_id === id));
    if(!book) return;

    // Remplir les champs du formulaire
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('category').value = book.categoryId || book.category_id || book.category || '';
    
    // NOUVEAU : Pré-remplir la langue
    const langSelect = document.getElementById('language');
    if(langSelect) {
        langSelect.value = book.languageId || book.language_id || book.language || '';
    }

    document.getElementById('quantity').value = book.totalQuantity;
    if(book.isbn) document.getElementById('isbn').value = book.isbn;
    if(book.synopsis) document.getElementById('synopsis').value = book.synopsis;
    
    // Gérer l'image
    document.getElementById('existing_image_url').value = book.imageUrl || book.image_url || '';
    document.getElementById('coverImage').value = ''; 
    
    // Mettre l'aperçu si l'image existe
    if (book.imageUrl || book.image_url) {
        document.getElementById('imagePreview').innerHTML = `<img src="${book.imageUrl || book.image_url}" alt="Aperçu">`;
    }
    
    // Changer l'interface de la modale en mode "Édition"
    document.querySelector('.modal-header h2').textContent = `Modifier : ${book.title}`;
    document.getElementById('submitBtn').textContent = "💾 Enregistrer les modifications";

    modeEditionId = id;
    
    openModal('addBookModal');
}

function supprimerLivre(id) {
    if(!confirm("Attention : Voulez-vous vraiment supprimer ce livre du catalogue ?")) return;

    fetch(`index.php/api/books/${id}`, { method: 'DELETE' })
        .then(res => res.json().then(data => ({status: res.status, body: data})))
        .then(res => {
            if(res.status === 200) {
                alert("✅ " + res.body.message);
                fetchBookStats(); 
            } else {
                alert("❌ Erreur : " + res.body.erreur);
            }
        });
}

// =========================================================
// --- COMPORTEMENT DE LA FENÊTRE MODALE & UPLOAD ---
// =========================================================

function openModal(modalId) {
    if (modeEditionId === null) {
        document.querySelector('.modal-header h2').textContent = "Ajouter un nouveau livre";
        document.getElementById('submitBtn').textContent = "Enregistrer le livre";
        document.getElementById('imagePreview').innerHTML = '<span>Aucune image sélectionnée</span>';
        document.getElementById('existing_image_url').value = '';
    }

    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = 'auto'; 
    modeEditionId = null; 
    document.getElementById('addBookForm').reset(); 
    document.getElementById('newCategoryName').value = '';
    
    // NOUVEAU : Réinitialiser aussi le champ de la nouvelle langue
    const langInput = document.getElementById('newLanguageName');
    if(langInput) {
        langInput.value = '';
        langInput.style.display = 'none';
        langInput.required = false;
    }
}

// Fermer en cliquant en dehors
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
}); // <--- C'EST ICI QU'IL MANQUAIT LA PARENTHÈSE FERMANTE !

// Aperçu de l'image
function previewImage(event) {
    const previewContainer = document.getElementById('imagePreview');
    const file = event.target.files[0];

    if (file) {
        if (!file.type.match('image.*')) {
            previewContainer.innerHTML = `<span style="color: red;">Veuillez sélectionner une image (JPG, PNG).</span>`;
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = `<img src="${e.target.result}" alt="Aperçu du livre">`;
        }
        reader.readAsDataURL(file);
    } else {
        previewContainer.innerHTML = `<span>Aucune image sélectionnée</span>`;
    }
}

// Affiche le champ texte si l'admin veut créer une nouvelle catégorie
function gererNouvelleCategorie() {
    const select = document.getElementById('category');
    const inputNouvelleCat = document.getElementById('newCategoryName');
    
    if (select.value === 'NEW') {
        inputNouvelleCat.style.display = 'block';
        inputNouvelleCat.required = true; 
    } else {
        inputNouvelleCat.style.display = 'none';
        inputNouvelleCat.required = false;
        inputNouvelleCat.value = ''; 
    }
}

// Affiche le champ texte si l'admin veut créer une nouvelle langue
function gererNouvelleLangue() {
    const select = document.getElementById('language');
    const inputNouvelleLangue = document.getElementById('newLanguageName');
    
    if (select.value === 'NEW') {
        inputNouvelleLangue.style.display = 'block';
        inputNouvelleLangue.required = true;
    } else {
        inputNouvelleLangue.style.display = 'none';
        inputNouvelleLangue.required = false;
        inputNouvelleLangue.value = ''; 
    }
}