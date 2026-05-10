// public/js/details.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Récupérer l'ID dans l'URL (ex: details.html?id=3)
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (!bookId) {
        // Redirection sécurité si aucun ID n'est fourni
        window.location.href = 'catalogue.html';
        return;
    }

    // 2. Lancer la requête vers la base de données
    fetchBookDetails(bookId);
});

// --- REQUÊTE POUR RÉCUPÉRER LE LIVRE ---
function fetchBookDetails(id) {
    fetch('index.php/api/books/' + id)
        .then(response => {
            if (!response.ok) throw new Error('Livre non trouvé');
            return response.json();
        })
        .then(book => {
            // On envoie les données du livre à notre belle fonction d'affichage
            afficherDetailsLivre(book);
        })
        .catch(error => {
            console.error(error);
            document.getElementById('book-title').textContent = "Erreur de chargement";
            document.getElementById('book-synopsis').textContent = "Impossible de charger les détails de ce livre. Vérifiez votre connexion.";
        });
}

// --- AFFICHAGE DANS LE NOUVEAU DESIGN ---
function afficherDetailsLivre(book) {
    // Gestion des données manquantes (au cas où la BDD n'a pas tout)
    const imageUrl = book.image_url || book.imageUrl || 'https://placehold.co/400x600/eeeeee/31343C?text=Image';
    const description = book.description || book.synopsis || "Aucune description disponible pour ce livre.";
    const category = book.category_name || book.category || "Non classé";
    const title = book.title || "Titre inconnu";
    const author = book.author || "Auteur inconnu";

    // 1. Le Fil d'Ariane
    document.getElementById('bread-category').textContent = category;
    document.getElementById('bread-title').textContent = title;

    // 2. Infos principales
    document.getElementById('book-cover').src = imageUrl;
    document.getElementById('book-title').textContent = title;
    document.getElementById('book-author').textContent = author;

    // 3. Les petites métadonnées
    document.getElementById('meta-year').textContent = book.year || "-";
    document.getElementById('meta-pages').textContent = book.pages || "-";
    document.getElementById('meta-lang').textContent = book.language || "Français";
    document.getElementById('meta-isbn').textContent = book.isbn || "-";
    
    // 4. Le résumé
    document.getElementById('book-synopsis').textContent = description;

    // 5. GESTION DU BOUTON ET DU STOCK
    const statusDiv = document.getElementById('book-status');
    const btnAction = document.getElementById('btn-action');
    const userJson = sessionStorage.getItem('user'); // Vérifier si l'étudiant est connecté

    // Combien en reste-t-il ?
    const stockDispo = book.availableQuantity !== undefined ? parseInt(book.availableQuantity) : parseInt(book.stock || 0);
    const idLivre = book.id || book.book_id;

    if (book.isAvailable || stockDispo > 0) {
        // LE LIVRE EST LÀ
        statusDiv.className = "details-status dispo";
        statusDiv.innerHTML = `🟢 Disponible (${stockDispo} exemplaires)`;

        if (userJson) {
            // Étudiant connecté : Bouton actif !
            btnAction.textContent = "Emprunter ce livre";
            btnAction.disabled = false;
            btnAction.style.background = "royalblue";
            btnAction.onclick = () => emprunterLivre(idLivre);
        } else {
            // Pas connecté : On grise le bouton
            btnAction.textContent = "Connectez-vous pour emprunter";
            btnAction.disabled = true;
            btnAction.style.background = "#94a3b8"; 
        }
    } else {
        // RUPTURE DE STOCK
        statusDiv.className = "details-status indispo";
        statusDiv.innerHTML = `🔴 Indisponible (Rupture de stock)`;
        btnAction.textContent = "Livre indisponible";
        btnAction.disabled = true;
        btnAction.style.background = "#ef4444"; // Rouge pour bien montrer l'indisponibilité
    }

    // 6. Les petits Tags en bas (Optionnel)
    const tagsContainer = document.getElementById('book-tags');
    if (tagsContainer) {
        tagsContainer.innerHTML = `<span class="tag-pill">${category}</span>`;
    }
}

// --- FONCTION POUR EMPRUNTER (Ton API) ---
function emprunterLivre(bookId) {
    // On change le texte du bouton pendant que ça charge pour éviter les doubles clics
    const btnAction = document.getElementById('btn-action');
    btnAction.textContent = "Emprunt en cours...";
    btnAction.disabled = true;

    fetch('index.php/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(result => {
        if (result.status === 200 || result.status === 201) {
            alert("🎉 Succès : " + (result.body.message || "Livre emprunté avec succès !"));
            // On recharge la page pour voir le stock diminuer !
            window.location.reload(); 
        } else {
            alert("❌ Erreur : " + result.body.erreur);
            // On remet le bouton à la normale s'il y a eu une erreur
            btnAction.textContent = "Emprunter ce livre";
            btnAction.disabled = false;
        }
    })
    .catch(error => {
        alert("❌ Erreur réseau lors de l'emprunt.");
        btnAction.textContent = "Emprunter ce livre";
        btnAction.disabled = false;
    });
}