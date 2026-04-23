<?php
require_once __DIR__ . '/../../CONFIG/database.php';
require_once __DIR__ . '/../models/Acceso.php';
require_once __DIR__ . '/../models/Turno.php';

class AdminController {
    private $db;
    private $acceso;
    private $turno;

    public function __construct() {
        if (!isset($_SESSION['usuario'])) { 
            header('Location: index.php'); 
            exit; 
        }

        $this->db = null;
        $this->acceso = null;
        $this->turno = null;
    }

    private function connectIfNeeded() {
        if ($this->db === null) {
            $this->db = (new Database())->connect();

            if (!$this->db) {
                throw new Exception("No conecta BD");
            }

            $this->acceso = new Acceso($this->db);
            $this->turno = new Turno($this->db);

            if (!$this->acceso) {
                throw new Exception("No se creó Acceso");
            }

            if (!$this->turno) {
                throw new Exception("No se creó Turno");
            }
        }
    }

    public function index() {
        require __DIR__ . '/../views/admin.php';
    }

    public function getData($option) {
        try {
            $this->connectIfNeeded();
            $uid = $_SESSION['usuario']['id'] ?? null;

            switch ($option) {
                case 'get_accesos_admin':
                    echo json_encode([
                        'dentro' => $this->acceso->getDentro(),
                        'hoy' => $this->acceso->getHoy(),
                        'historial' => $this->acceso->getHistorial()
                    ]);
                    break;

                case 'get_roles_acceso_admin':
                    echo json_encode([
                        'roles_acceso' => $this->db->query(
                            'SELECT ID_ROL AS id, ROL AS rol 
                             FROM FIDE_ROLES_TB 
                             WHERE ID_ROL BETWEEN 3 AND 8 
                             ORDER BY ID_ROL ASC'
                        )->fetch_all(MYSQLI_ASSOC)
                    ]);
                    break;

                case 'get_turnos_admin':
                    echo json_encode([
                        'activo' => $this->turno->getActivo($uid),
                        'recientes' => $this->turno->getRecientes()
                    ]);
                    break;
            }
        } catch (Throwable $e) {
            echo json_encode([
                'response' => '01',
                'message' => $e->getMessage()
            ]);
        }
    }

    public function handle($option) {
        $uid = $_SESSION['usuario']['id'] ?? null;

        try {
            $this->connectIfNeeded();
            $ok = true;

            switch ($option) {
                case 'registrar_acceso_admin':
                    $ok = (bool)$this->acceso->registrar($_POST, $uid);
                    break;

                case 'registrar_salida_admin':
                    $identificador = $_POST['id'] ?? '';
                    $ok = (bool)$this->acceso->registrarSalida($identificador);
                    break;

                case 'iniciar_turno_admin':
                    $nombre = trim($_POST['guardia_nombre'] ?? '') ?: ($_SESSION['usuario']['nombre'] ?? 'Administrador');
                    $notas = $_POST['notas'] ?? '';
                    $ok = (bool)$this->turno->iniciar($nombre, $uid, $notas);
                    break;

                case 'finalizar_turno_admin':
                    $ok = (bool)$this->turno->finalizar($uid);
                    break;
            }

            if ($ok) {
                echo json_encode(['response' => '00']);
            } else {
                echo json_encode(['response' => '01', 'message' => 'No se pudo completar la acción.']);
            }
        } catch (Throwable $e) {
            echo json_encode([
                'response' => '01',
                'message' => $e->getMessage()
            ]);
        }
    }
}