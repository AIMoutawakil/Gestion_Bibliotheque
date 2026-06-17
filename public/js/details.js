// Variable globale pour mémoriser le stock du livre affiché
let maxStockGlobal = 0; 

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (!bookId) {
        window.location.href = 'catalogue.html';
        return;
    }

    fetchBookDetails(bookId);
});

// --- REQUÊTE POUR RÉCUPÉRER LE LIVRE ---
function fetchBookDetails(id) {
    const timestamp = new Date().getTime(); 
    fetch(`index.php/api/books?t=${timestamp}`)
        .then(response => {
            if (!response.ok) throw new Error('Erreur de chargement');
            return response.json();
        })
        .then(books => {
            const book = books.find(b => (b.id == id || b.book_id == id));
            if (!book) throw new Error('Livre non trouvé dans le catalogue');
            afficherDetailsLivre(book);
        })
        .catch(error => {
            console.error(error);
            document.getElementById('book-title').textContent = "Livre introuvable";
            document.getElementById('book-synopsis').textContent = "Impossible de charger les détails.";
        });
}

// --- AFFICHAGE DANS LE DESIGN ---
function afficherDetailsLivre(book) {
    const imageUrl = book.image_url || book.imageUrl || 'https://placehold.co/400x600/eeeeee/31343C?text=Image';
    const category = book.category_name || book.categoryName || "Général";
    const title = book.title || "Titre inconnu";
    const author = book.author || "Auteur inconnu";
    const idLivre = book.id || book.book_id;

    document.getElementById('bread-category').textContent = category;
    document.getElementById('bread-title').textContent = title;
    document.getElementById('book-cover').src = imageUrl;
    document.getElementById('book-title').textContent = title;
    document.getElementById('book-author').textContent = author;

    const year = book.year || book.annee_publication;
    if (year && year.toString().trim() !== "") {
        document.getElementById('tag-year').style.display = 'inline-block';
        document.getElementById('meta-year').textContent = year;
    } else {
        document.getElementById('tag-year').style.display = 'none';
    }

    const pages = book.pages;
    if (pages && pages.toString().trim() !== "") {
        document.getElementById('tag-pages').style.display = 'inline-block';
        document.getElementById('meta-pages').textContent = pages;
    } else {
        document.getElementById('tag-pages').style.display = 'none';
    }

    const language = book.language_name || book.languageName;
    if (language && language.trim() !== "") {
        document.getElementById('tag-lang').style.display = 'inline-block';
        document.getElementById('meta-lang').textContent = language;
    } else {
        document.getElementById('tag-lang').style.display = 'none';
    }

    const isbn = book.isbn;
    if (isbn && isbn.trim() !== "" && isbn !== "N/A") {
        document.getElementById('tag-isbn').style.display = 'inline-block';
        document.getElementById('meta-isbn').textContent = isbn;
    } else {
        document.getElementById('tag-isbn').style.display = 'none';
    }

    const description = book.description || book.synopsis;
    if (description && description.trim() !== "") {
        document.getElementById('title-synopsis').style.display = 'block';
        document.getElementById('book-synopsis').style.display = 'block';
        document.getElementById('book-synopsis').textContent = description;
    } else {
        document.getElementById('title-synopsis').style.display = 'none';
        document.getElementById('book-synopsis').style.display = 'none';
    }

    const statusDiv = document.getElementById('book-status');
    const userJson = sessionStorage.getItem('user'); 

    if(statusDiv) statusDiv.style.display = 'none';

    maxStockGlobal = book.available_quantity !== undefined ? parseInt(book.available_quantity) : parseInt(book.totalQuantity || 0);

    mettreAJourInterfaceAction(idLivre, userJson);
}

// --- MISE À JOUR DE L'INTERFACE D'ACTION ---
function mettreAJourInterfaceAction(idLivre, userJson) {
    const controlsDiv = document.getElementById('action-controls');

    if (maxStockGlobal > 0) {
        if (userJson) {
            // Étudiant connecté : Design propre sans + ni -
            controlsDiv.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <span style="color: #64748b; font-weight: 600;">Stock restant : </span>
                    <strong id="stock-display" style="color: #1e293b; font-size: 1.1rem;">${maxStockGlobal}</strong>
                </div>
                <button id="btn-action" class="btn-action" style="width: 100%; padding: 12px; font-size: 1.1rem; font-weight: bold; background: royalblue; color: white; border: none; border-radius: 8px; cursor: pointer;" onclick="emprunterLivre(${idLivre})">Confirmer l'emprunt</button>
            `;
        } else {
            // Pas connecté
            controlsDiv.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <span style="color: #64748b; font-weight: 600;">Stock restant : </span>
                    <strong style="color: #1e293b; font-size: 1.1rem;">${maxStockGlobal}</strong>
                </div>
                <button class="btn-action" style="background: #94a3b8; width: 100%; padding: 12px; font-size: 1.1rem; font-weight: bold; color: white; border: none; border-radius: 8px; cursor: pointer;" onclick="window.location.href='login.html'">Connectez-vous pour emprunter</button>
            `;
        }
    } else {
        // Rupture de stock
        controlsDiv.innerHTML = `
            <div style="margin-bottom: 20px; color: #ef4444; font-weight: 600;">
                Rupture de stock
            </div>
            <button class="btn-action" style="background: #cbd5e1; width: 100%; padding: 12px; font-size: 1.1rem; font-weight: bold; color: white; border: none; border-radius: 8px; cursor: not-allowed;" disabled>Livre indisponible</button>
        `;
    }
}

// --- FONCTION POUR EMPRUNTER (SÉCURISÉE) ---
function emprunterLivre(bookId) {
    const btnAction = document.getElementById('btn-action');
    
    // On force la quantité à 1 !
    const qtyAEmprunter = 1; 

    // Bouton en mode "Chargement"
    btnAction.textContent = "⏳ Emprunt en cours...";
    btnAction.disabled = true;
    btnAction.style.opacity = "0.7";

    fetch('index.php/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            book_id: bookId,
            quantity: qtyAEmprunter 
        })
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.erreur || "Erreur d'emprunt");
        return data;
    })
    .then(data => {
        alert(`🎉 Succès : Livre emprunté !\n⏳ Vous avez 15 jours pour le restituer.`);
        
        // On diminue le stock en temps réel sur la page
        maxStockGlobal -= qtyAEmprunter;
        
        const userJson = sessionStorage.getItem('user'); 
        mettreAJourInterfaceAction(bookId, userJson);

    })
    .catch(error => {
        alert("❌ Erreur : " + error.message);
        btnAction.textContent = "Confirmer l'emprunt";
        btnAction.disabled = false;
        btnAction.style.opacity = "1";
    });
}