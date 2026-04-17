<?php
class Usuario {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login($usuario) {
        $stmt = $this->conn->prepare(
            'SELECT
                p.ID_PERSONA AS id,
                TRIM(CONCAT(
                    COALESCE(p.NOMBRE_EMPLEADO, ""),
                    " ",
                    COALESCE(p.APELLIDO_PATERNO, ""),
                    " ",
                    COALESCE(p.APELLIDO_MATERNO, "")
                )) AS nombre,
                CAST(p.ID_PERSONA AS CHAR) AS usuario,
                CAST(p.ID_PERSONA AS CHAR) AS clave,
                CASE
                    WHEN LOWER(r.ROL) IN ("admin", "administrador") THEN "admin"
                    WHEN p.ID_ROL = 1 THEN "admin"
                    ELSE "guardia"
                END AS rol
            FROM FIDE_PERSONAS_TB p
            INNER JOIN FIDE_ROLES_TB r ON r.ID_ROL = p.ID_ROL
            WHERE CAST(p.ID_PERSONA AS CHAR) = ?
            LIMIT 1'
        );
        $stmt->bind_param('s', $usuario);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
}
