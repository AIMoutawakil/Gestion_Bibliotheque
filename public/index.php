<?php

session_start(); 
require_once '../src/Controller/BorrowController.php';
require_once '../src/Controller/BookController.php';
require_once '../src/Controller/AuthController.php';
require_once '../src/Controller/MessageController.php';
require_once '../src/Controller/UserController.php';

header('Content-Type: application/json; charset=UTF-8');

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($requestUri, PHP_URL_PATH);

$bookController = new BookController();
$authController = new AuthController(); 
$borrowController = new BorrowController();
$messageController = new MessageController();
$userController = new UserController();

if (strpos($path, '/api/login') !== false && $method === 'POST') {
    $authController->login();
} 
elseif (strpos($path, '/api/register') !== false && $method === 'POST') {
    $authController->register();
} 
elseif (strpos($path, '/api/logout') !== false && $method === 'POST') {
    $authController->logout();
}

elseif (strpos($path, '/api/books') !== false && !preg_match('/\/api\/books\/[0-9]+/', $path) && $method === 'GET') {
    $bookController->getAllBooks();
} 

elseif (preg_match('/\/api\/books\/([0-9]+)/', $path, $matches) && $method === 'GET') {
    $bookController->getBook($matches[1]);
} 

elseif (strpos($path, '/api/books') !== false && !preg_match('/\/api\/books\/[0-9]+/', $path) && $method === 'POST') {
    $bookController->createBook();
}

elseif (preg_match('/\/api\/books\/([0-9]+)/', $path, $matches) && $method === 'PUT') {
    $bookController->updateBook($matches[1]);
}

elseif (preg_match('/\/api\/books\/([0-9]+)/', $path, $matches) && $method === 'DELETE') {
    $bookController->deleteBook($matches[1]);
}

elseif (strpos($path, '/api/borrow') !== false && $method === 'POST') {
    $borrowController->borrow();
}

elseif (strpos($path, '/api/my-borrowings') !== false && $method === 'GET') {
    $borrowController->getMyBorrowings();
}

elseif (strpos($path, '/api/admin/borrowings') !== false && $method === 'GET') {
    $borrowController->getAllBorrowings();
}

elseif (preg_match('/\/api\/admin\/borrowings\/([0-9]+)\/return/', $path, $matches) && $method === 'POST') {
    $borrowController->returnBook($matches[1]);
}

elseif (strpos($path, '/api/check-retards') !== false && $method === 'GET') {
    $borrowController->checkRetardsAutomatique();
}

elseif (strpos($path, '/api/messages') !== false && $method === 'POST') {
    $messageController->sendMessage();
}

elseif (strpos($path, '/api/admin/students') !== false && $method === 'GET') {
    $userController->getAllStudents();
}
// Récupérer les messages reçus
elseif (strpos($path, '/api/admin/messages') !== false && $method === 'GET') {
    $messageController->getAllMessages();
}

else {
    http_response_code(404);
    echo json_encode(["erreur" => "Route non trouvée"]);
}
