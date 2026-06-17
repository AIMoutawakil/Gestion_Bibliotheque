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
                'book_id' => $book->getId(),
                'title' => $book->getTitle(),
                'author' => $book->getAuthor(),
                'description' => $book->getDescription(),
                'totalQuantity' => $book->getTotalQuantity(),
                'total_quantity' => $book->getTotalQuantity(),
                'availableQuantity' => $book->getAvailableQuantity(),
                'available_quantity' => $book->getAvailableQuantity(),
                'isAvailable' => $book->getAvailableQuantity() > 0,
                'categoryId' => $book->getCategoryId(),
                'categoryName' => $book->getCategoryName(),
                'imageUrl' => $book->getImageUrl(),
                'image_url' => $book->getImageUrl(),
                'languageId' => $book->getLanguageId(), 
                'languageName' => $book->getLanguageName(),
                'isbn' => method_exists($book, 'getIsbn') ? $book->getIsbn() : null
            ];
        }
        echo json_encode($booksArray);
    }

    public function getBook(int $id): void {
        $book = $this->bookRepository->getBook($id);
        
        if ($book) {
            echo json_encode([
                'id' => $book->getId(),
                'book_id' => $book->getId(),
                'title' => $book->getTitle(),
                'author' => $book->getAuthor(),
                'description' => $book->getDescription(),
                'totalQuantity' => $book->getTotalQuantity(),
                'total_quantity' => $book->getTotalQuantity(),
                'availableQuantity' => $book->getAvailableQuantity(),
                'available_quantity' => $book->getAvailableQuantity(),
                'isAvailable' => $book->getAvailableQuantity() > 0,
                'categoryId' => $book->getCategoryId(),
                'categoryName' => $book->getCategoryName(),
                'imageUrl' => $book->getImageUrl(),
                'image_url' => $book->getImageUrl(),
                'languageId' => $book->getLanguageId(),
                'languageName' => $book->getLanguageName(),
                'isbn' => method_exists($book, 'getIsbn') ? $book->getIsbn() : null
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["erreur" => "Livre non trouvé"]);
        }
    }

    private function processImageUpload(?string $imageData): ?string {
        if ($imageData && strpos($imageData, 'data:image') === 0) {
            $parts = explode(',', $imageData);
            $fileData = base64_decode($parts[1]);
            
            $fileName = uniqid('book_') . '.jpg'; 
            $uploadDir = __DIR__ . '/../../public/images/';
            
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            file_put_contents($uploadDir . $fileName, $fileData);
            return 'images/' . $fileName;
        }
        return $imageData; 
    }

    public function createBook(): void {
        $role = $_SESSION['user_role'] ?? $_SESSION['role'] ?? '';
        if ($role !== 'ADMIN') {
            http_response_code(403); echo json_encode(["erreur" => "Accès refusé."]); return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        
        if (empty($data['title']) || empty($data['author']) || empty($data['categoryId'])) {
            http_response_code(400); echo json_encode(["erreur" => "Champs obligatoires manquants."]); return;
        }

        // =========================================================
        // 🪄 MAGIE AVEC CAPTURE D'ERREUR POUR LA CATÉGORIE
        // =========================================================
        if ($data['categoryId'] === 'NEW') {
            if (empty($data['newCategoryName'])) {
                http_response_code(400); echo json_encode(["erreur" => "Le nom de la nouvelle catégorie est requis."]); return;
            }
            try {
                $nouvelId = $this->bookRepository->addCategory($data['newCategoryName']);
                $data['categoryId'] = $nouvelId;
            } catch (PDOException $e) {
                http_response_code(500); echo json_encode(["erreur" => "Erreur SQL Catégorie: " . $e->getMessage()]); return;
            }
        }

        // 🪄 MAGIE AVEC CAPTURE D'ERREUR POUR LA LANGUE
        if (isset($data['languageId']) && $data['languageId'] === 'NEW') {
            if (empty($data['newLanguageName'])) {
                http_response_code(400); echo json_encode(["erreur" => "Nom de la langue requis."]); return;
            }
            try {
                $nouvelIdLangue = $this->bookRepository->addLanguage($data['newLanguageName']);
                $data['languageId'] = $nouvelIdLangue;
            } catch (PDOException $e) {
                http_response_code(500); echo json_encode(["erreur" => "Erreur SQL Langue: " . $e->getMessage()]); return;
            }
        }   
        // =========================================================

        $finalImageUrl = $this->processImageUpload($data['imageUrl'] ?? null);
        $description = $data['synopsis'] ?? '';
        $isbn = $data['isbn'] ?? null;

        $book = new Book(
            $data['title'], 
            $data['author'], 
            $description, 
            (int)$data['totalQuantity'], 
            (int)$data['totalQuantity'], 
            null, 
            (int)$data['categoryId'], 
            null, 
            $finalImageUrl,
            isset($data['languageId']) ? (int)$data['languageId'] : null,
            null,
            $isbn  
        );

        try {
            if ($this->bookRepository->addBook($book, $isbn)) {
                http_response_code(201); echo json_encode(["message" => "Livre ajouté avec succès !"]);
            } else {
                http_response_code(500); echo json_encode(["erreur" => "Erreur inconnue lors de l'ajout en base de données."]);
            }
        } catch (PDOException $e) {
            http_response_code(500); echo json_encode(["erreur" => "Erreur SQL Livre: " . $e->getMessage()]);
        }
    }

    public function deleteBook(int $id): void {
        $role = $_SESSION['user_role'] ?? $_SESSION['role'] ?? '';
        if ($role !== 'ADMIN') {
            http_response_code(403); echo json_encode(["erreur" => "Accès refusé."]); return;
        }

        try {
            $this->bookRepository->deleteBook($id);
            echo json_encode(["message" => "Livre supprimé avec succès !"]);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(["erreur" => "Impossible de supprimer ce livre car il existe dans l'historique des emprunts."]);
        }
    }

    public function updateBook(int $id): void {
        $role = $_SESSION['user_role'] ?? $_SESSION['role'] ?? '';
        if ($role !== 'ADMIN') {
            http_response_code(403); echo json_encode(["erreur" => "Accès refusé."]); return;
        }
        $data = json_decode(file_get_contents("php://input"), true);
        
        try {
            if ($data['categoryId'] === 'NEW' && !empty($data['newCategoryName'])) {
                $data['categoryId'] = $this->bookRepository->addCategory($data['newCategoryName']);
            }
            if (isset($data['languageId']) && $data['languageId'] === 'NEW' && !empty($data['newLanguageName'])) {
                $data['languageId'] = $this->bookRepository->addLanguage($data['newLanguageName']);
            }
        } catch (PDOException $e) {
            http_response_code(500); echo json_encode(["erreur" => "Erreur SQL lors de l'ajout de la catégorie/langue: " . $e->getMessage()]); return;
        }

        $finalImageUrl = $this->processImageUpload($data['imageUrl'] ?? null);
        $description = $data['synopsis'] ?? '';
        $isbn = $data['isbn'] ?? null;
        
        try {
            if ($this->bookRepository->updateBook(
                $id, 
                $data['title'], 
                $data['author'], 
                $description, 
                (int)$data['categoryId'], 
                isset($data['languageId']) ? (int)$data['languageId'] : 1, 
                (int)$data['totalQuantity'], 
                $finalImageUrl ?? '',
                $isbn
            )) {
                echo json_encode(["message" => "Livre mis à jour !"]);
            } else {
                http_response_code(500); echo json_encode(["erreur" => "Erreur lors de la modification."]);
            }
        } catch (PDOException $e) {
            http_response_code(500); echo json_encode(["erreur" => "Erreur SQL Modification: " . $e->getMessage()]);
        }
    }
}