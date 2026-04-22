<?php
class Visita {
    private $conn;
    private $rolVisitaMin = 4;
    private $rolVisitaMax = 8;

    public function __construct($db) {
        $this->conn = $db;
    }

    private function ahoraCR() {
        return (new DateTime('now', new DateTimeZone('America/Costa_Rica')))->format('Y-m-d');
    }

    private function fechaHoyCR() {
        return (new DateTime('now', new DateTimeZone('America/Costa_Rica')))->format('Y-m-d');
    }

    private function nextId($tabla, $columna) {
        $sql = "SELECT COALESCE(MAX($columna), 0) + 1 AS next_id FROM $tabla";
        $row = $this->conn->query($sql)->fetch_assoc();
        return (int)$row['next_id'];
    }

    private function getEstadoId($preferidos = ['ADENTRO', 'ACTIVO']) {
        foreach ($preferidos as $nombreEstado) {
            $stmt = $this->conn->prepare('SELECT ID_ESTADO FROM FIDE_ESTADOS_TB WHERE LOWER(NOMBRE_ESTADO)=? LIMIT 1');
            $valor = strtolower($nombreEstado);
            $stmt->bind_param('s', $valor);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if ($row) {
                return (int)$row['ID_ESTADO'];
            }
        }

        $nuevoId = $this->nextId('FIDE_ESTADOS_TB', 'ID_ESTADO');
        $nombre = $preferidos[0] ?? 'ADENTRO';
        $ins = $this->conn->prepare('INSERT INTO FIDE_ESTADOS_TB (ID_ESTADO, NOMBRE_ESTADO) VALUES (?, ?)');
        $ins->bind_param('is', $nuevoId, $nombre);
        $ins->execute();
        return $nuevoId;
    }

    private function getRolId($rol = 'visita') {
        $stmt = $this->conn->prepare('SELECT ID_ROL FROM FIDE_ROLES_TB WHERE LOWER(ROL)=? LIMIT 1');
        $valor = strtolower($rol);
        $stmt->bind_param('s', $valor);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) {
            return (int)$row['ID_ROL'];
        }

        $idEstado = $this->getEstadoId(['ADENTRO', 'ACTIVO']);
        $nuevoId = $this->nextId('FIDE_ROLES_TB', 'ID_ROL');
        $ins = $this->conn->prepare('INSERT INTO FIDE_ROLES_TB (ID_ROL, ROL, ID_ESTADO) VALUES (?, ?, ?)');
        $ins->bind_param('isi', $nuevoId, $rol, $idEstado);
        $ins->execute();
        return $nuevoId;
    }

    private function getRolVisitaId($rol = 'visita') {
        $rol = strtolower(trim((string)$rol));
        $stmt = $this->conn->prepare(
            'SELECT ID_ROL
             FROM FIDE_ROLES_TB
             WHERE LOWER(ROL)=?
               AND ID_ROL BETWEEN ? AND ?
             LIMIT 1'
        );
        $stmt->bind_param('sii', $rol, $this->rolVisitaMin, $this->rolVisitaMax);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) {
            return (int)$row['ID_ROL'];
        }

        return $this->rolVisitaMin;
    }

    private function descomponerNombre($nombreCompleto) {
        $partes = preg_split('/\s+/', trim($nombreCompleto));
        $nombre = $partes[0] ?? 'Visitante';
        $apellidoPaterno = $partes[1] ?? 'Temporal';
        return [$nombre, $apellidoPaterno];
    }

    private function crearPersonaVisita($idPersona, $nombreCompleto, $motivo, $idRol, $idEstado) {
        list($nombre, $apellidoPaterno) = $this->descomponerNombre($nombreCompleto);
        $apellidoMaterno = trim((string)$motivo);
        $fechaRegistro = $this->ahoraCR();

        $stmt = $this->conn->prepare(
            'INSERT INTO FIDE_PERSONAS_TB
             (ID_PERSONA, NOMBRE_EMPLEADO, APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_REGISTRO, ID_ROL, ID_ESTADO)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('issssii', $idPersona, $nombre, $apellidoPaterno, $apellidoMaterno, $fechaRegistro, $idRol, $idEstado);
        $stmt->execute();
    }

    private function actualizarPersonaVisita($idPersona, $nombreCompleto, $motivo, $idRol, $idEstado) {
        list($nombre, $apellidoPaterno) = $this->descomponerNombre($nombreCompleto);
        $apellidoMaterno = trim((string)$motivo);

        $stmt = $this->conn->prepare(
            'UPDATE FIDE_PERSONAS_TB
             SET NOMBRE_EMPLEADO=?, APELLIDO_PATERNO=?, APELLIDO_MATERNO=?, ID_ROL=?, ID_ESTADO=?
             WHERE ID_PERSONA=?'
        );
        $stmt->bind_param('sssiii', $nombre, $apellidoPaterno, $apellidoMaterno, $idRol, $idEstado, $idPersona);
        $stmt->execute();
    }

    private function buscarPersonaPorNombre($nombreCompleto) {
        $stmt = $this->conn->prepare(
            'SELECT ID_PERSONA
             FROM FIDE_PERSONAS_TB
             WHERE LOWER(TRIM(CONCAT(
                 COALESCE(NOMBRE_EMPLEADO, ""), " ",
                 COALESCE(APELLIDO_PATERNO, "")
             ))) = LOWER(TRIM(?))
             LIMIT 1'
        );
        $nombre = trim($nombreCompleto);
        $stmt->bind_param('s', $nombre);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        return $row ? (int)$row['ID_PERSONA'] : null;
    }

    private function getOrCreatePersonaVisita($nombreCompleto, $cedula, $motivo, $rol = 'visita') {
        $rol = trim((string)$rol) !== '' ? trim((string)$rol) : 'visita';
        $idRol = $this->getRolVisitaId($rol);
        $idEstado = $this->getEstadoId(['ADENTRO', 'ACTIVO']);

        $cedula = trim((string)$cedula);
        if ($cedula !== '' && ctype_digit($cedula)) {
            $idPersona = (int)$cedula;
            $check = $this->conn->prepare('SELECT ID_PERSONA FROM FIDE_PERSONAS_TB WHERE ID_PERSONA=? LIMIT 1');
            $check->bind_param('i', $idPersona);
            $check->execute();
            $exists = $check->get_result()->fetch_assoc();

            if ($exists) {
                $this->actualizarPersonaVisita($idPersona, $nombreCompleto, $motivo, $idRol, $idEstado);
                return $idPersona;
            }

            $this->crearPersonaVisita($idPersona, $nombreCompleto, $motivo, $idRol, $idEstado);
            return $idPersona;
        }

        $idPersonaNombre = $this->buscarPersonaPorNombre($nombreCompleto);
        if ($idPersonaNombre !== null) {
            $this->actualizarPersonaVisita($idPersonaNombre, $nombreCompleto, $motivo, $idRol, $idEstado);
            return $idPersonaNombre;
        }

        $idPersonaNuevo = $this->nextId('FIDE_PERSONAS_TB', 'ID_PERSONA');
        $this->crearPersonaVisita($idPersonaNuevo, $nombreCompleto, $motivo, $idRol, $idEstado);
        return $idPersonaNuevo;
    }

    private function normalizarResidencia($residencia) {
        preg_match('/\d+/', (string)$residencia, $m);
        return isset($m[0]) ? (int)$m[0] : 1;
    }

    private function getOrCreateTipoPago($idEstado) {
        $row = $this->conn->query('SELECT ID_TIPO_PAGO FROM FIDE_TIPOS_PAGO_TB ORDER BY ID_TIPO_PAGO ASC LIMIT 1')->fetch_assoc();
        if ($row) {
            return (int)$row['ID_TIPO_PAGO'];
        }

        $id = $this->nextId('FIDE_TIPOS_PAGO_TB', 'ID_TIPO_PAGO');
        $tipo = 'General';
        $ins = $this->conn->prepare('INSERT INTO FIDE_TIPOS_PAGO_TB (ID_TIPO_PAGO, TIPO, ID_ESTADO) VALUES (?, ?, ?)');
        $ins->bind_param('isi', $id, $tipo, $idEstado);
        $ins->execute();
        return $id;
    }

    private function ensureResidencia($residenciaTexto) {
        $idResidencia = $this->normalizarResidencia($residenciaTexto);
        $stmt = $this->conn->prepare('SELECT ID_RESIDENCIA FROM FIDE_RESIDENCIAS_TB WHERE ID_RESIDENCIA=? LIMIT 1');
        $stmt->bind_param('i', $idResidencia);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) {
            return $idResidencia;
        }

        $first = $this->conn->query('SELECT ID_RESIDENCIA FROM FIDE_RESIDENCIAS_TB ORDER BY ID_RESIDENCIA ASC LIMIT 1')->fetch_assoc();
        if ($first) {
            return (int)$first['ID_RESIDENCIA'];
        }

        $idEstado = $this->getEstadoId(['ADENTRO', 'ACTIVO']);
        $idTipoPago = $this->getOrCreateTipoPago($idEstado);
        $ins = $this->conn->prepare(
            'INSERT INTO FIDE_RESIDENCIAS_TB
             (ID_RESIDENCIA, MONTO_ALQUILER, MONTO_MANTENIMIENTO, ID_TIPO_PAGO, ID_ESTADO)
             VALUES (?, 0, 0, ?, ?)'
        );
        $ins->bind_param('iii', $idResidencia, $idTipoPago, $idEstado);
        $ins->execute();
        return $idResidencia;
    }

    public function registrar($d, $uid) {
        $nombre = trim($d['nombre'] ?? 'Visitante');
        $cedula = trim((string)($d['cedula'] ?? ''));
        $motivo = trim((string)($d['motivo'] ?? ''));
        $rol = trim((string)($d['rol'] ?? 'visita'));
        $idPersona = $this->getOrCreatePersonaVisita($nombre, $cedula, $motivo, $rol);
        $idResidencia = $this->ensureResidencia($d['residencia'] ?? '1');
        $idRol = $this->getRolVisitaId($rol);
        $idEstado = $this->getEstadoId(['ADENTRO', 'ACTIVO']);
        $fechaIngreso = $this->ahoraCR();

        $stmt = $this->conn->prepare(
            'INSERT INTO FIDE_VISITAS_TB
             (ID_PERSONA, FECHA_INGRESO, FECHA_SALIDA, ID_RESIDENCIA, ID_ROL, ID_ESTADO)
             VALUES (?, ?, NULL, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                FECHA_INGRESO = VALUES(FECHA_INGRESO),
                FECHA_SALIDA = NULL,
                ID_RESIDENCIA = VALUES(ID_RESIDENCIA),
                ID_ROL = VALUES(ID_ROL),
                ID_ESTADO = VALUES(ID_ESTADO)'
        );
        $stmt->bind_param('isiii', $idPersona, $fechaIngreso, $idResidencia, $idRol, $idEstado);
        return $stmt->execute();
    }

    public function checkout($id) {
        $idEstadoFinal = $this->getEstadoId(['AFUERA', 'SALIO']);
        $fechaSalida = $this->ahoraCR();
        $stmt = $this->conn->prepare('UPDATE FIDE_VISITAS_TB SET FECHA_SALIDA=?, ID_ESTADO=? WHERE ID_PERSONA=? AND FECHA_SALIDA IS NULL');
        $stmt->bind_param('sii', $fechaSalida, $idEstadoFinal, $id);
        $ok = $stmt->execute();
        return $ok && $stmt->affected_rows > 0;
    }

    private function queryVisitas($soloHoy = false) {
        $filtroFecha = $soloHoy ? 'AND (DATE(v.FECHA_INGRESO)=? OR DATE(v.FECHA_SALIDA)=?)' : '';
        $sql =
            'SELECT
                v.ID_PERSONA AS id,
                TRIM(CONCAT(
                    COALESCE(p.NOMBRE_EMPLEADO, ""),
                    " ",
                    COALESCE(p.APELLIDO_PATERNO, "")
                )) AS nombre,
                r.ROL AS rol,
                v.ID_PERSONA AS cedula,
                CONCAT("Residencia ", v.ID_RESIDENCIA) AS residencia,
                 COALESCE(NULLIF(TRIM(p.APELLIDO_MATERNO), ""), "—") AS motivo,
                DATE_FORMAT(v.FECHA_INGRESO, "%Y-%m-%d %H:%i:%s") AS fecha_entrada,
                DATE_FORMAT(v.FECHA_SALIDA, "%Y-%m-%d %H:%i:%s") AS fecha_salida,
                CASE WHEN v.FECHA_SALIDA IS NULL THEN "Adentro" ELSE "Afuera" END AS estado
             FROM FIDE_VISITAS_TB v
             INNER JOIN FIDE_PERSONAS_TB p ON p.ID_PERSONA = v.ID_PERSONA
             INNER JOIN FIDE_ROLES_TB r ON r.ID_ROL = v.ID_ROL
                 WHERE r.ID_ROL BETWEEN ' . (int)$this->rolVisitaMin . ' AND ' . (int)$this->rolVisitaMax . ' ' . $filtroFecha . '
             ORDER BY v.FECHA_INGRESO DESC';

        if (!$soloHoy) {
            return $this->conn->query($sql)->fetch_all(MYSQLI_ASSOC);
        }

        $fechaHoy = $this->fechaHoyCR();
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('ss', $fechaHoy, $fechaHoy);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function getActivas() {
        $sql =
            'SELECT
                v.ID_PERSONA AS id,
                TRIM(CONCAT(
                    COALESCE(p.NOMBRE_EMPLEADO, ""),
                    " ",
                    COALESCE(p.APELLIDO_PATERNO, "")
                )) AS nombre,
                r.ROL AS rol,
                v.ID_PERSONA AS cedula,
                CONCAT("Residencia ", v.ID_RESIDENCIA) AS residencia,
                 COALESCE(NULLIF(TRIM(p.APELLIDO_MATERNO), ""), "—") AS motivo,
                DATE_FORMAT(v.FECHA_INGRESO, "%Y-%m-%d %H:%i:%s") AS fecha_entrada,
                DATE_FORMAT(v.FECHA_SALIDA, "%Y-%m-%d %H:%i:%s") AS fecha_salida,
                "Adentro" AS estado
             FROM FIDE_VISITAS_TB v
             INNER JOIN FIDE_PERSONAS_TB p ON p.ID_PERSONA = v.ID_PERSONA
             INNER JOIN FIDE_ROLES_TB r ON r.ID_ROL = v.ID_ROL
                 WHERE r.ID_ROL BETWEEN ' . (int)$this->rolVisitaMin . ' AND ' . (int)$this->rolVisitaMax . '
               AND v.FECHA_SALIDA IS NULL
             ORDER BY v.FECHA_INGRESO DESC';
        return $this->conn->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    public function getHoy() {
        return $this->queryVisitas(true);
    }

    public function getHistorial() {
        $sql =
            'SELECT
                v.ID_PERSONA AS id,
                TRIM(CONCAT(
                    COALESCE(p.NOMBRE_EMPLEADO, ""),
                    " ",
                    COALESCE(p.APELLIDO_PATERNO, "")
                )) AS nombre,
                r.ROL AS rol,
                v.ID_PERSONA AS cedula,
                CONCAT("Residencia ", v.ID_RESIDENCIA) AS residencia,
                 COALESCE(NULLIF(TRIM(p.APELLIDO_MATERNO), ""), "—") AS motivo,
                DATE_FORMAT(v.FECHA_INGRESO, "%Y-%m-%d %H:%i:%s") AS fecha_entrada,
                DATE_FORMAT(v.FECHA_SALIDA, "%Y-%m-%d %H:%i:%s") AS fecha_salida,
                CASE WHEN v.FECHA_SALIDA IS NULL THEN "Adentro" ELSE "Afuera" END AS estado
             FROM FIDE_VISITAS_TB v
             INNER JOIN FIDE_PERSONAS_TB p ON p.ID_PERSONA = v.ID_PERSONA
             INNER JOIN FIDE_ROLES_TB r ON r.ID_ROL = v.ID_ROL
             ORDER BY v.FECHA_INGRESO DESC';
        return $this->conn->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    public function countActivas() {
        $sql =
            'SELECT COUNT(*) c
             FROM FIDE_VISITAS_TB v
             INNER JOIN FIDE_ROLES_TB r ON r.ID_ROL = v.ID_ROL
             WHERE r.ID_ROL BETWEEN ' . (int)$this->rolVisitaMin . ' AND ' . (int)$this->rolVisitaMax . '
               AND v.FECHA_SALIDA IS NULL';
        return (int)$this->conn->query($sql)->fetch_assoc()['c'];
    }
}
