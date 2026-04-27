<?php
// public/test.php

require_once '../src/Controller/BookController.php';

// On instancie le Controller
$controller = new BookController();

// On appelle la méthode qui génère le JSON
$controller->getAllBooks();