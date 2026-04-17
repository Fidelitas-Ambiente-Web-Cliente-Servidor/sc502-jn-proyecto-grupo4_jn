<?php
class Visita {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function registrar($d, $uid) {
        $stmt = $this->conn->prepare('INSERT INTO visitas (nombre,cedula,residencia,motivo,fecha_entrada,estado,registrado_por) VALUES (?,?,?,?,NOW(),"Activa",?)');
        $n=$d['nombre']??''; $c=$d['cedula']??''; $r=$d['residencia']??''; $m=$d['motivo']??'';
        $stmt->bind_param('ssssi', $n, $c, $r, $m, $uid);
        return $stmt->execute();
    }

    public function checkout($id) {
        $stmt = $this->conn->prepare('UPDATE visitas SET fecha_salida=NOW(),estado="Finalizada" WHERE id=?');
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    public function getActivas() {
        return $this->conn->query('SELECT * FROM visitas WHERE estado="Activa" ORDER BY fecha_entrada DESC')->fetch_all(MYSQLI_ASSOC);
    }

    public function getHoy() {
        return $this->conn->query('SELECT * FROM visitas WHERE DATE(fecha_entrada)=CURDATE() ORDER BY fecha_entrada DESC')->fetch_all(MYSQLI_ASSOC);
    }

    public function countActivas() {
        return (int)$this->conn->query('SELECT COUNT(*) c FROM visitas WHERE estado="Activa"')->fetch_assoc()['c'];
    }
}
