<?php
class Paquete {
    private $conn;
    private $hasCamposExtrasPaquete = null;

    public function __construct($db) {
        $this->conn = $db;
    }

    private function ensureCamposExtrasPaquete() {
        if ($this->hasCamposExtrasPaquete !== null) {
            return $this->hasCamposExtrasPaquete;
        }

        $hasEmpresa = (bool)$this->conn->query("SHOW COLUMNS FROM FIDE_PAQUETES_TB LIKE 'EMPRESA'")->fetch_assoc();
        $hasDescripcion = (bool)$this->conn->query("SHOW COLUMNS FROM FIDE_PAQUETES_TB LIKE 'DESCRIPCION'")->fetch_assoc();

        if (!$hasEmpresa) {
            $this->conn->query('ALTER TABLE FIDE_PAQUETES_TB ADD COLUMN EMPRESA VARCHAR(120) NULL');
        }
        if (!$hasDescripcion) {
            $this->conn->query('ALTER TABLE FIDE_PAQUETES_TB ADD COLUMN DESCRIPCION VARCHAR(255) NULL');
        }

        $hasEmpresa = (bool)$this->conn->query("SHOW COLUMNS FROM FIDE_PAQUETES_TB LIKE 'EMPRESA'")->fetch_assoc();
        $hasDescripcion = (bool)$this->conn->query("SHOW COLUMNS FROM FIDE_PAQUETES_TB LIKE 'DESCRIPCION'")->fetch_assoc();
        $this->hasCamposExtrasPaquete = ($hasEmpresa && $hasDescripcion);
        return $this->hasCamposExtrasPaquete;
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

    private function getEstadoId($preferidos = ['Activo', 'Pendiente']) {
        $stmt = $this->conn->prepare(
            'SELECT ID_ESTADO
             FROM FIDE_ESTADOS_TB
             WHERE LOWER(NOMBRE_ESTADO) IN (?, ?)
             LIMIT 1'
        );
        $a = strtolower($preferidos[0] ?? 'activo');
        $b = strtolower($preferidos[1] ?? 'pendiente');
        $stmt->bind_param('ss', $a, $b);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) {
            return (int)$row['ID_ESTADO'];
        }

        $nuevoId = $this->nextId('FIDE_ESTADOS_TB', 'ID_ESTADO');
        $nombre = $preferidos[0] ?? 'Activo';
        $ins = $this->conn->prepare('INSERT INTO FIDE_ESTADOS_TB (ID_ESTADO, NOMBRE_ESTADO) VALUES (?, ?)');
        $ins->bind_param('is', $nuevoId, $nombre);
        $ins->execute();
        return $nuevoId;
    }

    private function getRolId($rol = 'residente') {
        $stmt = $this->conn->prepare('SELECT ID_ROL FROM FIDE_ROLES_TB WHERE LOWER(ROL)=? LIMIT 1');
        $valor = strtolower($rol);
        $stmt->bind_param('s', $valor);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) {
            return (int)$row['ID_ROL'];
        }

        $idEstado = $this->getEstadoId(['Activo', 'Pendiente']);
        $nuevoId = $this->nextId('FIDE_ROLES_TB', 'ID_ROL');
        $ins = $this->conn->prepare('INSERT INTO FIDE_ROLES_TB (ID_ROL, ROL, ID_ESTADO) VALUES (?, ?, ?)');
        $ins->bind_param('isi', $nuevoId, $rol, $idEstado);
        $ins->execute();
        return $nuevoId;
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

        $idEstado = $this->getEstadoId(['Activo', 'Pendiente']);
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

    private function getOrCreatePersona($destinatario) {
        $stmt = $this->conn->prepare(
            'SELECT ID_PERSONA
             FROM FIDE_PERSONAS_TB
             WHERE LOWER(CONCAT(
                 COALESCE(NOMBRE_EMPLEADO, ""), " ",
                 COALESCE(APELLIDO_PATERNO, ""), " ",
                 COALESCE(APELLIDO_MATERNO, "")
             )) = LOWER(?)
             LIMIT 1'
        );
        $nombre = trim($destinatario);
        $stmt->bind_param('s', $nombre);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) {
            $idPersona = (int)$row['ID_PERSONA'];
            $partes = preg_split('/\s+/', $nombre);
            $n = $partes[0] ?? 'Residente';
            $ap = $partes[1] ?? 'Temporal';
            $am = count($partes) > 2 ? implode(' ', array_slice($partes, 2)) : 'Sistema';
            $idRol = $this->getRolId('residente');
            $idEstado = $this->getEstadoId(['Activo', 'Pendiente']);

            $upd = $this->conn->prepare(
                'UPDATE FIDE_PERSONAS_TB
                 SET NOMBRE_EMPLEADO=?, APELLIDO_PATERNO=?, APELLIDO_MATERNO=?, ID_ROL=?, ID_ESTADO=?
                 WHERE ID_PERSONA=?'
            );
            $upd->bind_param('sssiii', $n, $ap, $am, $idRol, $idEstado, $idPersona);
            $upd->execute();

            return $idPersona;
        }

        $idPersona = $this->nextId('FIDE_PERSONAS_TB', 'ID_PERSONA');
        $partes = preg_split('/\s+/', $nombre);
        $n = $partes[0] ?? 'Residente';
        $ap = $partes[1] ?? 'Temporal';
        $am = $partes[2] ?? 'Sistema';
        $idRol = $this->getRolId('residente');
        $idEstado = $this->getEstadoId(['Activo', 'Pendiente']);
           $fechaRegistro = $this->ahoraCR();

        $ins = $this->conn->prepare(
            'INSERT INTO FIDE_PERSONAS_TB
             (ID_PERSONA, NOMBRE_EMPLEADO, APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_REGISTRO, ID_ROL, ID_ESTADO)
               VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
           $ins->bind_param('issssii', $idPersona, $n, $ap, $am, $fechaRegistro, $idRol, $idEstado);
        $ins->execute();

        return $idPersona;
    }

    public function registrar($d, $uid) {
        $destinatario = trim($d['destinatario'] ?? 'Residente');
        $idPersona = $this->getOrCreatePersona($destinatario);
        $idResidencia = $this->ensureResidencia($d['residencia'] ?? '1');
        $idEstado = 3;
        $fechaIngreso = $this->ahoraCR();
        $empresa = trim((string)($d['empresa'] ?? ''));
        $descripcion = trim((string)($d['descripcion'] ?? ''));

        if ($this->ensureCamposExtrasPaquete()) {
            $stmt = $this->conn->prepare(
                'INSERT INTO FIDE_PAQUETES_TB
                 (ID_PERSONA, ID_RESIDENCIA, FECHA_INGRESO, FECHA_SALIDA, ID_ESTADO, EMPRESA, DESCRIPCION)
                 VALUES (?, ?, ?, NULL, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    FECHA_INGRESO = VALUES(FECHA_INGRESO),
                    FECHA_SALIDA = NULL,
                    ID_ESTADO = VALUES(ID_ESTADO),
                    EMPRESA = VALUES(EMPRESA),
                    DESCRIPCION = VALUES(DESCRIPCION)'
            );
            $stmt->bind_param('iisiss', $idPersona, $idResidencia, $fechaIngreso, $idEstado, $empresa, $descripcion);
            return $stmt->execute();
        }

        $stmt = $this->conn->prepare(
            'INSERT INTO FIDE_PAQUETES_TB
             (ID_PERSONA, ID_RESIDENCIA, FECHA_INGRESO, FECHA_SALIDA, ID_ESTADO)
             VALUES (?, ?, ?, NULL, ?)
             ON DUPLICATE KEY UPDATE
                FECHA_INGRESO = VALUES(FECHA_INGRESO),
                FECHA_SALIDA = NULL,
                ID_ESTADO = VALUES(ID_ESTADO)'
        );
        $stmt->bind_param('iisi', $idPersona, $idResidencia, $fechaIngreso, $idEstado);
        return $stmt->execute();
    }

    public function entregar($id) {
        $idEstado = 11;
        $fechaSalida = $this->ahoraCR();
        $stmt = $this->conn->prepare('UPDATE FIDE_PAQUETES_TB SET FECHA_SALIDA=?, ID_ESTADO=? WHERE ID_PERSONA=? AND FECHA_SALIDA IS NULL AND ID_ESTADO=3');
        $stmt->bind_param('sii', $fechaSalida, $idEstado, $id);
        $ok = $stmt->execute();
        return $ok && $stmt->affected_rows > 0;
    }

    public function getPendientes() {
        $empresaExpr = $this->ensureCamposExtrasPaquete()
            ? 'COALESCE(NULLIF(TRIM(p.EMPRESA), ""), "—")'
            : '"—"';
        $descripcionExpr = $this->ensureCamposExtrasPaquete()
            ? 'COALESCE(NULLIF(TRIM(p.DESCRIPCION), ""), "—")'
            : '"—"';

        $sql =
            'SELECT
                p.ID_PERSONA AS id,
                TRIM(CONCAT(
                    COALESCE(per.NOMBRE_EMPLEADO, ""),
                    " ",
                    COALESCE(per.APELLIDO_PATERNO, ""),
                    " ",
                    COALESCE(per.APELLIDO_MATERNO, "")
                )) AS destinatario,
                CONCAT("Residencia ", p.ID_RESIDENCIA) AS residencia,
                 ' . $empresaExpr . ' AS empresa,
                 ' . $descripcionExpr . ' AS descripcion,
                DATE_FORMAT(p.FECHA_INGRESO, "%Y-%m-%d %H:%i:%s") AS fecha_recepcion,
                DATE_FORMAT(p.FECHA_SALIDA, "%Y-%m-%d %H:%i:%s") AS fecha_entrega,
                     CASE WHEN p.ID_ESTADO = 3 THEN "Pendiente" ELSE "Entregado" END AS estado
             FROM FIDE_PAQUETES_TB p
             INNER JOIN FIDE_PERSONAS_TB per ON per.ID_PERSONA = p.ID_PERSONA
                                 WHERE p.ID_ESTADO = 3
                             AND p.FECHA_SALIDA IS NULL
             ORDER BY p.FECHA_INGRESO DESC';
        return $this->conn->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    public function getHoy() {
        $fechaHoy = $this->fechaHoyCR();
        $empresaExpr = $this->ensureCamposExtrasPaquete()
            ? 'COALESCE(NULLIF(TRIM(p.EMPRESA), ""), "—")'
            : '"—"';
        $descripcionExpr = $this->ensureCamposExtrasPaquete()
            ? 'COALESCE(NULLIF(TRIM(p.DESCRIPCION), ""), "—")'
            : '"—"';

        $sql =
            'SELECT
                p.ID_PERSONA AS id,
                TRIM(CONCAT(
                    COALESCE(per.NOMBRE_EMPLEADO, ""),
                    " ",
                    COALESCE(per.APELLIDO_PATERNO, ""),
                    " ",
                    COALESCE(per.APELLIDO_MATERNO, "")
                )) AS destinatario,
                CONCAT("Residencia ", p.ID_RESIDENCIA) AS residencia,
                ' . $empresaExpr . ' AS empresa,
                ' . $descripcionExpr . ' AS descripcion,
                DATE_FORMAT(p.FECHA_INGRESO, "%Y-%m-%d %H:%i:%s") AS fecha_recepcion,
                DATE_FORMAT(p.FECHA_SALIDA, "%Y-%m-%d %H:%i:%s") AS fecha_entrega,
                CASE WHEN p.ID_ESTADO = 3 THEN "Pendiente" ELSE "Entregado" END AS estado
             FROM FIDE_PAQUETES_TB p
             INNER JOIN FIDE_PERSONAS_TB per ON per.ID_PERSONA = p.ID_PERSONA
                         WHERE DATE(p.FECHA_INGRESO) = ?
               AND p.ID_ESTADO IN (3, 11)
             ORDER BY p.FECHA_INGRESO DESC';
                $stmt = $this->conn->prepare($sql);
                $stmt->bind_param('s', $fechaHoy);
                $stmt->execute();
                return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

            public function getHistorial() {
                $empresaExpr = $this->ensureCamposExtrasPaquete()
                    ? 'COALESCE(NULLIF(TRIM(p.EMPRESA), ""), "—")'
                    : '"—"';
                $descripcionExpr = $this->ensureCamposExtrasPaquete()
                    ? 'COALESCE(NULLIF(TRIM(p.DESCRIPCION), ""), "—")'
                    : '"—"';

                $sql =
                    'SELECT
                        p.ID_PERSONA AS id,
                        TRIM(CONCAT(
                            COALESCE(per.NOMBRE_EMPLEADO, ""),
                            " ",
                            COALESCE(per.APELLIDO_PATERNO, ""),
                            " ",
                            COALESCE(per.APELLIDO_MATERNO, "")
                        )) AS destinatario,
                        CONCAT("Residencia ", p.ID_RESIDENCIA) AS residencia,
                        ' . $empresaExpr . ' AS empresa,
                        ' . $descripcionExpr . ' AS descripcion,
                        DATE_FORMAT(p.FECHA_INGRESO, "%Y-%m-%d %H:%i:%s") AS fecha_recepcion,
                        DATE_FORMAT(p.FECHA_SALIDA, "%Y-%m-%d %H:%i:%s") AS fecha_entrega,
                        CASE WHEN p.FECHA_SALIDA IS NULL THEN "Pendiente" ELSE "Entregado" END AS estado
                     FROM FIDE_PAQUETES_TB p
                     INNER JOIN FIDE_PERSONAS_TB per ON per.ID_PERSONA = p.ID_PERSONA
                     ORDER BY p.FECHA_INGRESO DESC';
                return $this->conn->query($sql)->fetch_all(MYSQLI_ASSOC);
            }

    public function countPendientes() {
        return (int)$this->conn->query('SELECT COUNT(*) c FROM FIDE_PAQUETES_TB WHERE ID_ESTADO = 3')->fetch_assoc()['c'];
    }
}
