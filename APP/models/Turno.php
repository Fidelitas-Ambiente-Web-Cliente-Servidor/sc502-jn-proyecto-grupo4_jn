<?php
class Turno {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function iniciar($nombre, $uid, $notas) {
        $stmt = $this->conn->prepare('UPDATE turnos SET fecha_fin=NOW(),estado="Finalizado" WHERE usuario_id=? AND estado="Activo"');
        $stmt->bind_param('i', $uid);
        $stmt->execute();
        $stmt = $this->conn->prepare('INSERT INTO turnos (guardia_nombre,fecha_inicio,notas,estado,usuario_id) VALUES (?,NOW(),?,"Activo",?)');
        $stmt->bind_param('ssi', $nombre, $notas, $uid);
        return $stmt->execute();
    }

    public function finalizar($id) {
        $stmt = $this->conn->prepare('UPDATE turnos SET fecha_fin=NOW(),estado="Finalizado" WHERE id=?');
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    public function getActivo($uid) {
        $stmt = $this->conn->prepare('SELECT * FROM turnos WHERE usuario_id=? AND estado="Activo" LIMIT 1');
        $stmt->bind_param('i', $uid);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function getRecientes($lim = 20) {
        $stmt = $this->conn->prepare('SELECT * FROM turnos ORDER BY fecha_inicio DESC LIMIT ?');
        $stmt->bind_param('i', $lim);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
}
