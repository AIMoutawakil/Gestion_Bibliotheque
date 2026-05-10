<?php
// src/Controller/BookController.php

require_once __DIR__ . '/../Repository/BookRepository.php';

class BookController {
    private BookRepository $bookRepository;

    public function __construct() {
        $this->bookRepository = new BookRepository();
    }

public function getAllBooks(): void {
        $books = $this->bookRepository->getAllBooks();
        $booksArray = [];
        
        foreach ($books as $book) {
            $booksArray[] = [
                'id' => $book->getId(),
                'title' => $book->getTitle(),
                'author' => $book->getAuthor(),
                'description' => $book->getDescription(),
                'totalQuantity' => $book->getTotalQuantity(),
                'availableQuantity' => $book->getAvailableQuantity(),
                'isAvailable' => $book->getAvailableQuantity() > 0,
                'categoryId' => $book->getCategoryId(),
                'categoryName' => $book->getCategoryName(),
                'imageUrl' => $book->getImageUrl(),
                // 👇 LES DEUX LIGNES MANQUANTES SONT ICI 👇
                'languageId' => $book->getLanguageId(), 
                'languageName' => $book->getLanguageName()
            ];
        }
        echo json_encode($booksArray);
    }

    public function getBook(int $id): void {
        $book = $this->bookRepository->getBook($id);
        
        if ($book) {
            echo json_encode([
                'id' => $book->getId(),
                'title' => $book->getTitle(),
                'author' => $book->getAuthor(),
                'description' => $book->getDescription(),
                'totalQuantity' => $book->getTotalQuantity(),
                'availableQuantity' => $book->getAvailableQuantity(),
                'isAvailable' => $book->getAvailableQuantity() > 0,
                'categoryId' => $book->getCategoryId(),
                'categoryName' => $book->getCategoryName(),
                'imageUrl' => $book->getImageUrl(),
                // 👇 AJOUTE ÇA ICI AUSSI 👇
                'languageId' => $book->getLanguageId(),
                'languageName' => $book->getLanguageName()
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["erreur" => "Livre non trouvé"]);
        }
    }

// --- FONCTION MAGIQUE : Sauvegarder l'image ---
    private function processImageUpload(?string $imageData): ?string {
        if ($imageData && strpos($imageData, 'data:image') === 0) {
            // 1. On sépare les données du format
            $parts = explode(',', $imageData);
            $fileData = base64_decode($parts[1]);
            
            // 2. On crée un nom unique pour ne pas écraser les autres photos
            $fileName = uniqid('book_') . '.jpg'; 
            $uploadDir = __DIR__ . '/../../public/images/';
            
            // 3. On crée le dossier images/ s'il n'existe pas encore
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            // 4. On sauvegarde le vrai fichier sur le disque dur !
            file_put_contents($uploadDir . $fileName, $fileData);
            
            // 5. On retourne le chemin pour la base de données
            return 'images/' . $fileName;
        }
        return $imageData; // Si ce n'est pas un fichier (ex: ancienne URL), on laisse tel quel
    }

public function createBook(): void {
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'ADMIN') {
            http_response_code(403); echo json_encode(["erreur" => "Accès refusé."]); return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        
        if (empty($data['title']) || empty($data['author']) || empty($data['categoryId'])) {
            http_response_code(400); echo json_encode(["erreur" => "Champs obligatoires manquants."]); return;
        }

        // =========================================================
        // 🪄 LE TOUR DE MAGIE POUR LA NOUVELLE CATÉGORIE
        // =========================================================
        if ($data['categoryId'] === 'NEW') {
            if (empty($data['newCategoryName'])) {
                http_response_code(400); 
                echo json_encode(["erreur" => "Le nom de la nouvelle catégorie est requis."]); 
                return;
            }
            
            // On appelle la fonction pour créer la catégorie dans la base
            $nouvelId = $this->bookRepository->addCategory($data['newCategoryName']);
            
            // On remplace le mot "NEW" par le vrai chiffre (l'ID)
            $data['categoryId'] = $nouvelId;
        }

        // 🪄 MAGIE POUR LA NOUVELLE LANGUE
        if ($data['languageId'] === 'NEW') {
            if (empty($data['newLanguageName'])) {
                http_response_code(400); echo json_encode(["erreur" => "Nom de la langue requis."]); return;
            }
            $nouvelIdLangue = $this->bookRepository->addLanguage($data['newLanguageName']);
            $data['languageId'] = $nouvelIdLangue;
        }   
        // =========================================================

        // On traite l'image uploadée
        $finalImageUrl = $this->processImageUpload($data['imageUrl'] ?? null);

        // On récupère le résumé (synopsis) envoyé par le formulaire
        $description = $data['synopsis'] ?? '';

        // Création de l'objet Book (le categoryId est maintenant garanti d'être un chiffre)
            $book = new Book(
            $data['title'], 
            $data['author'], 
            $data['synopsis'] ?? '', 
            (int)$data['totalQuantity'], 
            (int)$data['totalQuantity'], 
            null, 
            (int)$data['categoryId'], 
            null, 
            $finalImageUrl,
            (int)$data['languageId'] 
        );

        if ($this->bookRepository->addBook($book)) {
            http_response_code(201); echo json_encode(["message" => "Livre ajouté avec succès !"]);
        } else {
            http_response_code(500); echo json_encode(["erreur" => "Erreur de base de données."]);
        }
    }
    // Supprimer (Réservé Admin)
    public function deleteBook(int $id): void {
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'ADMIN') {
            http_response_code(403); echo json_encode(["erreur" => "Accès refusé."]); return;
        }

        try {
            $this->bookRepository->deleteBook($id);
            echo json_encode(["message" => "Livre supprimé avec succès !"]);
        } catch (PDOException $e) {
            // Sécurité SQL : Si le livre a déjà été emprunté, MySQL bloquera la suppression (Clé étrangère).
            http_response_code(400);
            echo json_encode(["erreur" => "Impossible de supprimer ce livre car il existe dans l'historique des emprunts."]);
        }
    }

    // Modifier (Réservé Admin)
    public function updateBook(int $id): void {
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'ADMIN') {
            http_response_code(403); echo json_encode(["erreur" => "Accès refusé."]); return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        
        // On traite l'image uploadée (ou on garde l'ancienne)
        $finalImageUrl = $this->processImageUpload($data['imageUrl'] ?? null);
        
        if ($this->bookRepository->updateBook($id, $data['title'], $data['author'], (int)$data['categoryId'], (int)$data['totalQuantity'], $finalImageUrl ?? '')) {
            echo json_encode(["message" => "Livre mis à jour !"]);
        } else {
            http_response_code(500); echo json_encode(["erreur" => "Erreur lors de la modification."]);
        }
    }
}