<?php
class AdminController {
    private $testMode = false;
    public function __construct() {
        if (!isset($_SESSION['usuario'])) { 
            header('Location: index.php'); 
            exit; 
        }
        $this->testMode = isset($_GET['test']) && $_GET['test'] === '1';
    }

    public function index() {
        require __DIR__ . '/../views/admin.php';
    }
}
