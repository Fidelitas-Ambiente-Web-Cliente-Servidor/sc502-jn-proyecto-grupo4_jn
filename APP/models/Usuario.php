<?php
class Usuario {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login($usuario) {
        $stmt = $this->conn->prepare('SELECT id,nombre,usuario,clave,rol FROM usuarios WHERE usuario=? LIMIT 1');
        $stmt->bind_param('s', $usuario);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
}
