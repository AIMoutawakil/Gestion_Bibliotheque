// public/js/admin.js

// --- VARIABLES GLOBALES ---
let adminBorrowingsList = []; 
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

    // 2. CHARGEMENT DES DONNÉES INITIALES
    fetchAdminBorrowings();
    fetchBookStats();

    // 3. GESTION DU FORMULAIRE AVEC UPLOAD D'IMAGE
    const form = document.getElementById('add-book-form');
    const alertBox = document.getElementById('admin-alert');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('image_file');
            let imageValue = document.getElementById('existing_image_url').value;

            // La fonction qui envoie les données à PHP
            const envoyerAuServeur = (finalImageBase64) => {
                const bookData = {
                    title: document.getElementById('title').value,
                    author: document.getElementById('author').value,
                    categoryId: document.getElementById('category_id').value,
                    totalQuantity: document.getElementById('total_quantity').value,
                    imageUrl: finalImageBase64 // Soit le fichier converti, soit l'ancienne URL
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
                    alertBox.classList.remove('d-none', 'alert-danger', 'alert-success');
                    
                    if (result.status === 201 || result.status === 200) {
                        alertBox.classList.add('alert-success');
                        alertBox.textContent = "🎉 " + result.body.message;
                        form.reset(); 
                        document.getElementById('existing_image_url').value = ''; 
                        fetchBookStats(); 
                        
                        if (modeEditionId !== null) {
                            modeEditionId = null;
                            document.querySelector('.card-header.bg-success h5').innerHTML = `➕ Ajouter un nouveau livre`;
                            const btnSubmit = document.querySelector('#add-book-form button[type="submit"]');
                            btnSubmit.textContent = "Enregistrer le livre dans le catalogue";
                            btnSubmit.classList.replace('btn-warning', 'btn-success');
                        }
                    } else {
                        alertBox.classList.add('alert-danger');
                        alertBox.textContent = "❌ Erreur : " + result.body.erreur;
                    }
                })
                .catch(error => {
                    alertBox.classList.remove('d-none');
                    alertBox.classList.add('alert-danger');
                    alertBox.textContent = "❌ Erreur réseau. Vérifiez votre connexion.";
                });
            };

            // LE TOUR DE MAGIE : Conversion du fichier image
            if (fileInput && fileInput.files.length > 0) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    envoyerAuServeur(event.target.result); 
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                envoyerAuServeur(imageValue); 
            }
        });
    }

    // 4. MOTEURS DE RECHERCHE "LIVE"
    const searchInput = document.getElementById('search-book');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const motCle = e.target.value.toLowerCase();
            const livresFiltres = adminCatalog.filter(book => 
                book.title.toLowerCase().includes(motCle) || 
                book.author.toLowerCase().includes(motCle)
            );
            afficherTableauLivres(livresFiltres);
        });
    }

    const searchBorrowing = document.getElementById('search-borrowing');
    if (searchBorrowing) {
        searchBorrowing.addEventListener('input', function(e) {
            const motCle = e.target.value.toLowerCase();
            const empruntsFiltres = adminBorrowingsList.filter(b => 
                b.user_name.toLowerCase().includes(motCle) || 
                b.user_email.toLowerCase().includes(motCle) ||
                b.book_title.toLowerCase().includes(motCle)
            );
            afficherTableauEmprunts(empruntsFiltres);
        });
    }
});

// =========================================================
// --- FONCTIONS DU CATALOGUE ---
// =========================================================

function fetchBookStats() {
    fetch('index.php/api/books')
        .then(res => res.json())
        .then(books => {
            adminCatalog = books;
            document.getElementById('stat-books').textContent = books.length;
            afficherTableauLivres(adminCatalog); 
        });
}

function afficherTableauLivres(listeLivres) {
    const tbody = document.getElementById('admin-books-list');
    if(!tbody) return;
    
    tbody.innerHTML = ''; 

    if (listeLivres.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">Aucun livre ne correspond à votre recherche.</td></tr>';
        return;
    }

    listeLivres.forEach(book => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${book.title}</strong><br><small class="text-muted">${book.author}</small></td>
                <td><span class="badge bg-secondary">${book.totalQuantity} total</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="preparerModification(${book.id})">✏️</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="supprimerLivre(${book.id})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

function preparerModification(id) {
    const book = adminCatalog.find(b => b.id === id);
    if(!book) return;

    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('category_id').value = book.categoryId;
    document.getElementById('total_quantity').value = book.totalQuantity;
    
    // NOUVEAU : On gère l'image pour la modification
    document.getElementById('existing_image_url').value = book.imageUrl || '';
    document.getElementById('image_file').value = ''; 
    
    document.querySelector('.card-header.bg-success h5').innerHTML = `✏️ Modifier : ${book.title}`;
    const btnSubmit = document.querySelector('#add-book-form button[type="submit"]');
    btnSubmit.textContent = "💾 Enregistrer les modifications";
    btnSubmit.classList.replace('btn-success', 'btn-warning');

    modeEditionId = id;
    window.scrollTo(0, document.getElementById('add-book-form').offsetTop);
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
// --- FONCTIONS DES EMPRUNTS ---
// =========================================================

function fetchAdminBorrowings() {
    fetch('index.php/api/admin/borrowings')
        .then(async res => {
            const text = await res.text();
            try { return JSON.parse(text); } 
            catch (e) { throw new Error("Crash PHP : " + text); }
        })
        .then(borrowings => {
            if (borrowings.erreur) throw new Error(borrowings.erreur);

            adminBorrowingsList = borrowings; 

            let enCoursCount = 0;
            let enRetardCount = 0;
            const today = new Date().toISOString().split('T')[0];

            borrowings.forEach(b => {
                if (b.return_date === null || b.return_date === '0000-00-00') {
                    if (b.due_date && b.due_date !== '0000-00-00' && b.due_date < today) {
                        enRetardCount++;
                    } else {
                        enCoursCount++;
                    }
                }
            });

            document.getElementById('stat-borrowed').textContent = enCoursCount;
            document.getElementById('stat-late').textContent = enRetardCount;

            afficherTableauEmprunts(adminBorrowingsList);
        })
        .catch(err => {
            document.getElementById('admin-borrowings-table').innerHTML = `
                <tr><td colspan="6" class="text-danger p-3"><strong>Erreur :</strong><br>${err.message}</td></tr>
            `;
        });
}

function afficherTableauEmprunts(liste) {
    const tbody = document.getElementById('admin-borrowings-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (liste.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Aucun emprunt ne correspond à votre recherche.</td></tr>';
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    liste.forEach(b => {
        const dateEmprunt = new Date(b.borrow_date).toLocaleDateString('fr-FR');
        const dateLimite = b.due_date && b.due_date !== '0000-00-00' ? new Date(b.due_date).toLocaleDateString('fr-FR') : '-';

        let badge = '';
        let actionBtn = '';

        if (b.return_date === null || b.return_date === '0000-00-00') {
            if (b.due_date && b.due_date !== '0000-00-00' && b.due_date < today) {
                badge = `<span class="badge bg-danger">En retard</span>`;
            } else {
                badge = `<span class="badge bg-primary">En cours</span>`;
            }
            actionBtn = `<button class="btn btn-sm btn-outline-success" onclick="marquerRendu(${b.id})">Restituer</button>`;
        } else {
            badge = `<span class="badge bg-success">Rendu</span>`;
            actionBtn = `<span class="text-muted small">Le ${new Date(b.return_date).toLocaleDateString('fr-FR')}</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>${b.user_name}</strong><br><small class="text-muted">${b.user_email}</small></td>
                <td>${b.book_title}</td>
                <td>${dateEmprunt}</td>
                <td class="${badge.includes('danger') ? 'text-danger fw-bold' : ''}">${dateLimite}</td>
                <td>${badge}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });
}

function marquerRendu(borrowingId) {
    if (!confirm("Voulez-vous vraiment marquer ce livre comme rendu ? Le stock augmentera de 1.")) return; 

    fetch(`index.php/api/admin/borrowings/${borrowingId}/return`, { method: 'POST' })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(result => {
        if (result.status === 200) {
            alert("✅ " + result.body.message);
            fetchAdminBorrowings(); 
        } else {
            alert("❌ Erreur : " + result.body.erreur);
        }
    });
}