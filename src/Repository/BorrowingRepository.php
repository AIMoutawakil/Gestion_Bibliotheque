<?php

require_once __DIR__ . '/../../config/Database.php';

class BorrowingRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function borrowBook(int $userId, int $bookId, int $quantity = 1) {
        try {
            $this->db->beginTransaction();

            $stmtCheck = $this->db->prepare("SELECT available_quantity FROM books WHERE id = :id FOR UPDATE");
            $stmtCheck->execute(['id' => $bookId]);
            $book = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$book || $book['available_quantity'] < $quantity) {
                $this->db->rollBack();
                return "Stock insuffisant.";
            }

            $stmtInsert = $this->db->prepare("
                INSERT INTO borrowings (user_id, book_id, borrow_date, due_date, status) 
                VALUES (:user_id, :book_id, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'EN_COURS')
            ");

            for ($i = 0; $i < $quantity; $i++) {
                $stmtInsert->execute([
                    'user_id' => $userId,
                    'book_id' => $bookId
                ]);
            }

            $stmtUpdate = $this->db->prepare("
                UPDATE books 
                SET available_quantity = available_quantity - :quantity 
                WHERE id = :id
            ");
            $stmtUpdate->execute([
                'quantity' => $quantity,
                'id' => $bookId
            ]);

            $this->db->commit();
            return true;

        } catch (Exception $e) {
            $this->db->rollBack();
            return "Détail de l'erreur SQL : " . $e->getMessage(); 
        }
    }

    public function findBorrowingsByUser(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT b.title, b.author, br.borrow_date, br.status 
            FROM borrowings br
            JOIN books b ON br.book_id = b.id
            WHERE br.user_id = :user_id
            ORDER BY br.borrow_date DESC
        ");
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

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

    public function returnBook(int $borrowingId): bool {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("SELECT book_id FROM borrowings WHERE id = :id");
            $stmt->execute(['id' => $borrowingId]);
            $borrowing = $stmt->fetch();

            if (!$borrowing) {
                $this->db->rollBack();
                return false;
            }

            $bookId = $borrowing['book_id'];

            $stmtUpdate = $this->db->prepare("
                UPDATE borrowings 
                SET status = 'RETOURNE', return_date = NOW() 
                WHERE id = :id
            ");
            $stmtUpdate->execute(['id' => $borrowingId]);

            $stmtBook = $this->db->prepare("
                UPDATE books 
                SET available_quantity = available_quantity + 1 
                WHERE id = :book_id
            ");
            $stmtBook->execute(['book_id' => $bookId]);

            $this->db->commit();
            return true;

        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    public function findByUserId($userId) {
        $sql = "SELECT b.id, books.title, books.author, books.image_url, b.borrow_date, b.due_date, b.status 
                FROM borrowings b
                JOIN books ON b.book_id = books.id
                WHERE b.user_id = :user_id
                ORDER BY b.borrow_date DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['user_id' => $userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getEmpruntsParUtilisateur($user_id) {
        $sql = "SELECT b.id, books.title, books.image_url, b.borrow_date, b.due_date, b.status 
                FROM borrowings b
                JOIN books ON b.book_id = books.id
                WHERE b.user_id = :user_id";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['user_id' => $user_id]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
