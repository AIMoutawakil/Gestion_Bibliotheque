<?php
// public/index.php

// OBLIGATOIRE : On démarre le moteur de sessions de PHP tout en haut !
session_start(); 
require_once '../src/Controller/BorrowController.php';
require_once '../src/Controller/BookController.php';
require_once '../src/Controller/AuthController.php';

// On indique qu'on renvoie toujours du JSON
header('Content-Type: application/json; charset=UTF-8');

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($requestUri, PHP_URL_PATH);

$bookController = new BookController();
$authController = new AuthController(); 
$borrowController = new BorrowController();

// Route 1 : Tous les livres
if (strpos($path, '/api/books') !== false && !preg_match('/\/api\/books\/[0-9]+/', $path) && $method === 'GET') {
    $bookController->getAllBooks();
} 
// Route 2 : Un seul livre
elseif (preg_match('/\/api\/books\/([0-9]+)/', $path, $matches) && $method === 'GET') {
    $id = (int) $matches[1];
    $bookController->getBook($id);
} 
// Route 3 : La connexion (NOUVEAU) - Attention, c'est une requête POST
elseif (strpos($path, '/api/login') !== false && $method === 'POST') {
    $authController->login();
} 

// Route 4 : Emprunter un livre (POST)
elseif (strpos($path, '/api/borrow') !== false && $method === 'POST') {
    $borrowController->borrow();
}

// Route 5 : Voir mes emprunts (GET)
elseif (strpos($path, '/api/my-borrowings') !== false && $method === 'GET') {
    $borrowController->getMyBorrowings();
}
// Route 6 : Ajouter un livre (POST) - Réservé aux Administrateurs
elseif (strpos($path, '/api/books') !== false && !preg_match('/\/api\/books\/[0-9]+/', $path) && $method === 'POST') {
    $bookController->createBook();
}
// Route : Voir tous les emprunts pour le tableau de bord (GET) - Réservé Admin
elseif (strpos($path, '/api/admin/borrowings') !== false && $method === 'GET') {
    $borrowController->getAllBorrowings();
}
// Route : Restituer un livre (POST) - Réservé Admin
elseif (preg_match('/\/api\/admin\/borrowings\/([0-9]+)\/return/', $path, $matches) && $method === 'POST') {
    $borrowController->returnBook($matches[1]);
}
// Route : Supprimer un livre (DELETE)
elseif (preg_match('/\/api\/books\/([0-9]+)/', $path, $matches) && $method === 'DELETE') {
    $bookController->deleteBook($matches[1]);
}
// Route : Modifier un livre (PUT)
elseif (preg_match('/\/api\/books\/([0-9]+)/', $path, $matches) && $method === 'PUT') {
    $bookController->updateBook($matches[1]);
}
// Route : La déconnexion (POST)
elseif (strpos($path, '/api/logout') !== false && $method === 'POST') {
    $authController->logout();
}
// Route : L'inscription (POST)
elseif (strpos($path, '/api/register') !== false && $method === 'POST') {
    $authController->register();
}
// Dans public/index.php
elseif (strpos($path, '/api/borrow') !== false && $method === 'POST') {
    $borrowController = new BorrowController($db);
    $borrowController->borrow();
}
// Route par défaut (404)
else {
    http_response_code(404);
    echo json_encode(["erreur" => "Route non trouvée"]);
}
