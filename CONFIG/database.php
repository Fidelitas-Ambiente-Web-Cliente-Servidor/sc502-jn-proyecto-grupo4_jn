<?php
class Database {
    public function connect() {
        $conn = new mysqli(
            getenv('DB_HOST') ?: 'db',
            getenv('DB_USER') ?: 'root',
            getenv('DB_PASS') ?: 'example',
            getenv('DB_NAME') ?: 'aralias'
        );
        if ($conn->connect_error) die('Error: ' . $conn->connect_error);
        return $conn;
    }
}
