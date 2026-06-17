<?php
// src/Repository/BookRepository.php

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../Model/Book.php';

class BookRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAllBooks(): array {
        $stmt = $this->db->query("
        SELECT b.*, c.name as category_name, l.name as language_name 
        FROM books b 
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN languages l ON b.language_id = l.id
        ");
        $booksData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $books = [];
        foreach ($booksData as $data) {
            $books[] = new Book(
                $data['title'],
                $data['author'],
                $data['description'],
                $data['total_quantity'],
                $data['available_quantity'],
                $data['id'],
                $data['category_id'],
                $data['category_name'],
                $data['image_url'],
                $data['language_id'],
                $data['language_name'],
                $data['isbn'] ?? null // <-- Récupération de l'ISBN
            );
        }
        return $books;
    }

    public function getBook(int $id): ?Book {
        $stmt = $this->db->prepare("
            SELECT b.*, c.name as category_name, l.name as language_name
            FROM books b 
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN languages l ON b.language_id = l.id
            WHERE b.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) return null;

        return new Book(
            $data['title'],
            $data['author'],
            $data['description'],
            $data['total_quantity'],
            $data['available_quantity'],
            $data['id'],
            $data['category_id'],
            $data['category_name'],
            $data['image_url'],
            $data['language_id'],
            $data['language_name'],
            $data['isbn'] ?? null // <-- Récupération de l'ISBN
        );
    }

    public function addBook(Book $book, ?string $isbn = null): bool {
        $stmt = $this->db->prepare("
            INSERT INTO books (title, author, description, category_id, total_quantity, available_quantity, image_url, language_id, isbn) 
            VALUES (:title, :author, :description, :category_id, :total, :available, :image_url, :language_id, :isbn)
        ");
        
        return $stmt->execute([
            'title' => $book->getTitle(),
            'author' => $book->getAuthor(),
            'description' => $book->getDescription(),
            'category_id' => $book->getCategoryId(),
            'total' => $book->getTotalQuantity(),
            'available' => $book->getAvailableQuantity(),
            'image_url' => $book->getImageUrl(),
            'language_id' => $book->getLanguageId(),
            'isbn' => $isbn
        ]);
    }

    // Supprimer un livre
// Supprimer un livre (FORCÉ)
    public function deleteBook(int $id): bool {
        try {
            // On commence une transaction pour sécuriser l'opération
            $this->db->beginTransaction();

            // 1. D'ABORD : On supprime toutes les traces de ce livre dans les emprunts
            $stmtBorrowings = $this->db->prepare("DELETE FROM borrowings WHERE book_id = :id");
            $stmtBorrowings->execute(['id' => $id]);

            // 2. ENSUITE : On peut enfin supprimer le livre !
            $stmtBook = $this->db->prepare("DELETE FROM books WHERE id = :id");
            $stmtBook->execute(['id' => $id]);

            // On valide les deux suppressions
            $this->db->commit();
            return true;

        } catch (Exception $e) {
            // En cas de problème, on annule tout
            $this->db->rollBack();
            throw $e; 
        }
    }

    // Mettre à jour un livre (avec toutes les données)
    // Mettre à jour un livre (avec toutes les données et recalcul du stock)
    public function updateBook(int $id, string $title, string $author, string $description, int $categoryId, int $languageId, int $totalQty, string $imageUrl, ?string $isbn): bool {
        
        // 1. On récupère d'abord l'ancien total pour voir de combien on l'augmente/diminue
        $stmtOld = $this->db->prepare("SELECT total_quantity, available_quantity FROM books WHERE id = :id");
        $stmtOld->execute(['id' => $id]);
        $oldData = $stmtOld->fetch(PDO::FETCH_ASSOC);
        
        // Si le livre existe, on calcule la différence pour ajuster les livres en rayon
        if ($oldData) {
            $difference = $totalQty - $oldData['total_quantity'];
            $newAvailableQty = $oldData['available_quantity'] + $difference;
            
            // Sécurité : on empêche la quantité dispo de descendre en dessous de zéro
            if ($newAvailableQty < 0) {
                $newAvailableQty = 0;
            }
        } else {
            // Sécurité si on ne trouve pas l'ancien (peu probable)
            $newAvailableQty = $totalQty; 
        }

        // 2. On met à jour les DEUX quantités
        $stmt = $this->db->prepare("
            UPDATE books 
            SET title = :title, 
                author = :author, 
                description = :description, 
                category_id = :category_id, 
                language_id = :language_id,
                total_quantity = :total, 
                available_quantity = :available,  -- 🚨 C'est ici que ça change !
                image_url = :image_url,
                isbn = :isbn
            WHERE id = :id
        ");
        
        return $stmt->execute([
            'id' => $id,
            'title' => $title,
            'author' => $author,
            'description' => $description,
            'category_id' => $categoryId,
            'language_id' => $languageId,
            'total' => $totalQty,
            'available' => $newAvailableQty, // On injecte la nouvelle quantité dispo
            'image_url' => $imageUrl,
            'isbn' => $isbn
        ]);
    }

public function addCategory(string $categoryName): int {
        // 1. On vérifie si la catégorie existe déjà
        $stmtCheck = $this->db->prepare("SELECT id FROM categories WHERE name = :name");
        $stmtCheck->execute(['name' => $categoryName]);
        $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        // Si elle existe, on renvoie son ID (pas besoin de la recréer)
        if ($existing) {
            return (int) $existing['id'];
        }

        // 2. Si elle n'existe pas, on la crée
        $stmt = $this->db->prepare("INSERT INTO categories (name) VALUES (:name)");
        $stmt->execute(['name' => $categoryName]);
        return (int) $this->db->lastInsertId();
    }

    public function addLanguage(string $languageName): int {
        // 1. On vérifie si la langue existe déjà
        $stmtCheck = $this->db->prepare("SELECT id FROM languages WHERE name = :name");
        $stmtCheck->execute(['name' => $languageName]);
        $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        // Si elle existe, on renvoie son ID
        if ($existing) {
            return (int) $existing['id'];
        }

        // 2. Si elle n'existe pas, on la crée
        $stmt = $this->db->prepare("INSERT INTO languages (name) VALUES (:name)");
        $stmt->execute(['name' => $languageName]);
        return (int) $this->db->lastInsertId();
    }
}