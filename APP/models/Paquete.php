<?php
class Paquete {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function registrar($d, $uid) {
        $stmt = $this->conn->prepare('INSERT INTO paquetes (destinatario,residencia,descripcion,empresa,fecha_recepcion,estado,registrado_por) VALUES (?,?,?,?,NOW(),"Pendiente",?)');
        $de=$d['destinatario']??''; $r=$d['residencia']??''; $ds=$d['descripcion']??''; $e=$d['empresa']??'';
        $stmt->bind_param('ssssi', $de, $r, $ds, $e, $uid);
        return $stmt->execute();
    }

    public function entregar($id) {
        $stmt = $this->conn->prepare('UPDATE paquetes SET fecha_entrega=NOW(),estado="Entregado" WHERE id=?');
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    public function getPendientes() {
        return $this->conn->query('SELECT * FROM paquetes WHERE estado="Pendiente" ORDER BY fecha_recepcion DESC')->fetch_all(MYSQLI_ASSOC);
    }

    public function getHoy() {
        return $this->conn->query('SELECT * FROM paquetes WHERE DATE(fecha_recepcion)=CURDATE() ORDER BY fecha_recepcion DESC')->fetch_all(MYSQLI_ASSOC);
    }

    public function countPendientes() {
        return (int)$this->conn->query('SELECT COUNT(*) c FROM paquetes WHERE estado="Pendiente"')->fetch_assoc()['c'];
    }
}
