<?php
// public/index.php

// OBLIGATOIRE : On démarre le moteur de sessions de PHP tout en haut !
session_start(); 
require_once '../src/Controller/BorrowController.php';
require_once '../src/Controller/BookController.php';
require_once '../src/Controller/AuthController.php';
require_once '../src/Controller/MessageController.php';
require_once '../src/Controller/UserController.php';


// On indique qu'on renvoie toujours du JSON
header('Content-Type: application/json; charset=UTF-8');

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($requestUri, PHP_URL_PATH);

$bookController = new BookController();
$authController = new AuthController(); 
$borrowController = new BorrowController();
$messageController = new MessageController();
$userController = new UserController();

// ==========================================
// 1. AUTHENTIFICATION (Connexion, Inscription, Déconnexion)
// ==========================================
if (strpos($path, '/api/login') !== false && $method === 'POST') {
    $authController->login();
} 
elseif (strpos($path, '/api/register') !== false && $method === 'POST') {
    $authController->register();
} 
elseif (strpos($path, '/api/logout') !== false && $method === 'POST') {
    $authController->logout();
}

// ==========================================
// 2. GESTION DES LIVRES
// ==========================================
// Tous les livres (Public)
elseif (strpos($path, '/api/books') !== false && !preg_match('/\/api\/books\/[0-9]+/', $path) && $method === 'GET') {
    $bookController->getAllBooks();
} 
// Un seul livre (Public)
elseif (preg_match('/\/api\/books\/([0-9]+)/', $path, $matches) && $method === 'GET') {
    $bookController->getBook($matches[1]);
} 
// Ajouter un livre (Admin)
elseif (strpos($path, '/api/books') !== false && !preg_match('/\/api\/books\/[0-9]+/', $path) && $method === 'POST') {
    $bookController->createBook();
}
// Modifier un livre (Admin)
elseif (preg_match('/\/api\/books\/([0-9]+)/', $path, $matches) && $method === 'PUT') {
    $bookController->updateBook($matches[1]);
}
// Supprimer un livre (Admin)
elseif (preg_match('/\/api\/books\/([0-9]+)/', $path, $matches) && $method === 'DELETE') {
    $bookController->deleteBook($matches[1]);
}

// ==========================================
// 3. GESTION DES EMPRUNTS & RETARDS
// ==========================================
// Emprunter un livre
elseif (strpos($path, '/api/borrow') !== false && $method === 'POST') {
    $borrowController->borrow();
}
// Voir mes emprunts (Étudiant)
elseif (strpos($path, '/api/my-borrowings') !== false && $method === 'GET') {
    $borrowController->getMyBorrowings();
}
// Voir tous les emprunts (Admin)
elseif (strpos($path, '/api/admin/borrowings') !== false && $method === 'GET') {
    $borrowController->getAllBorrowings();
}
// Restituer un livre (Admin)
elseif (preg_match('/\/api\/admin\/borrowings\/([0-9]+)\/return/', $path, $matches) && $method === 'POST') {
    $borrowController->returnBook($matches[1]);
}
// 🚨 VÉRIFIER LES RETARDS (Nouveau)
elseif (strpos($path, '/api/check-retards') !== false && $method === 'GET') {
    $borrowController->checkRetardsAutomatique();
}

// ==========================================
// 4. GESTION DES MESSAGES / SUGGESTIONS
// ==========================================
// Envoyer un message à l'administration
elseif (strpos($path, '/api/messages') !== false && $method === 'POST') {
    $messageController->sendMessage();
}

// ==========================================
// 5. GESTION DES ÉTUDIANTS (ADMIN)
// ==========================================
// Récupérer la liste des étudiants
elseif (strpos($path, '/api/admin/students') !== false && $method === 'GET') {
    $userController->getAllStudents();
}
// Récupérer les messages reçus
elseif (strpos($path, '/api/admin/messages') !== false && $method === 'GET') {
    $messageController->getAllMessages();
}

// ==========================================
// 404 - ROUTE INTROUVABLE
// ==========================================
else {
    http_response_code(404);
    echo json_encode(["erreur" => "Route non trouvée"]);
}