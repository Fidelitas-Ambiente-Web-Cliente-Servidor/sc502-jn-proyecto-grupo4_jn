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
    private $testMode = false;

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
            if ($this->testMode) {
                $this->db = 'mock';
                return;
            }
            
            try {
                $this->db = (new Database())->connect();
                $this->visita  = new Visita($this->db);
                $this->paquete = new Paquete($this->db);
                $this->acceso  = new Acceso($this->db);
                $this->turno   = new Turno($this->db);
            } catch (Exception $e) {
                throw $e;
            }
        }
    }

    private function getMockData($type) {
        $mockData = [
            'roles' => [
                ['id' => 3, 'rol' => 'RESIDENTE'],
                ['id' => 4, 'rol' => 'VISITA'],
                ['id' => 5, 'rol' => 'TRABAJADOR'],
                ['id' => 6, 'rol' => 'PROVEEDOR'],
                ['id' => 7, 'rol' => 'TECNICO'],
                ['id' => 8, 'rol' => 'JARDINERO'],
            ],
            'visitas' => [
                ['id' => 1, 'nombre' => 'Juan Pérez', 'rol' => 'Visita', 'cedula' => '12345678', 'residencia' => 'Casa 5', 'motivo' => 'Visita familiar', 'fecha_entrada' => '2026-04-17 08:30:00', 'fecha_salida' => null, 'estado' => 'Adentro'],
                ['id' => 2, 'nombre' => 'María García', 'rol' => 'Proveedor', 'cedula' => '87654321', 'residencia' => 'Apto 3B', 'motivo' => 'Negocios', 'fecha_entrada' => '2026-04-17 09:15:00', 'fecha_salida' => null, 'estado' => 'Adentro'],
            ],
            'paquetes' => [
                ['id' => 1, 'destinatario' => 'Carlos López', 'residencia' => 'Casa 8', 'empresa' => 'Amazon', 'descripcion' => 'Caja mediana', 'fecha_recepcion' => '2026-04-17 10:00:00', 'fecha_entrega' => null, 'estado' => 'Pendiente'],
                ['id' => 2, 'destinatario' => 'Ana Martínez', 'residencia' => 'Apto 2A', 'empresa' => 'Correos CR', 'descripcion' => 'Sobre importante', 'fecha_recepcion' => '2026-04-17 10:45:00', 'fecha_entrega' => null, 'estado' => 'Pendiente'],
            ],
            'accesos' => [
                ['id' => 1, 'tipo' => 'Vehículo', 'nombre' => 'Técnico de mantenimiento', 'placa' => 'ABC-123', 'residencia' => 'Común', 'fecha_entrada' => '2026-04-17 07:00:00', 'fecha_salida' => null, 'estado' => 'Dentro'],
            ],
            'turnos' => [
                ['id' => 1, 'guardia_nombre' => 'Guardia Prueba', 'fecha_inicio' => '2026-04-17 06:00:00', 'fecha_fin' => null, 'estado' => 'Activo'],
            ]
        ];
        return $mockData[$type] ?? [];
    }

    public function index() {
        require __DIR__ . '/../views/guardia.php';
    }

    public function getData($option) {
        try {
            $this->connectIfNeeded();
            $uid = $_SESSION['usuario']['id'] ?? null;
            if ($this->testMode && $this->db === 'mock') {
                $visitas = $this->getMockData('visitas');
                $paquetes = $this->getMockData('paquetes');
                $accesos = $this->getMockData('accesos');
                $turnos = $this->getMockData('turnos');
                $roles = $this->getMockData('roles');
                
                switch ($option) {
                    case 'stats':
                        echo json_encode([
                            'visitas_activas' => count($visitas),
                            'paquetes_pendientes' => count($paquetes),
                            'accesos_dentro' => count($accesos),
                            'turno_activo' => $turnos[0] ?? null,
                            'visitas_list' => $visitas,
                            'paquetes_list' => $paquetes,
                        ]);
                        break;
                    case 'get_visitas':
                        echo json_encode(['activas' => $visitas, 'hoy' => $visitas]);
                        break;
                    case 'get_paquetes':
                        echo json_encode(['pendientes' => $paquetes, 'hoy' => $paquetes]);
                        break;
                    case 'get_accesos':
                        echo json_encode(['dentro' => $accesos, 'hoy' => $accesos]);
                        break;
                    case 'get_turnos':
                        echo json_encode(['activo' => $turnos[0] ?? null, 'recientes' => $turnos]);
                        break;
                    case 'get_roles':
                        echo json_encode([
                            'roles_visita' => array_values(array_filter($roles, function ($r) {
                                return isset($r['id']) && (int)$r['id'] >= 4 && (int)$r['id'] <= 8;
                            })),
                            'roles_acceso' => array_values(array_filter($roles, function ($r) {
                                return isset($r['id']) && (int)$r['id'] >= 3 && (int)$r['id'] <= 8;
                            })),
                        ]);
                        break;
                }
                return;
            }
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
                case 'get_roles':
                    echo json_encode([
                        'roles_visita' => $this->db->query('SELECT ID_ROL AS id, ROL AS rol FROM FIDE_ROLES_TB WHERE ID_ROL BETWEEN 4 AND 8 ORDER BY ID_ROL ASC')->fetch_all(MYSQLI_ASSOC),
                        'roles_acceso' => $this->db->query('SELECT ID_ROL AS id, ROL AS rol FROM FIDE_ROLES_TB WHERE ID_ROL BETWEEN 3 AND 8 ORDER BY ID_ROL ASC')->fetch_all(MYSQLI_ASSOC),
                    ]);
                    break;
            }
        } catch (Exception $e) {
            echo json_encode(['response' => '01', 'message' => 'Error de conexión.']);
        }
    }

    public function handle($option) {
        $uid = $_SESSION['usuario']['id'] ?? null;
        try {
            if ($this->testMode && ($this->db === null || $this->db === 'mock')) {
                echo json_encode(['response' => '00', 'message' => 'Acción simulada completada.']);
                return;
            }
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
