<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', '0');
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    if (isset($_GET['option']) || (isset($_POST['option']) && $_POST['option'] !== 'login')) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode([
            'response' => '01',
            'message' => $errstr,
            'error_file' => basename($errfile),
            'error_line' => $errline
        ]);
        exit;
    }
    return false;
});

require_once 'CONFIG/database.php';
require_once 'APP/models/Usuario.php';
require_once 'APP/models/Visita.php';
require_once 'APP/models/Turno.php';
require_once 'APP/models/Paquete.php';
require_once 'APP/models/Acceso.php';

require_once 'APP/controllers/IndexController.php';
require_once 'APP/controllers/AdminController.php';
require_once 'APP/controllers/GuardiaController.php';

try {

    if (isset($_GET['page']) && $_GET['page'] === 'admin' && !isset($_SESSION['usuario'])) {
        $_SESSION['usuario'] = [
            'id' => 1,
            'nombre' => 'Admin Prueba',
            'usuario' => 'admin_test',
            'rol' => 'admin'
        ];
    }

    if (isset($_GET['option'])) {
        header('Content-Type: application/json; charset=utf-8');
        $option = $_GET['option'];
        $page = $_GET['page'] ?? 'guardia';
        $testMode = isset($_GET['test']) && $_GET['test'] === '1';
        
        if ($testMode && !isset($_SESSION['usuario'])) {
            $_SESSION['usuario'] = [
                'id' => 1,
                'nombre' => 'Guardia Prueba',
                'usuario' => 'guardia_test',
                'rol' => 'guardia'
            ];
        }
        
        if ($page === 'guardia' && isset($_SESSION['usuario'])) {
            $controller = new GuardiaController();
            if (in_array($option, ['stats', 'get_visitas', 'get_paquetes', 'get_accesos', 'get_turnos', 'get_roles'])) {
                $controller->getData($option);
            } elseif (in_array($option, ['registrar_visita', 'checkout_visita', 'registrar_paquete', 'entregar_paquete', 'registrar_acceso', 'registrar_salida', 'iniciar_turno', 'finalizar_turno'])) {
                $controller->handle($option);
            }
        }

        if ($page === 'admin' && isset($_SESSION['usuario'])) {
            $controller = new AdminController();
            if (in_array($option, ['get_gestion_admin', 'get_accesos_admin', 'get_roles_acceso_admin', 'get_turnos_admin'])) {
                $controller->getData($option);
            }
        }

        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['option'])) {
        header('Content-Type: application/json; charset=utf-8');
        $option = $_POST['option'];
        $page = $_POST['page'] ?? ((isset($_SESSION['usuario']) && $option !== 'login') ? 'guardia' : 'index');
        $testMode = isset($_POST['test']) && $_POST['test'] === '1';
        
        if ($option === 'login') {
            $controller = new IndexController();
            $controller->login();

        } elseif ($page === 'guardia') {
            if ($testMode && !isset($_SESSION['usuario'])) {
                $_SESSION['usuario'] = [
                    'id' => 1,
                    'nombre' => 'Guardia Prueba',
                    'usuario' => 'guardia_test',
                    'rol' => 'guardia'
                ];
            }

            if (isset($_SESSION['usuario'])) {
                $controller = new GuardiaController();
                if (in_array($option, ['registrar_visita', 'checkout_visita', 'registrar_paquete', 'entregar_paquete', 'registrar_acceso', 'registrar_salida', 'iniciar_turno', 'finalizar_turno'])) {
                    $controller->handle($option);
                }
            }

        } elseif ($page === 'admin') {
            if (isset($_SESSION['usuario'])) {
                $controller = new AdminController();
                if (in_array($option, [
                    'registrar_residencia_admin',
                    'eliminar_residencia_admin',
                    'registrar_condomino_admin',
                    'eliminar_condomino_admin',
                    'registrar_acceso_admin',
                    'registrar_salida_admin',
                    'eliminar_acceso_admin',
                    'guardar_turno_admin',
                    'eliminar_turno_admin',
                    'iniciar_turno_admin',
                    'finalizar_turno_admin'
                ])) {
                    $controller->handle($option);
                }
            }
        }

        exit;
    }

    header('Content-Type: text/html; charset=utf-8');
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
} catch (Throwable $e) {
    if (isset($_GET['option']) || (isset($_POST['option']) && $_POST['option'] !== 'login')) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'response' => '01',
            'message' => $e->getMessage(),
            'error_file' => $e->getFile(),
            'error_line' => $e->getLine()
        ]);
    } else {
        header('Content-Type: text/html; charset=utf-8');
        echo '<pre><strong>Error:</strong> ' . htmlspecialchars($e->getMessage()) . 
             '<br><strong>Archivo:</strong> ' . htmlspecialchars($e->getFile()) . 
             '<br><strong>Línea:</strong> ' . $e->getLine() . '</pre>';
    }
}
?>