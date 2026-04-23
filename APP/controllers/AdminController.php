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

    private function nextId($tabla, $columna) {
        $sql = "SELECT COALESCE(MAX($columna), 0) + 1 AS next_id FROM $tabla";
        $row = $this->db->query($sql)->fetch_assoc();
        return (int)($row['next_id'] ?? 1);
    }

    private function ensureColumn($table, $column, $definition) {
        $exists = (bool)$this->db->query("SHOW COLUMNS FROM $table LIKE '$column'")->fetch_assoc();
        if (!$exists) {
            $this->db->query("ALTER TABLE $table ADD COLUMN $column $definition");
        }
    }

    private function ensureGestionSchema() {
        $this->ensureColumn('FIDE_RESIDENCIAS_TB', 'CODIGO', 'VARCHAR(60) NULL');
        $this->ensureColumn('FIDE_RESIDENCIAS_TB', 'TIPO', 'VARCHAR(60) NULL');
        $this->ensureColumn('FIDE_RESIDENCIAS_TB', 'BLOQUE', 'VARCHAR(60) NULL');
        $this->ensureColumn('FIDE_RESIDENCIAS_TB', 'CAPACIDAD', 'INT NULL');
        $this->ensureColumn('FIDE_PERSONAS_TB', 'TELEFONO', 'VARCHAR(30) NULL');
    }

    private function getEstadoId($preferidos = ['ACTIVO']) {
        foreach ($preferidos as $estado) {
            $stmt = $this->db->prepare('SELECT ID_ESTADO FROM FIDE_ESTADOS_TB WHERE LOWER(NOMBRE_ESTADO)=? LIMIT 1');
            $val = strtolower((string)$estado);
            $stmt->bind_param('s', $val);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if ($row) {
                return (int)$row['ID_ESTADO'];
            }
        }

        $id = $this->nextId('FIDE_ESTADOS_TB', 'ID_ESTADO');
        $nombre = strtoupper((string)($preferidos[0] ?? 'ACTIVO'));
        $ins = $this->db->prepare('INSERT INTO FIDE_ESTADOS_TB (ID_ESTADO, NOMBRE_ESTADO) VALUES (?, ?)');
        $ins->bind_param('is', $id, $nombre);
        $ins->execute();
        return $id;
    }

    private function getRolResidenteId() {
        $stmt = $this->db->prepare('SELECT ID_ROL FROM FIDE_ROLES_TB WHERE LOWER(ROL)="residente" LIMIT 1');
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) {
            return (int)$row['ID_ROL'];
        }

        $idEstado = $this->getEstadoId(['ACTIVO']);
        $idRol = $this->nextId('FIDE_ROLES_TB', 'ID_ROL');
        $rol = 'RESIDENTE';
        $ins = $this->db->prepare('INSERT INTO FIDE_ROLES_TB (ID_ROL, ROL, ID_ESTADO) VALUES (?, ?, ?)');
        $ins->bind_param('isi', $idRol, $rol, $idEstado);
        $ins->execute();
        return $idRol;
    }

    private function getOrCreateTipoPagoId() {
        $row = $this->db->query('SELECT ID_TIPO_PAGO FROM FIDE_TIPOS_PAGO_TB ORDER BY ID_TIPO_PAGO ASC LIMIT 1')->fetch_assoc();
        if ($row) {
            return (int)$row['ID_TIPO_PAGO'];
        }

        $idEstado = $this->getEstadoId(['ACTIVO']);
        $idTipo = $this->nextId('FIDE_TIPOS_PAGO_TB', 'ID_TIPO_PAGO');
        $tipo = 'GENERAL';
        $ins = $this->db->prepare('INSERT INTO FIDE_TIPOS_PAGO_TB (ID_TIPO_PAGO, TIPO, ID_ESTADO) VALUES (?, ?, ?)');
        $ins->bind_param('isi', $idTipo, $tipo, $idEstado);
        $ins->execute();
        return $idTipo;
    }

    private function parseResidenciaId($codigo, $fallbackId = 0) {
        if ($fallbackId > 0) {
            return $fallbackId;
        }
        preg_match('/\d+/', (string)$codigo, $m);
        if (!empty($m[0])) {
            return (int)$m[0];
        }
        return $this->nextId('FIDE_RESIDENCIAS_TB', 'ID_RESIDENCIA');
    }

    private function saveResidencia($data) {
        $this->ensureGestionSchema();

        $idEdit = (int)($data['id'] ?? 0);
        $codigo = trim((string)($data['codigo'] ?? ''));
        $tipo = trim((string)($data['tipo'] ?? 'Residencial'));
        $bloque = trim((string)($data['bloque'] ?? ''));
        $capacidad = max(1, (int)($data['capacidad'] ?? 1));
        $estadoTxt = trim((string)($data['estado'] ?? 'Disponible'));
        $idResidencia = $this->parseResidenciaId($codigo, $idEdit);
        $idEstado = $this->getEstadoId([$estadoTxt, 'ACTIVO', 'DISPONIBLE']);
        $idTipoPago = $this->getOrCreateTipoPagoId();

        $exists = $this->db->prepare('SELECT ID_RESIDENCIA FROM FIDE_RESIDENCIAS_TB WHERE ID_RESIDENCIA=? LIMIT 1');
        $exists->bind_param('i', $idResidencia);
        $exists->execute();
        $row = $exists->get_result()->fetch_assoc();

        if ($row) {
            $upd = $this->db->prepare(
                'UPDATE FIDE_RESIDENCIAS_TB
                 SET ID_ESTADO=?, CODIGO=?, TIPO=?, BLOQUE=?, CAPACIDAD=?
                 WHERE ID_RESIDENCIA=?'
            );
            $upd->bind_param('isssii', $idEstado, $codigo, $tipo, $bloque, $capacidad, $idResidencia);
            return $upd->execute();
        }

        $ins = $this->db->prepare(
            'INSERT INTO FIDE_RESIDENCIAS_TB
             (ID_RESIDENCIA, MONTO_ALQUILER, MONTO_MANTENIMIENTO, ID_TIPO_PAGO, ID_ESTADO, CODIGO, TIPO, BLOQUE, CAPACIDAD)
             VALUES (?, 0, 0, ?, ?, ?, ?, ?, ?)'
        );
        $ins->bind_param('iiisssi', $idResidencia, $idTipoPago, $idEstado, $codigo, $tipo, $bloque, $capacidad);
        return $ins->execute();
    }

    private function deleteResidencia($idResidencia) {
        $idEstado = $this->getEstadoId(['INACTIVO', 'ACTIVO']);
        $upd = $this->db->prepare('UPDATE FIDE_RESIDENCIAS_TB SET ID_ESTADO=? WHERE ID_RESIDENCIA=?');
        $upd->bind_param('ii', $idEstado, $idResidencia);
        $ok = $upd->execute();

        $updLinks = $this->db->prepare('UPDATE FIDE_RESIDENTES_TB SET ID_ESTADO=? WHERE ID_RESIDENCIA=?');
        $updLinks->bind_param('ii', $idEstado, $idResidencia);
        $okLinks = $updLinks->execute();

        return ($ok || $okLinks);
    }

    private function splitNombre($nombreCompleto) {
        $partes = preg_split('/\s+/', trim((string)$nombreCompleto));
        $n = $partes[0] ?? 'Condomino';
        $ap = $partes[1] ?? 'SinApellido';
        $am = count($partes) > 2 ? implode(' ', array_slice($partes, 2)) : '';
        return [$n, $ap, $am];
    }

    private function saveCondomino($data) {
        $this->ensureGestionSchema();

        $idEdit = (int)($data['id'] ?? 0);
        $nombre = trim((string)($data['nombre'] ?? ''));
        $identificacion = trim((string)($data['identificacion'] ?? ''));
        $telefono = trim((string)($data['telefono'] ?? ''));
        $idResidencia = (int)($data['residencia_id'] ?? 0);
        $estadoTxt = trim((string)($data['estado'] ?? 'Activo'));

        if ($idResidencia <= 0) {
            throw new Exception('Residencia inválida.');
        }

        $idEstado = $this->getEstadoId([$estadoTxt, 'ACTIVO']);
        $idRol = $this->getRolResidenteId();

        $idPersona = $idEdit;
        if ($idPersona <= 0 && ctype_digit($identificacion)) {
            $idPersona = (int)$identificacion;
        }
        if ($idPersona <= 0) {
            $idPersona = $this->nextId('FIDE_PERSONAS_TB', 'ID_PERSONA');
        }

        list($n, $ap, $am) = $this->splitNombre($nombre);
        $fechaReg = date('Y-m-d');

        $exists = $this->db->prepare('SELECT ID_PERSONA FROM FIDE_PERSONAS_TB WHERE ID_PERSONA=? LIMIT 1');
        $exists->bind_param('i', $idPersona);
        $exists->execute();
        $row = $exists->get_result()->fetch_assoc();

        if ($row) {
            $upd = $this->db->prepare(
                'UPDATE FIDE_PERSONAS_TB
                 SET NOMBRE_EMPLEADO=?, APELLIDO_PATERNO=?, APELLIDO_MATERNO=?, TELEFONO=?, ID_ROL=?, ID_ESTADO=?
                 WHERE ID_PERSONA=?'
            );
            $upd->bind_param('ssssiii', $n, $ap, $am, $telefono, $idRol, $idEstado, $idPersona);
            $upd->execute();
        } else {
            $ins = $this->db->prepare(
                'INSERT INTO FIDE_PERSONAS_TB
                 (ID_PERSONA, NOMBRE_EMPLEADO, APELLIDO_PATERNO, APELLIDO_MATERNO, TELEFONO, FECHA_REGISTRO, ID_ROL, ID_ESTADO)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $ins->bind_param('isssssii', $idPersona, $n, $ap, $am, $telefono, $fechaReg, $idRol, $idEstado);
            $ins->execute();
        }

        $delLinks = $this->db->prepare('DELETE FROM FIDE_RESIDENTES_TB WHERE ID_PERSONA=?');
        $delLinks->bind_param('i', $idPersona);
        $delLinks->execute();

        $insRes = $this->db->prepare(
            'INSERT INTO FIDE_RESIDENTES_TB (ID_PERSONA, ID_RESIDENCIA, ID_ESTADO)
             VALUES (?, ?, ?)'
        );
        $insRes->bind_param('iii', $idPersona, $idResidencia, $idEstado);
        return $insRes->execute();
    }

    private function deleteCondomino($idPersona) {
        $idEstado = $this->getEstadoId(['INACTIVO', 'ACTIVO']);

        $updLink = $this->db->prepare('UPDATE FIDE_RESIDENTES_TB SET ID_ESTADO=? WHERE ID_PERSONA=?');
        $updLink->bind_param('ii', $idEstado, $idPersona);
        $okLink = $updLink->execute();

        $updPerson = $this->db->prepare('UPDATE FIDE_PERSONAS_TB SET ID_ESTADO=? WHERE ID_PERSONA=?');
        $updPerson->bind_param('ii', $idEstado, $idPersona);
        $okPerson = $updPerson->execute();

        return ($okLink || $okPerson);
    }

    public function index() {
        require __DIR__ . '/../views/admin.php';
    }

    public function getData($option) {
        try {
            $this->connectIfNeeded();
            $this->ensureGestionSchema();
            $uid = $_SESSION['usuario']['id'] ?? null;

            switch ($option) {
                case 'get_gestion_admin':
                    $residencias = $this->db->query(
                        'SELECT
                            r.ID_RESIDENCIA AS id,
                            COALESCE(NULLIF(TRIM(r.CODIGO), ""), CONCAT("Residencia ", r.ID_RESIDENCIA)) AS codigo,
                            COALESCE(NULLIF(TRIM(r.TIPO), ""), "Residencial") AS tipo,
                            COALESCE(NULLIF(TRIM(r.BLOQUE), ""), "—") AS bloque,
                            COALESCE(NULLIF(r.CAPACIDAD, 0), 1) AS capacidad,
                            COUNT(DISTINCT re.ID_PERSONA) AS condominos,
                            COALESCE(e.NOMBRE_ESTADO, "ACTIVO") AS estado
                         FROM FIDE_RESIDENCIAS_TB r
                         LEFT JOIN FIDE_RESIDENTES_TB re ON re.ID_RESIDENCIA = r.ID_RESIDENCIA
                         LEFT JOIN FIDE_ESTADOS_TB e ON e.ID_ESTADO = r.ID_ESTADO
                         GROUP BY r.ID_RESIDENCIA, e.NOMBRE_ESTADO
                         ORDER BY r.ID_RESIDENCIA ASC'
                    )->fetch_all(MYSQLI_ASSOC);

                    $condominos = $this->db->query(
                        'SELECT
                            p.ID_PERSONA AS id,
                            TRIM(CONCAT(
                                COALESCE(p.NOMBRE_EMPLEADO, ""),
                                " ",
                                COALESCE(p.APELLIDO_PATERNO, ""),
                                " ",
                                COALESCE(p.APELLIDO_MATERNO, "")
                            )) AS nombre,
                            CAST(p.ID_PERSONA AS CHAR) AS identificacion,
                            COALESCE(NULLIF(TRIM(t.TELEFONO), ""), "—") AS telefono,
                            re.ID_RESIDENCIA AS residencia_id,
                            CONCAT("Residencia ", re.ID_RESIDENCIA) AS residencia_codigo,
                            COALESCE(e.NOMBRE_ESTADO, "ACTIVO") AS estado,
                            DATE_FORMAT(p.FECHA_REGISTRO, "%Y-%m-%d") AS fecha_registro
                         FROM FIDE_RESIDENTES_TB re
                         INNER JOIN FIDE_PERSONAS_TB p ON p.ID_PERSONA = re.ID_PERSONA
                         LEFT JOIN FIDE_TELEFONOS_TB t ON t.ID_PERSONA = p.ID_PERSONA
                         LEFT JOIN FIDE_ESTADOS_TB e ON e.ID_ESTADO = re.ID_ESTADO
                         ORDER BY p.FECHA_REGISTRO DESC, p.ID_PERSONA DESC'
                    )->fetch_all(MYSQLI_ASSOC);

                    $totalResidencias = count($residencias);
                    $totalCondominos = count($condominos);
                    $residenciasOcupadas = count(array_filter($residencias, function ($r) {
                        return ((int)($r['condominos'] ?? 0)) > 0;
                    }));

                    $cuposDisponibles = 0;
                    foreach ($residencias as $r) {
                        $cap = (int)($r['capacidad'] ?? 0);
                        $occ = (int)($r['condominos'] ?? 0);
                        $cuposDisponibles += max($cap - $occ, 0);
                    }

                    echo json_encode([
                        'residencias' => $residencias,
                        'condominos' => $condominos,
                        'resumen' => [
                            'total_residencias' => $totalResidencias,
                            'total_condominos' => $totalCondominos,
                            'residencias_ocupadas' => $residenciasOcupadas,
                            'cupos_disponibles' => $cuposDisponibles,
                        ],
                    ]);
                    break;

                case 'get_accesos_admin':
                    echo json_encode([
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
                case 'registrar_residencia_admin':
                    $ok = (bool)$this->saveResidencia($_POST);
                    break;

                case 'eliminar_residencia_admin':
                    $ok = (bool)$this->deleteResidencia((int)($_POST['id'] ?? 0));
                    break;

                case 'registrar_condomino_admin':
                    $ok = (bool)$this->saveCondomino($_POST);
                    break;

                case 'eliminar_condomino_admin':
                    $ok = (bool)$this->deleteCondomino((int)($_POST['id'] ?? 0));
                    break;

                case 'registrar_acceso_admin':
                    $ok = (bool)$this->acceso->registrar($_POST, $uid);
                    break;

                case 'registrar_salida_admin':
                    $identificador = $_POST['id'] ?? '';
                    $ok = (bool)$this->acceso->registrarSalida($identificador);
                    break;

                case 'eliminar_acceso_admin':
                    $ok = (bool)$this->acceso->eliminarLogico((int)($_POST['id'] ?? 0));
                    break;

                case 'guardar_turno_admin':
                    $ok = (bool)$this->turno->guardarGestion($_POST);
                    break;

                case 'eliminar_turno_admin':
                    $ok = (bool)$this->turno->eliminarGestionLogico(
                        (int)($_POST['id_persona'] ?? 0),
                        (int)($_POST['id_fechas'] ?? 0),
                        (int)($_POST['id_horario'] ?? 0)
                    );
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