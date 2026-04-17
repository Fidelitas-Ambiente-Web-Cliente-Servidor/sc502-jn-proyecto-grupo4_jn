<?php
require_once __DIR__ . '/../../CONFIG/database.php';
require_once __DIR__ . '/../models/Usuario.php';

class IndexController {
    private $model;

    public function __construct() {
        // No conectar a la BD en el constructor para permitir mostrar la página de login
        $this->model = null;
    }

    public function showLogin() {
        require __DIR__ . '/../views/index.php';
    }

    public function login() {
        try {
            // Conectar a la BD solo cuando se intente hacer login
            if ($this->model === null) {
                $this->model = new Usuario((new Database())->connect());
            }
            
            $usuario = $_POST['usuario'] ?? '';
            $clave   = $_POST['clave']   ?? '';
            $perfil  = $_POST['perfil']  ?? '';
            $u = $this->model->login($usuario);
            if ($u && password_verify($clave, $u['clave']) && $u['rol'] === $perfil) {
                $_SESSION['usuario'] = $u;
                echo json_encode(['response' => '00', 'rol' => $u['rol']]);
            } else {
                echo json_encode(['response' => '01', 'message' => 'Credenciales inválidas.']);
            }
        } catch (Exception $e) {
            echo json_encode(['response' => '01', 'message' => 'Error de conexión a la base de datos.']);
        }
    }
}
