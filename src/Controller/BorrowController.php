<?php
// src/Controller/BorrowController.php

require_once __DIR__ . '/../Repository/BorrowingRepository.php';

class BorrowController {
    private BorrowingRepository $borrowingRepository;

    public function __construct() {
        $this->borrowingRepository = new BorrowingRepository();
    }

    public function borrow(): void {
        // On vérifie que la session PHP est active et que l'utilisateur est connecté
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["erreur" => "Vous devez être connecté pour emprunter un livre."]);
            return;
        }

        // On lit le JSON envoyé par le Javascript (qui contiendra l'ID du livre)
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['book_id'])) {
            http_response_code(400);
            echo json_encode(["erreur" => "L'identifiant du livre est manquant."]);
            return;
        }

        $userId = $_SESSION['user_id'];
        $bookId = (int) $data['book_id'];

        // On tente l'emprunt
        $success = $this->borrowingRepository->borrowBook($userId, $bookId);

        if ($success) {
            echo json_encode(["message" => "Livre emprunté avec succès !"]);
        } else {
            http_response_code(400);
            echo json_encode(["erreur" => "Le livre n'est plus disponible ou une erreur est survenue."]);
        }
    }

    // Renvoyer les emprunts de l'utilisateur connecté
// Dans la méthode qui gère '/api/my-borrowings'
    public function getMyBorrowings() {
        // CORRECTION : Plus de session_start() ici car index.php s'en occupe !

        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Non autorisé']);
            return;
        }

        $userId = $_SESSION['user_id'];
        $borrowings = $this->borrowingRepository->findByUserId($userId);

        echo json_encode($borrowings);
    }
    // Renvoyer la liste de tous les emprunts (Réservé aux ADMINS)
    public function getAllBorrowings(): void {
        // 1. SÉCURITÉ : On vérifie que l'utilisateur est bien un ADMIN
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'ADMIN') {
            http_response_code(403);
            echo json_encode(["erreur" => "Accès refusé. Seuls les administrateurs peuvent voir cette page."]);
            return;
        }

        // 2. On récupère toutes les données croisées
        $borrowings = $this->borrowingRepository->getAllBorrowingsWithDetails();

        // 3. On envoie au format JSON
        echo json_encode($borrowings);
    }
    // Marquer un livre comme rendu (Réservé Admin)
    public function returnBook(int $id): void {
        // Sécurité
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
    // On sécurise la requête pour ne chercher QUE les emprunts de l'ID fourni
    $sql = "SELECT b.id, books.title, books.image_url, b.borrow_date, b.due_date, b.status 
            FROM borrowings b
            JOIN books ON b.book_id = books.id
            WHERE b.user_id = :user_id";
            
    $stmt = $this->pdo->prepare($sql);
    $stmt->execute(['user_id' => $user_id]);
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}