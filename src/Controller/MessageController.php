<?php

require_once __DIR__ . '/../../config/Database.php';

class MessageController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    public function sendMessage(): void {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["erreur" => "Vous devez être connecté pour envoyer un message."]);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        
        if (empty($data['message'])) {
            http_response_code(400);
            echo json_encode(["erreur" => "Le message ne peut pas être vide."]);
            return;
        }

        try {
            $stmt = $this->db->prepare("INSERT INTO messages (user_id, message) VALUES (:user_id, :message)");
            $stmt->execute([
                'user_id' => $_SESSION['user_id'],
                'message' => htmlspecialchars($data['message']) 
            ]);

            http_response_code(201);
            echo json_encode(["message" => "Votre message a bien été envoyé à l'administration !"]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["erreur" => "Erreur lors de l'envoi du message."]);
        }
    }

    public function getAllMessages(): void {
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'ADMIN') {
            http_response_code(403);
            echo json_encode(["erreur" => "Accès refusé."]);
            return;
        }

        try {
            
            $sql = "SELECT m.id, m.message, m.created_at, u.full_name as student_name, u.email as student_email
                    FROM messages m
                    JOIN users u ON m.user_id = u.id
                    ORDER BY m.created_at DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($messages);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["erreur" => "Erreur lors de la récupération des messages."]);
        }
    }
}
