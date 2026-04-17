<?php
require_once __DIR__ . '/../../CONFIG/database.php';
require_once __DIR__ . '/../models/Visita.php';
require_once __DIR__ . '/../models/Paquete.php';
require_once __DIR__ . '/../models/Acceso.php';
require_once __DIR__ . '/../models/Turno.php';

class GuardiaController {
    private $visita;
    private $paquete;
    private $acceso;
    private $turno;
    private $db;

    public function __construct() {
        if (!isset($_SESSION['usuario'])) { 
            header('Location: index.php'); 
            exit; 
        }
        // No conectar a la BD aquí, solo cuando sea necesario
        $this->visita  = null;
        $this->paquete = null;
        $this->acceso  = null;
        $this->turno   = null;
        $this->db      = null;
    }

    private function connectIfNeeded() {
        if ($this->db === null) {
            $this->db = (new Database())->connect();
            $this->visita  = new Visita($this->db);
            $this->paquete = new Paquete($this->db);
            $this->acceso  = new Acceso($this->db);
            $this->turno   = new Turno($this->db);
        }
    }

    public function index() {
        require __DIR__ . '/../views/guardia.php';
    }

    public function getData($option) {
        try {
            $this->connectIfNeeded();
            $uid = $_SESSION['usuario']['id'] ?? null;
            switch ($option) {
                case 'stats':
                    echo json_encode([
                        'visitas_activas'    => $this->visita->countActivas(),
                        'paquetes_pendientes'=> $this->paquete->countPendientes(),
                        'accesos_dentro'     => $this->acceso->countDentro(),
                        'turno_activo'       => $this->turno->getActivo($uid),
                        'visitas_list'       => $this->visita->getActivas(),
                        'paquetes_list'      => $this->paquete->getPendientes(),
                    ]);
                    break;
                case 'get_visitas':
                    echo json_encode(['activas' => $this->visita->getActivas(), 'hoy' => $this->visita->getHoy()]);
                    break;
                case 'get_paquetes':
                    echo json_encode(['pendientes' => $this->paquete->getPendientes(), 'hoy' => $this->paquete->getHoy()]);
                    break;
                case 'get_accesos':
                    echo json_encode(['dentro' => $this->acceso->getDentro(), 'hoy' => $this->acceso->getHoy()]);
                    break;
                case 'get_turnos':
                    echo json_encode(['activo' => $this->turno->getActivo($uid), 'recientes' => $this->turno->getRecientes()]);
                    break;
            }
        } catch (Exception $e) {
            echo json_encode(['response' => '01', 'message' => 'Error de conexión.']);
        }
    }

    public function handle($option) {
        $uid = $_SESSION['usuario']['id'] ?? null;
        try {
            $this->connectIfNeeded();
            switch ($option) {
                case 'registrar_visita':   $this->visita->registrar($_POST, $uid); break;
                case 'checkout_visita':    $this->visita->checkout((int)$_POST['id']); break;
                case 'registrar_paquete':  $this->paquete->registrar($_POST, $uid); break;
                case 'entregar_paquete':   $this->paquete->entregar((int)$_POST['id']); break;
                case 'registrar_acceso':   $this->acceso->registrar($_POST, $uid); break;
                case 'registrar_salida':   $this->acceso->registrarSalida((int)$_POST['id']); break;
                case 'iniciar_turno':
                    $nombre = trim($_POST['guardia_nombre'] ?? '') ?: ($_SESSION['usuario']['nombre'] ?? 'Guardia');
                    $this->turno->iniciar($nombre, $uid, $_POST['notas'] ?? '');
                    break;
                case 'finalizar_turno':    $this->turno->finalizar((int)$_POST['id']); break;
            }
            echo json_encode(['response' => '00']);
        } catch (Exception $e) {
            echo json_encode(['response' => '01', 'message' => 'Error de conexión.']);
        }
    }
}
