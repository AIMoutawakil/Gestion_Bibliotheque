<?php

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../Model/User.php';

class UserRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByEmail(string $email): ?User {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$data) {
            return null;
        }
        return new User(
            $data['full_name'],
            $data['email'],
            $data['password_hash'],
            $data['role'],
            $data['id']
        );
    }
    public function createUser(string $name, string $email, string $passwordHash, string $role): bool {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO users (full_name, email, password_hash, role) 
                VALUES (:name, :email, :password, :role)
            ");
            
            return $stmt->execute([
                'name' => $name,
                'email' => $email,
                'password' => $passwordHash,
                'role' => $role
            ]);
        } catch (PDOException $e) {
            return false;
        }
    }
}
