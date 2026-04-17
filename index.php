<?php
session_start();

require_once 'CONFIG/database.php';
require_once 'APP/models/Usuario.php';
require_once 'APP/models/Visita.php';
require_once 'APP/models/Turno.php';
require_once 'APP/models/Paquete.php';
require_once 'APP/models/Acceso.php';

require_once 'APP/controllers/IndexController.php';
require_once 'APP/controllers/AdminController.php';
require_once 'APP/controllers/GuardiaController.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['option'])) {
    $controller = new IndexController();
    if ($_POST['option'] === 'login') {
        $controller->login();
    }
    // Agregar otras opciones si es necesario
} else {
    $page = $_GET['page'] ?? 'index';
    switch ($page) {
        case 'index':
            $controller = new IndexController();
            $controller->showLogin();
            break;
        case 'admin':
            $controller = new AdminController();
            $controller->index();
            break;
        case 'guardia':
            $controller = new GuardiaController();
            $controller->index();
            break;
        default:
            $controller = new IndexController();
            $controller->showLogin();
            break;
    }
}
?>