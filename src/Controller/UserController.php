<?php

require_once __DIR__ . '/../../config/Database.php';

class UserController {
    
    public function getAllStudents(): void {

        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'ADMIN') {
            http_response_code(403);
            echo json_encode(["erreur" => "Accès refusé."]);
            return;
        }

        $db = Database::getInstance()->getConnection();
        
        
        $sql = "SELECT u.id, u.full_name as name, u.email,
                       (SELECT COUNT(*) FROM borrowings b WHERE b.user_id = u.id) as total_historique,
                       (SELECT COUNT(*) FROM borrowings b WHERE b.user_id = u.id AND b.status = 'EN_COURS') as active_borrowings,
                       (SELECT COUNT(*) FROM borrowings b WHERE b.user_id = u.id AND b.status = 'EN_COURS' AND b.due_date < CURDATE()) as overdue_borrowings
                FROM users u
                WHERE u.role = 'USER'
                ORDER BY u.full_name ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($students);
    }
}
