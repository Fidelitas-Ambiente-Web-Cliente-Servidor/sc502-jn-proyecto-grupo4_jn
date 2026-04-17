<?php
class AdminController {
    public function __construct() {
        if (!isset($_SESSION['usuario'])) { 
            header('Location: index.php'); 
            exit; 
        }
    }

    public function index() {
        require __DIR__ . '/../views/admin.php';
    }
}
