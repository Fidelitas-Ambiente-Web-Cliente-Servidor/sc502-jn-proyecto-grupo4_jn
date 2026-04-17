<?php
class Turno {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    private function nextId($tabla, $columna) {
        $sql = "SELECT COALESCE(MAX($columna), 0) + 1 AS next_id FROM $tabla";
        $row = $this->conn->query($sql)->fetch_assoc();
        return (int)$row['next_id'];
    }

    private function getEstadoId($preferidos = ['Activo', 'Activa']) {
        $stmt = $this->conn->prepare(
            'SELECT ID_ESTADO
             FROM FIDE_ESTADOS_TB
             WHERE LOWER(NOMBRE_ESTADO) IN (?, ?)
             LIMIT 1'
        );
        $a = strtolower($preferidos[0] ?? 'activo');
        $b = strtolower($preferidos[1] ?? 'activa');
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

    private function ensureFechaTurnoHoy($idEstado) {
        $stmt = $this->conn->prepare('SELECT ID_FECHAS FROM FIDE_FECHAS_TURNOS_TB WHERE DATE(FECHAS_TURNO)=CURDATE() LIMIT 1');
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) {
            return (int)$row['ID_FECHAS'];
        }

        $id = $this->nextId('FIDE_FECHAS_TURNOS_TB', 'ID_FECHAS');
        $ins = $this->conn->prepare('INSERT INTO FIDE_FECHAS_TURNOS_TB (ID_FECHAS, FECHAS_TURNO, ID_ESTADO) VALUES (?, CURDATE(), ?)');
        $ins->bind_param('ii', $id, $idEstado);
        $ins->execute();
        return $id;
    }

    private function createHorario($idEstado) {
        $row = $this->conn->query('SELECT ID_HORARIO FROM FIDE_HORARIOS_TURNOS_TB ORDER BY ID_HORARIO ASC LIMIT 1')->fetch_assoc();
        if ($row) {
            return (int)$row['ID_HORARIO'];
        }

        $id = $this->nextId('FIDE_HORARIOS_TURNOS_TB', 'ID_HORARIO');
        $hora = date('H:i');
        $ins = $this->conn->prepare('INSERT INTO FIDE_HORARIOS_TURNOS_TB (ID_HORARIO, HORARIO_TURNO, ID_ESTADO) VALUES (?, ?, ?)');
        $ins->bind_param('isi', $id, $hora, $idEstado);
        $ins->execute();
        return $id;
    }

    public function iniciar($nombre, $uid, $notas) {
        $estadoActivo = $this->getEstadoId(['Activo', 'Activa']);
        $estadoFinal = $this->getEstadoId(['Finalizado', 'Inactivo']);

        $fin = $this->conn->prepare('UPDATE FIDE_TURNOS_TB SET ID_ESTADO=? WHERE ID_PERSONA=? AND ID_ESTADO=?');
        $fin->bind_param('iii', $estadoFinal, $uid, $estadoActivo);
        $fin->execute();

        $idFecha = $this->ensureFechaTurnoHoy($estadoActivo);
        $idHorario = $this->createHorario($estadoActivo);

        $ins = $this->conn->prepare('INSERT INTO FIDE_TURNOS_TB (ID_PERSONA, ID_FECHAS, ID_HORARIO, ID_ESTADO) VALUES (?, ?, ?, ?)');
        $ins->bind_param('iiii', $uid, $idFecha, $idHorario, $estadoActivo);
        return $ins->execute();
    }

    public function finalizar($id) {
        $estadoActivo = $this->getEstadoId(['Activo', 'Activa']);
        $estadoFinal = $this->getEstadoId(['Finalizado', 'Inactivo']);
        $stmt = $this->conn->prepare('UPDATE FIDE_TURNOS_TB SET ID_ESTADO=? WHERE ID_PERSONA=? AND ID_ESTADO=?');
        $stmt->bind_param('iii', $estadoFinal, $id, $estadoActivo);
        return $stmt->execute();
    }

    public function getActivo($uid) {
        $estadoActivo = $this->getEstadoId(['Activo', 'Activa']);
        $stmt = $this->conn->prepare(
            'SELECT
                t.ID_PERSONA AS id,
                TRIM(CONCAT(
                    COALESCE(p.NOMBRE_EMPLEADO, ""),
                    " ",
                    COALESCE(p.APELLIDO_PATERNO, ""),
                    " ",
                    COALESCE(p.APELLIDO_MATERNO, "")
                )) AS guardia_nombre,
                CONCAT(DATE_FORMAT(f.FECHAS_TURNO, "%Y-%m-%d"), " 00:00:00") AS fecha_inicio,
                NULL AS fecha_fin,
                "Activo" AS estado
             FROM FIDE_TURNOS_TB t
             INNER JOIN FIDE_PERSONAS_TB p ON p.ID_PERSONA = t.ID_PERSONA
             INNER JOIN FIDE_FECHAS_TURNOS_TB f ON f.ID_FECHAS = t.ID_FECHAS
             INNER JOIN FIDE_HORARIOS_TURNOS_TB h ON h.ID_HORARIO = t.ID_HORARIO
             WHERE t.ID_PERSONA=? AND t.ID_ESTADO=?
             ORDER BY f.FECHAS_TURNO DESC, h.ID_HORARIO DESC
             LIMIT 1'
        );
        $stmt->bind_param('ii', $uid, $estadoActivo);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function getRecientes($lim = 20) {
        $stmt = $this->conn->prepare(
            'SELECT
                t.ID_PERSONA AS id,
                TRIM(CONCAT(
                    COALESCE(p.NOMBRE_EMPLEADO, ""),
                    " ",
                    COALESCE(p.APELLIDO_PATERNO, ""),
                    " ",
                    COALESCE(p.APELLIDO_MATERNO, "")
                )) AS guardia_nombre,
                 CONCAT(DATE_FORMAT(f.FECHAS_TURNO, "%Y-%m-%d"), " 00:00:00") AS fecha_inicio,
                CASE WHEN e.NOMBRE_ESTADO IS NOT NULL AND LOWER(e.NOMBRE_ESTADO) IN ("activo", "activa")
                     THEN NULL
                     ELSE CONCAT(DATE_FORMAT(f.FECHAS_TURNO, "%Y-%m-%d"), " 00:00:00")
                END AS fecha_fin,
                CASE WHEN e.NOMBRE_ESTADO IS NOT NULL AND LOWER(e.NOMBRE_ESTADO) IN ("activo", "activa")
                     THEN "Activo"
                     ELSE "Finalizado"
                END AS estado
             FROM FIDE_TURNOS_TB t
             INNER JOIN FIDE_PERSONAS_TB p ON p.ID_PERSONA = t.ID_PERSONA
             INNER JOIN FIDE_FECHAS_TURNOS_TB f ON f.ID_FECHAS = t.ID_FECHAS
             INNER JOIN FIDE_HORARIOS_TURNOS_TB h ON h.ID_HORARIO = t.ID_HORARIO
             LEFT JOIN FIDE_ESTADOS_TB e ON e.ID_ESTADO = t.ID_ESTADO
             ORDER BY f.FECHAS_TURNO DESC, h.ID_HORARIO DESC
             LIMIT ?'
        );
        $stmt->bind_param('i', $lim);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
}
