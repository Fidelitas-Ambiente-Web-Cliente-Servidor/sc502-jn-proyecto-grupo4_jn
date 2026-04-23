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
            $usuario = trim((string)($_POST['usuario'] ?? ''));
            $clave   = trim((string)($_POST['clave'] ?? ''));
            $perfil  = trim((string)($_POST['perfil'] ?? ''));

           
            if ($perfil === 'admin' && strcasecmp($usuario, 'administrador') === 0 && $clave === '12345') {
                $_SESSION['usuario'] = [
                    'id' => 900001,
                    'nombre' => 'Administrador',
                    'usuario' => 'administrador',
                    'rol' => 'admin',
                    'clave' => '12345'
                ];
                echo json_encode(['response' => '00', 'rol' => 'admin']);
                return;
            }

           
            if ($this->model === null) {
                $this->model = new Usuario((new Database())->connect());
            }

            $u = $this->model->login($usuario);
            $claveOk = false;
            if ($u) {
                $claveOk = password_verify($clave, $u['clave']) || hash_equals((string)$u['clave'], (string)$clave);
            }

            if ($u && $claveOk && $u['rol'] === $perfil) {
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
