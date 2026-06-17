<?php
// src/Controller/BorrowController.php

require_once __DIR__ . '/../Repository/BorrowingRepository.php';

class BorrowController {
    private BorrowingRepository $borrowingRepository;

    public function __construct() {
        $this->borrowingRepository = new BorrowingRepository();
    }

    public function borrow(): void {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["erreur" => "Vous devez être connecté pour emprunter un livre."]);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $db = Database::getInstance()->getConnection();
        $userId = $_SESSION['user_id'];

        // 🚨 SÉCURITÉ 1 : ANTI-RETARD
        $stmtCheck = $db->prepare("SELECT COUNT(*) FROM borrowings WHERE user_id = :user_id AND status = 'EN_COURS' AND due_date < CURDATE()");
        $stmtCheck->execute(['user_id' => $userId]);
        if ($stmtCheck->fetchColumn() > 0) {
            http_response_code(403);
            echo json_encode(["erreur" => "Emprunt refusé : Vous avez un ou plusieurs livres en retard 🔴. Veuillez les restituer à l'administration."]);
            return;
        }

        // 🚨 SÉCURITÉ 2 : LIMITE GLOBALE DE 3 LIVRES
        $stmtGlobalLimit = $db->prepare("SELECT COUNT(*) FROM borrowings WHERE user_id = :user_id AND status = 'EN_COURS'");
        $stmtGlobalLimit->execute(['user_id' => $userId]);
        if ($stmtGlobalLimit->fetchColumn() >= 3) {
            http_response_code(403);
            echo json_encode(["erreur" => "Limite atteinte 🛑 : Vous avez déjà 3 livres en cours d'emprunt. Restituez-en d'abord."]);
            return;
        }

        if (!isset($data['book_id'])) {
            http_response_code(400);
            echo json_encode(["erreur" => "L'identifiant du livre est manquant."]);
            return;
        }

        $bookId = (int) $data['book_id'];

        // 🚨 SÉCURITÉ 3 : PAS DE DOUBLONS DU MÊME LIVRE
        $stmtDuplicate = $db->prepare("SELECT COUNT(*) FROM borrowings WHERE user_id = :user_id AND book_id = :book_id AND status = 'EN_COURS'");
        $stmtDuplicate->execute(['user_id' => $userId, 'book_id' => $bookId]);
        if ($stmtDuplicate->fetchColumn() > 0) {
            http_response_code(403);
            echo json_encode(["erreur" => "Vous avez déjà un exemplaire de ce livre en cours d'emprunt."]);
            return;
        }

        // On force la quantité à 1 de manière sécurisée
        $quantity = 1;

        $result = $this->borrowingRepository->borrowBook($userId, $bookId, $quantity);

        if ($result === true) {
            echo json_encode(["message" => "Livre emprunté avec succès !"]);
        } else {
            http_response_code(400);
            echo json_encode(["erreur" => $result]); 
        }
    }

    // Renvoyer les emprunts de l'utilisateur connecté
    public function getMyBorrowings(): void {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["erreur" => "Non autorisé"]);
            return;
        }

        $db = Database::getInstance()->getConnection();
        
        // La clause WHERE garantit que l'on ne sort QUE les livres de l'étudiant connecté
        $stmt = $db->prepare("
            SELECT b.*, bk.title, bk.image_url, bk.author 
            FROM borrowings b 
            JOIN books bk ON b.book_id = bk.id 
            WHERE b.user_id = :user_id 
            ORDER BY b.borrow_date DESC
        ");
        
        $stmt->execute(['user_id' => $_SESSION['user_id']]);
        $emprunts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($emprunts);
    }

    // Renvoyer la liste de tous les emprunts (Réservé aux ADMINS)
    public function getAllBorrowings(): void {
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'ADMIN') {
            http_response_code(403);
            echo json_encode(["erreur" => "Accès refusé."]);
            return;
        }

        try {
            $db = Database::getInstance()->getConnection();
            
            // 🚨 LA REQUÊTE CORRIGÉE : Utilise u.full_name et évite l'erreur du Repository
            $sql = "SELECT b.id, b.borrow_date, b.due_date, b.status, 
                           u.full_name as student_name, u.email as student_email, 
                           bk.title as book_title
                    FROM borrowings b
                    JOIN users u ON b.user_id = u.id
                    JOIN books bk ON b.book_id = bk.id
                    ORDER BY b.borrow_date DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $emprunts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($emprunts);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["erreur" => "Erreur de récupération des emprunts."]);
        }
    }

    // Marquer un livre comme rendu (Réservé Admin)
    public function returnBook(int $id): void {
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'ADMIN') {
            http_response_code(403);
            echo json_encode(["erreur" => "Accès refusé."]);
            return;
        }
        if ($this->borrowingRepository->returnBook($id)) {
            http_response_code(200);
            echo json_encode(["message" => "Livre restitué avec succès. Le stock a été mis à jour !"]);
        } else {
            http_response_code(500);
            echo json_encode(["erreur" => "Erreur lors de la restitution du livre."]);
        }
    }

    public function getEmpruntsParUtilisateur($user_id) {
        $sql = "SELECT b.id, books.title, books.image_url, b.borrow_date, b.due_date, b.status 
                FROM borrowings b
                JOIN books ON b.book_id = books.id
                WHERE b.user_id = :user_id";
                
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare($sql);
        $stmt->execute(['user_id' => $user_id]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // --- 🚨 VÉRIFICATION AUTOMATIQUE DES RETARDS (POUR LE BANDEAU) ---
    public function checkRetardsAutomatique(): void {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(["retards" => 0]);
            return;
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT COUNT(*) FROM borrowings WHERE user_id = :user_id AND status = 'EN_COURS' AND due_date < CURDATE()");
        $stmt->execute(['user_id' => $_SESSION['user_id']]);
        
        $count = $stmt->fetchColumn();
        echo json_encode(["retards" => (int)$count]);
    }
}