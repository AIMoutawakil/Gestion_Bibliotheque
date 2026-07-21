<?php

require_once __DIR__ . '/../Repository/UserRepository.php';

class AuthController {
    private UserRepository $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    public function login(): void {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400); 
            echo json_encode(["erreur" => "Email et mot de passe requis"]);
            return;
        }

        $user = $this->userRepository->findByEmail($data['email']);

        if ($user && password_verify($data['password'], $user->getPasswordHash())) {       
            
            session_unset(); 
            session_regenerate_id(true);     
            
            $_SESSION['user_id'] = $user->getId();
            $_SESSION['user_role'] = $user->getRole();
            $_SESSION['user_name'] = $user->getFullName();

            echo json_encode([
                "message" => "Connexion réussie",
                "user" => [
                    "name" => $user->getFullName(),
                    "role" => $user->getRole()
                ]
            ]);
        } else {
            http_response_code(401); 
            echo json_encode(["erreur" => "Identifiants incorrects"]);
        }
    }

    public function logout() {
        session_unset(); 
        $_SESSION = array();
        
        // On détruit physiquement le cookie
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }

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

        $existingUser = $this->userRepository->findByEmail($data['email']);
        if ($existingUser) {
            http_response_code(409); 
            echo json_encode(["erreur" => "Cette adresse email est déjà utilisée."]);
            return;
        }

        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $success = $this->userRepository->createUser($data['name'], $data['email'], $hashedPassword, 'USER');

        if ($success) {
            http_response_code(201); 
            echo json_encode(["message" => "Compte créé avec succès !"]);
        } else {
            http_response_code(500);
            echo json_encode(["erreur" => "Erreur lors de la création du compte."]);
        }
    }
}
