<?php
// src/Repository/BorrowingRepository.php

require_once __DIR__ . '/../../config/Database.php';

class BorrowingRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

public function borrowBook(int $userId, int $bookId): bool {
        try {
            $this->db->beginTransaction();

            // 1. Vérification du stock
            $stmtCheck = $this->db->prepare("SELECT available_quantity FROM books WHERE id = :id FOR UPDATE");
            $stmtCheck->execute(['id' => $bookId]);
            $book = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$book || $book['available_quantity'] <= 0) {
                $this->db->rollBack();
                return false;
            }

            // 2. CORRECTION : On insère la due_date (+14 jours) et le statut exact 'EN_COURS'
            $stmtInsert = $this->db->prepare("
                INSERT INTO borrowings (user_id, book_id, borrow_date, due_date, status) 
                VALUES (:user_id, :book_id, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'EN_COURS')
            ");
            $stmtInsert->execute([
                'user_id' => $userId,
                'book_id' => $bookId
            ]);

            // 3. Mise à jour du stock
            $stmtUpdate = $this->db->prepare("
                UPDATE books 
                SET available_quantity = available_quantity - 1 
                WHERE id = :id
            ");
            $stmtUpdate->execute(['id' => $bookId]);

            $this->db->commit();
            return true;

        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    // Récupérer la liste des emprunts d'un utilisateur
    public function findBorrowingsByUser(int $userId): array {
        // On utilise un JOIN pour récupérer le titre du livre en même temps que la date d'emprunt
        $stmt = $this->db->prepare("
            SELECT b.title, b.author, br.borrow_date, br.status 
            FROM borrowings br
            JOIN books b ON br.book_id = b.id
            WHERE br.user_id = :user_id
            ORDER BY br.borrow_date DESC
        ");
        
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC); // Renvoie un tableau avec tous les résultats
    }
    // Récupérer TOUS les emprunts avec les détails du livre et de l'utilisateur (Pour l'Admin)
public function getAllBorrowingsWithDetails(): array {
        $stmt = $this->db->query("
            SELECT br.id, br.borrow_date, br.due_date, br.return_date, br.status,
                   u.full_name as user_name, u.email as user_email,
                   b.title as book_title
            FROM borrowings br
            JOIN users u ON br.user_id = u.id
            JOIN books b ON br.book_id = b.id
            ORDER BY br.borrow_date DESC
        ");
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    // Restituer un livre (Transaction : met à jour l'emprunt + augmente le stock)
// Restituer un livre (Transaction : met à jour l'emprunt + augmente le stock)
    public function returnBook(int $borrowingId): bool {
        try {
            // 1. On commence la transaction
            $this->db->beginTransaction();

            // 2. On récupère l'ID du livre concerné par cet emprunt
            $stmt = $this->db->prepare("SELECT book_id FROM borrowings WHERE id = :id");
            $stmt->execute(['id' => $borrowingId]);
            $borrowing = $stmt->fetch();

            if (!$borrowing) {
                $this->db->rollBack();
                return false;
            }

            $bookId = $borrowing['book_id'];

            // 3. On met à jour l'emprunt (Statut "RETURNED" et date de retour à aujourd'hui)
            $stmtUpdate = $this->db->prepare("
                UPDATE borrowings 
                SET status = 'RETURNED', return_date = NOW() 
                WHERE id = :id
            ");
            $stmtUpdate->execute(['id' => $borrowingId]);

            // 4. On rajoute le livre dans le stock (+1)
            $stmtBook = $this->db->prepare("
                UPDATE books 
                SET available_quantity = available_quantity + 1 
                WHERE id = :book_id
            ");
            $stmtBook->execute(['book_id' => $bookId]);

            // 5. On valide tout
            $this->db->commit();
            return true;

        } catch (Exception $e) {
            // S'il y a la moindre erreur, on annule tout
            $this->db->rollBack();
            return false;
        }
    }
    public function findByUserId($userId) {
        $sql = "SELECT b.id, books.title, books.author, b.borrow_date, b.due_date, b.status 
                FROM borrowings b
                JOIN books ON b.book_id = books.id
                WHERE b.user_id = :user_id
                ORDER BY b.borrow_date DESC";

        // CORRECTION : On utilise $this->db et non $this->pdo
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['user_id' => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}