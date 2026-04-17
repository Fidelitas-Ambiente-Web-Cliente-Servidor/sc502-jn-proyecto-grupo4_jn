<?php
class Database {
    private $host = 'db';
    private $db = 'appdb';
    private $user = 'appuser';
    private $pass = 'apppass';

    public function connect() {
        $conn = new mysqli(
            $this->host,
            $this->user,
            $this->pass,
            $this->db
        );

        if ($conn->connect_error) {
            die('Error conexion: ' . $conn->connect_error);
        }

        $conn->set_charset('utf8mb4');
        return $conn;
    }
}
