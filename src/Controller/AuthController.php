<?php
// src/Controller/AuthController.php

require_once __DIR__ . '/../Repository/UserRepository.php';

class AuthController {
    private UserRepository $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    public function login(): void {
        // Comme on est une API, le JS va nous envoyer du JSON. On le lit ici :
        $data = json_decode(file_get_contents("php://input"), true);
        
        // 1. On vérifie que l'email et le mot de passe ont bien été envoyés
        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400); // Erreur : Mauvaise requête
            echo json_encode(["erreur" => "Email et mot de passe requis"]);
            return;
        }

        // 2. On cherche l'utilisateur dans la base de données
        $user = $this->userRepository->findByEmail($data['email']);

        // 3. On vérifie l'email ET le mot de passe avec password_verify()
        if ($user && password_verify($data['password'], $user->getPasswordHash())) {       
            session_regenerate_id(true);     
            // 4. CONNEXION RÉUSSIE : On crée la session PHP
            $_SESSION['user_id'] = $user->getId();
            $_SESSION['user_role'] = $user->getRole();
            $_SESSION['user_name'] = $user->getFullName();

            // On renvoie un JSON de succès au navigateur
            echo json_encode([
                "message" => "Connexion réussie",
                "user" => [
                    "name" => $user->getFullName(),
                    "role" => $user->getRole()
                ]
            ]);
        } else {
            // ÉCHEC
            http_response_code(401); // Erreur : Non autorisé
            echo json_encode(["erreur" => "Identifiants incorrects"]);
        }
    }
    public function logout() {
        // On vide le tableau de session
        $_SESSION = array();
        
        // CORRECTION : On détruit physiquement le cookie de session sur le navigateur
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        // On détruit la session côté serveur
        session_destroy();
        
        echo json_encode(['message' => 'Déconnexion réussie et cache vidé']);
    }
    public function register(): void {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(["erreur" => "Tous les champs sont obligatoires."]);
            return;
        }

        // Vérifier si l'email existe déjà
        $existingUser = $this->userRepository->findByEmail($data['email']);
        if ($existingUser) {
            http_response_code(409); // 409 Conflict
            echo json_encode(["erreur" => "Cette adresse email est déjà utilisée."]);
            return;
        }

        // Hacher le mot de passe pour la sécurité
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

        // Créer l'utilisateur (Rôle 'USER' par défaut)
        $success = $this->userRepository->createUser($data['name'], $data['email'], $hashedPassword, 'USER');

        if ($success) {
            http_response_code(201); // 201 Created
            echo json_encode(["message" => "Compte créé avec succès !"]);
        } else {
            http_response_code(500);
            echo json_encode(["erreur" => "Erreur lors de la création du compte."]);
        }
    }
}