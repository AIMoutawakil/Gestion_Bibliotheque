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
                $data['image_url'], // <-- NOUVEAU
                $data['language_id'],
                $data['language_name']
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
            $data['image_url'], // <-- NOUVEAU
            $data['language_id'],
            $data['language_name']      
        );
    }

    public function addBook(Book $book): bool {
        // On a ajouté language_id dans le INSERT et :language_id dans les VALUES
        $stmt = $this->db->prepare("
            INSERT INTO books (title, author, description, category_id, total_quantity, available_quantity, image_url, language_id) 
            VALUES (:title, :author, :description, :category_id, :total, :available, :image_url, :language_id)
        ");
        
        return $stmt->execute([
            'title' => $book->getTitle(),
            'author' => $book->getAuthor(),
            'description' => $book->getDescription(),
            'category_id' => $book->getCategoryId(),
            'total' => $book->getTotalQuantity(),
            'available' => $book->getAvailableQuantity(),
            'image_url' => $book->getImageUrl(),
            'language_id' => $book->getLanguageId() // 🚨 C'est ça qui sauvegarde la langue !
        ]);
    }
    // Supprimer un livre
    public function deleteBook(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM books WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    // Mettre à jour un livre
    public function updateBook(int $id, string $title, string $author, int $categoryId, int $totalQty, string $imageUrl): bool {
        // Optionnel : On pourrait aussi calculer la différence pour available_quantity, 
        // mais pour faire simple pour la présentation, on met à jour le total.
        $stmt = $this->db->prepare("
            UPDATE books 
            SET title = :title, author = :author, category_id = :category_id, 
                total_quantity = :total, image_url = :image_url
            WHERE id = :id
        ");
        
        return $stmt->execute([
            'id' => $id,
            'title' => $title,
            'author' => $author,
            'category_id' => $categoryId,
            'total' => $totalQty,
            'image_url' => $imageUrl
        ]);
    }

    public function addCategory(string $categoryName): int {
        $stmt = $this->db->prepare("INSERT INTO categories (name) VALUES (:name)");
        $stmt->execute(['name' => $categoryName]);
        
        return (int) $this->db->lastInsertId();
    }

    public function addLanguage(string $languageName): int {
    $stmt = $this->db->prepare("INSERT INTO languages (name) VALUES (:name)");
    $stmt->execute(['name' => $languageName]);
    return (int) $this->db->lastInsertId();
    }
}