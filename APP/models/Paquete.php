<?php
class Paquete {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
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

        $ins = $this->conn->prepare(
            'INSERT INTO FIDE_PERSONAS_TB
             (ID_PERSONA, NOMBRE_EMPLEADO, APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_REGISTRO, ID_ROL, ID_ESTADO)
             VALUES (?, ?, ?, ?, NOW(), ?, ?)'
        );
        $ins->bind_param('isssii', $idPersona, $n, $ap, $am, $idRol, $idEstado);
        $ins->execute();

        return $idPersona;
    }

    public function registrar($d, $uid) {
        $destinatario = trim($d['destinatario'] ?? 'Residente');
        $idPersona = $this->getOrCreatePersona($destinatario);
        $idResidencia = $this->ensureResidencia($d['residencia'] ?? '1');
        $idEstado = 3;

        $stmt = $this->conn->prepare(
            'INSERT INTO FIDE_PAQUETES_TB
             (ID_PERSONA, ID_RESIDENCIA, FECHA_INGRESO, FECHA_SALIDA, ID_ESTADO)
             VALUES (?, ?, NOW(), NULL, ?)
             ON DUPLICATE KEY UPDATE
                FECHA_INGRESO = NOW(),
                FECHA_SALIDA = NULL,
                ID_ESTADO = VALUES(ID_ESTADO)'
        );
        $stmt->bind_param('iii', $idPersona, $idResidencia, $idEstado);
        return $stmt->execute();
    }

    public function entregar($id) {
        $idEstado = 11;
        $stmt = $this->conn->prepare('UPDATE FIDE_PAQUETES_TB SET FECHA_SALIDA=NOW(), ID_ESTADO=? WHERE ID_PERSONA=? AND FECHA_SALIDA IS NULL');
        $stmt->bind_param('ii', $idEstado, $id);
        return $stmt->execute();
    }

    public function getPendientes() {
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
                NULL AS descripcion,
                NULL AS empresa,
                DATE_FORMAT(p.FECHA_INGRESO, "%Y-%m-%d %H:%i:%s") AS fecha_recepcion,
                DATE_FORMAT(p.FECHA_SALIDA, "%Y-%m-%d %H:%i:%s") AS fecha_entrega,
                     CASE WHEN p.ID_ESTADO = 3 THEN "Pendiente" ELSE "Entregado" END AS estado
             FROM FIDE_PAQUETES_TB p
             INNER JOIN FIDE_PERSONAS_TB per ON per.ID_PERSONA = p.ID_PERSONA
                 WHERE p.ID_ESTADO = 3
             ORDER BY p.FECHA_INGRESO DESC';
        return $this->conn->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    public function getHoy() {
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
                NULL AS descripcion,
                NULL AS empresa,
                DATE_FORMAT(p.FECHA_INGRESO, "%Y-%m-%d %H:%i:%s") AS fecha_recepcion,
                DATE_FORMAT(p.FECHA_SALIDA, "%Y-%m-%d %H:%i:%s") AS fecha_entrega,
                CASE WHEN p.ID_ESTADO = 3 THEN "Pendiente" ELSE "Entregado" END AS estado
             FROM FIDE_PAQUETES_TB p
             INNER JOIN FIDE_PERSONAS_TB per ON per.ID_PERSONA = p.ID_PERSONA
             WHERE DATE(p.FECHA_INGRESO) = CURDATE()
               AND p.ID_ESTADO IN (3, 11)
             ORDER BY p.FECHA_INGRESO DESC';
        return $this->conn->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    public function countPendientes() {
        return (int)$this->conn->query('SELECT COUNT(*) c FROM FIDE_PAQUETES_TB WHERE ID_ESTADO = 3')->fetch_assoc()['c'];
    }
}
