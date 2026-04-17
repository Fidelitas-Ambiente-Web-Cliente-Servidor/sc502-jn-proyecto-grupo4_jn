<?php
class Acceso {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function registrar($d, $uid) {
        $stmt = $this->conn->prepare('INSERT INTO accesos (tipo,nombre,placa,residencia,motivo,fecha_entrada,estado,registrado_por) VALUES (?,?,?,?,?,NOW(),"Dentro",?)');
        $t=$d['tipo']??'Persona'; $n=$d['nombre']??''; $p=$d['placa']??''; $r=$d['residencia']??''; $m=$d['motivo']??'';
        $stmt->bind_param('sssssi', $t, $n, $p, $r, $m, $uid);
        return $stmt->execute();
    }

    public function registrarSalida($id) {
        $stmt = $this->conn->prepare('UPDATE accesos SET fecha_salida=NOW(),estado="Salió" WHERE id=?');
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    public function getDentro() {
        return $this->conn->query('SELECT * FROM accesos WHERE estado="Dentro" ORDER BY fecha_entrada DESC')->fetch_all(MYSQLI_ASSOC);
    }

    public function getHoy() {
        return $this->conn->query('SELECT * FROM accesos WHERE DATE(fecha_entrada)=CURDATE() ORDER BY fecha_entrada DESC')->fetch_all(MYSQLI_ASSOC);
    }

    public function countDentro() {
        return (int)$this->conn->query('SELECT COUNT(*) c FROM accesos WHERE estado="Dentro"')->fetch_assoc()['c'];
    }
}
