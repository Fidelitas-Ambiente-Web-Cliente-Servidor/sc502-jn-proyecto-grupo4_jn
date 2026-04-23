<?php
class Acceso {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    private function ahoraCR() {
        return (new DateTime('now', new DateTimeZone('America/Costa_Rica')))->format('Y-m-d');
    }

    private function nextId($tabla, $columna) {
        $sql = "SELECT COALESCE(MAX($columna), 0) + 1 AS next_id FROM $tabla";
        $row = $this->conn->query($sql)->fetch_assoc();
        return (int)$row['next_id'];
    }

    private function getEstadoId($preferidos = ['ADENTRO', 'ACTIVO']) {
        foreach ($preferidos as $nombreEstado) {
            $stmt = $this->conn->prepare('SELECT ID_ESTADO FROM FIDE_ESTADOS_TB WHERE LOWER(NOMBRE_ESTADO)=? LIMIT 1');
            $valor = strtolower($nombreEstado);
            $stmt->bind_param('s', $valor);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if ($row) {
                return (int)$row['ID_ESTADO'];
            }
        }

        $nuevoId = $this->nextId('FIDE_ESTADOS_TB', 'ID_ESTADO');
        $nombre = $preferidos[0] ?? 'ACTIVO';
        $ins = $this->conn->prepare('INSERT INTO FIDE_ESTADOS_TB (ID_ESTADO, NOMBRE_ESTADO) VALUES (?, ?)');
        $ins->bind_param('is', $nuevoId, $nombre);
        $ins->execute();
        return $nuevoId;
    }

    private function getRolId($rol = 'PROVEEDOR') {
        $stmt = $this->conn->prepare('SELECT ID_ROL FROM FIDE_ROLES_TB WHERE LOWER(ROL)=? LIMIT 1');
        $valor = strtolower($rol);
        $stmt->bind_param('s', $valor);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) {
            return (int)$row['ID_ROL'];
        }

        $idEstado = $this->getEstadoId(['ACTIVO', 'ADENTRO']);
        $nuevoId = $this->nextId('FIDE_ROLES_TB', 'ID_ROL');
        $ins = $this->conn->prepare('INSERT INTO FIDE_ROLES_TB (ID_ROL, ROL, ID_ESTADO) VALUES (?, ?, ?)');
        $ins->bind_param('isi', $nuevoId, $rol, $idEstado);
        $ins->execute();
        return $nuevoId;
    }

    private function getTipoEspacioId() {
        $stmt = $this->conn->prepare('SELECT ID_TIPO_ESPACIO FROM FIDE_TIPOS_ESPACIOS_TB ORDER BY ID_TIPO_ESPACIO ASC LIMIT 1');
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) {
            return (int)$row['ID_TIPO_ESPACIO'];
        }

        $idEstado = $this->getEstadoId(['ACTIVO', 'ADENTRO']);
        $id = $this->nextId('FIDE_TIPOS_ESPACIOS_TB', 'ID_TIPO_ESPACIO');
        $nombre = 'General';
        $descr = 'Espacio general';
        $ins = $this->conn->prepare(
            'INSERT INTO FIDE_TIPOS_ESPACIOS_TB
             (ID_TIPO_ESPACIO, NOMBRE_ESPACIO, DESCR_ESPACIO, ID_ESTADO)
             VALUES (?, ?, ?, ?)'
        );
        $ins->bind_param('issi', $id, $nombre, $descr, $idEstado);
        $ins->execute();
        return $id;
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

        $idEstado = $this->getEstadoId(['ACTIVO', 'ADENTRO']);
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

    private function crearPersonaAcceso($nombre, $rol) {
        $idPersona = $this->nextId('FIDE_PERSONAS_TB', 'ID_PERSONA');
        $partes = preg_split('/\s+/', trim($nombre));
        $n = $partes[0] ?? 'Persona';
        $ap = $partes[1] ?? 'Acceso';
        $am = $partes[2] ?? 'Temporal';
        $idRol = $this->getRolId($rol);
        $idEstado = $this->getEstadoId(['ADENTRO', 'ACTIVO']);

           $fechaRegistro = $this->ahoraCR();
           $stmt = $this->conn->prepare(
            'INSERT INTO FIDE_PERSONAS_TB
             (ID_PERSONA, NOMBRE_EMPLEADO, APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_REGISTRO, ID_ROL, ID_ESTADO)
               VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
           $stmt->bind_param('issssii', $idPersona, $n, $ap, $am, $fechaRegistro, $idRol, $idEstado);
        $stmt->execute();
        return $idPersona;
    }

    private function actualizarPersonaAcceso($idPersona, $nombre, $rol) {
        $partes = preg_split('/\s+/', trim($nombre));
        $n = $partes[0] ?? 'Persona';
        $ap = $partes[1] ?? 'Acceso';
        $am = count($partes) > 2 ? implode(' ', array_slice($partes, 2)) : 'Temporal';
        $idRol = $this->getRolId($rol);
        $idEstado = $this->getEstadoId(['ADENTRO', 'ACTIVO']);

        $stmt = $this->conn->prepare(
            'UPDATE FIDE_PERSONAS_TB
             SET NOMBRE_EMPLEADO=?, APELLIDO_PATERNO=?, APELLIDO_MATERNO=?, ID_ROL=?, ID_ESTADO=?
             WHERE ID_PERSONA=?'
        );
        $stmt->bind_param('sssiii', $n, $ap, $am, $idRol, $idEstado, $idPersona);
        $stmt->execute();
    }

    public function registrar($d, $uid) {
        $nombre = trim($d['nombre'] ?? 'Conductor');
        $placa = trim($d['placa'] ?? '');
        $rol = trim((string)($d['rol'] ?? $d['tipo'] ?? 'vehiculo'));
        if ($placa === '') {
            return false;
        }

        $idPersona = 0;
        $checkVeh = $this->conn->prepare('SELECT ID_PERSONA FROM FIDE_VEHICULOS_TB WHERE PLACA=? LIMIT 1');
        $checkVeh->bind_param('s', $placa);
        $checkVeh->execute();
        $vehRow = $checkVeh->get_result()->fetch_assoc();
        if ($vehRow) {
            $idPersona = (int)$vehRow['ID_PERSONA'];
            $this->actualizarPersonaAcceso($idPersona, $nombre, $rol);
        } else {
            $idPersona = $this->crearPersonaAcceso($nombre, $rol);
        }

        $idResidencia = $this->ensureResidencia($d['residencia'] ?? '1');
        $idEstado = $this->getEstadoId(['ADENTRO', 'ACTIVO']);
        $idRol = $this->getRolId($rol);
        $fechaIngreso = $this->ahoraCR();

        $visita = $this->conn->prepare(
            'INSERT INTO FIDE_VISITAS_TB
             (ID_PERSONA, FECHA_INGRESO, FECHA_SALIDA, ID_RESIDENCIA, ID_ROL, ID_ESTADO)
             VALUES (?, ?, NULL, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
            FECHA_INGRESO = VALUES(FECHA_INGRESO),
                FECHA_SALIDA = NULL,
                ID_RESIDENCIA = VALUES(ID_RESIDENCIA),
                ID_ROL = VALUES(ID_ROL),
                ID_ESTADO = VALUES(ID_ESTADO)'
        );
        $visita->bind_param('isiii', $idPersona, $fechaIngreso, $idResidencia, $idRol, $idEstado);
        $ok = $visita->execute();

        if ($ok) {
            $tipoEspacio = $this->getTipoEspacioId();
            $veh = $this->conn->prepare(
                'INSERT INTO FIDE_VEHICULOS_TB
                 (PLACA, DESCRIPCION, ID_TIPO_ESPACIO, ID_PERSONA, ID_ESTADO)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    DESCRIPCION = VALUES(DESCRIPCION),
                    ID_PERSONA = VALUES(ID_PERSONA),
                    ID_ESTADO = VALUES(ID_ESTADO)'
            );
            $veh->bind_param('ssiii', $placa, $nombre, $tipoEspacio, $idPersona, $idEstado);
            $veh->execute();
        }

        return $ok;
    }

    public function registrarSalida($idOrPlaca) {
        $idEstadoSalidaVehiculo = $this->getEstadoId(['SALIO', 'AFUERA']);
        $idEstadoSalidaVisita = $this->getEstadoId(['SALIO', 'AFUERA']);
        $fechaSalida = $this->ahoraCR();

        $okVeh = false;
        $rowsVehActualizadas = 0;
        if (ctype_digit((string)$idOrPlaca)) {
            $idPersona = (int)$idOrPlaca;
            $v = $this->conn->prepare('UPDATE FIDE_VEHICULOS_TB SET ID_ESTADO=? WHERE ID_PERSONA=?');
            $v->bind_param('ii', $idEstadoSalidaVehiculo, $idPersona);
            $okVeh = $v->execute();
            $rowsVehActualizadas = $v->affected_rows;

            $vis = $this->conn->prepare('UPDATE FIDE_VISITAS_TB SET FECHA_SALIDA=?, ID_ESTADO=? WHERE ID_PERSONA=? AND FECHA_SALIDA IS NULL');
            $vis->bind_param('sii', $fechaSalida, $idEstadoSalidaVisita, $idPersona);
            $vis->execute();
        } else {
            $placa = trim((string)$idOrPlaca);
            $sel = $this->conn->prepare('SELECT ID_PERSONA FROM FIDE_VEHICULOS_TB WHERE PLACA=? LIMIT 1');
            $sel->bind_param('s', $placa);
            $sel->execute();
            $row = $sel->get_result()->fetch_assoc();
            if ($row) {
                $idPersona = (int)$row['ID_PERSONA'];
                $v = $this->conn->prepare('UPDATE FIDE_VEHICULOS_TB SET ID_ESTADO=? WHERE PLACA=?');
                $v->bind_param('is', $idEstadoSalidaVehiculo, $placa);
                $okVeh = $v->execute();
                $rowsVehActualizadas = $v->affected_rows;

                $vis = $this->conn->prepare('UPDATE FIDE_VISITAS_TB SET FECHA_SALIDA=?, ID_ESTADO=? WHERE ID_PERSONA=? AND FECHA_SALIDA IS NULL');
                $vis->bind_param('sii', $fechaSalida, $idEstadoSalidaVisita, $idPersona);
                $vis->execute();
            }
        }

        return $okVeh && $rowsVehActualizadas > 0;
    }

    public function eliminarLogico($idPersona) {
        $idEstadoInactivo = $this->getEstadoId(['INACTIVO']);
        $fechaSalida = $this->ahoraCR();

        $v = $this->conn->prepare('UPDATE FIDE_VEHICULOS_TB SET ID_ESTADO=? WHERE ID_PERSONA=?');
        $v->bind_param('ii', $idEstadoInactivo, $idPersona);
        $okVeh = $v->execute();

        $vis = $this->conn->prepare(
            'UPDATE FIDE_VISITAS_TB
             SET FECHA_SALIDA=COALESCE(FECHA_SALIDA, ?), ID_ESTADO=?
             WHERE ID_PERSONA=?'
        );
        $vis->bind_param('sii', $fechaSalida, $idEstadoInactivo, $idPersona);
        $okVis = $vis->execute();

        return ($okVeh || $okVis);
    }

    public function getDentro() {
        $sql =
            'SELECT
                veh.ID_PERSONA AS id,
                     r.ROL AS tipo,
                TRIM(CONCAT(
                    COALESCE(p.NOMBRE_EMPLEADO, ""),
                    " ",
                    COALESCE(p.APELLIDO_PATERNO, ""),
                    " ",
                    COALESCE(p.APELLIDO_MATERNO, "")
                )) AS nombre,
                veh.PLACA AS placa,
                CONCAT("Residencia ", COALESCE(v.ID_RESIDENCIA, "—")) AS residencia,
                DATE_FORMAT(v.FECHA_INGRESO, "%Y-%m-%d %H:%i:%s") AS fecha_entrada,
                     NULL AS fecha_salida,
                 COALESCE(e.NOMBRE_ESTADO, "—") AS estado
             FROM FIDE_VEHICULOS_TB veh
             INNER JOIN FIDE_PERSONAS_TB p ON p.ID_PERSONA = veh.ID_PERSONA
                 LEFT JOIN FIDE_VISITAS_TB v ON v.ID_PERSONA = veh.ID_PERSONA AND v.FECHA_SALIDA IS NULL
                 LEFT JOIN FIDE_ROLES_TB r ON r.ID_ROL = p.ID_ROL
             INNER JOIN FIDE_ESTADOS_TB e ON e.ID_ESTADO = veh.ID_ESTADO
             WHERE LOWER(e.NOMBRE_ESTADO) = "adentro"
             ORDER BY veh.PLACA ASC';
        return $this->conn->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    public function getHoy() {
        $fechaHoy = (new DateTime('now', new DateTimeZone('America/Costa_Rica')))->format('Y-m-d');
        $sql =
            'SELECT
                veh.ID_PERSONA AS id,
                     r.ROL AS tipo,
                TRIM(CONCAT(
                    COALESCE(p.NOMBRE_EMPLEADO, ""),
                    " ",
                    COALESCE(p.APELLIDO_PATERNO, ""),
                    " ",
                    COALESCE(p.APELLIDO_MATERNO, "")
                )) AS nombre,
                veh.PLACA AS placa,
                CONCAT("Residencia ", COALESCE(v.ID_RESIDENCIA, "—")) AS residencia,
                DATE_FORMAT(v.FECHA_INGRESO, "%Y-%m-%d %H:%i:%s") AS fecha_entrada,
                DATE_FORMAT(v.FECHA_SALIDA, "%Y-%m-%d %H:%i:%s") AS fecha_salida,
                COALESCE(e.NOMBRE_ESTADO, "—") AS estado
             FROM FIDE_VEHICULOS_TB veh
             INNER JOIN FIDE_PERSONAS_TB p ON p.ID_PERSONA = veh.ID_PERSONA
             LEFT JOIN (
                SELECT v1.*
                FROM FIDE_VISITAS_TB v1
                INNER JOIN (
                    SELECT ID_PERSONA, MAX(FECHA_INGRESO) AS MAX_FECHA_INGRESO
                    FROM FIDE_VISITAS_TB
                    GROUP BY ID_PERSONA
                ) v2 ON v2.ID_PERSONA = v1.ID_PERSONA
                    AND v2.MAX_FECHA_INGRESO = v1.FECHA_INGRESO
             ) v ON v.ID_PERSONA = veh.ID_PERSONA
                 LEFT JOIN FIDE_ROLES_TB r ON r.ID_ROL = p.ID_ROL
             INNER JOIN FIDE_ESTADOS_TB e ON e.ID_ESTADO = veh.ID_ESTADO
             WHERE LOWER(e.NOMBRE_ESTADO) IN ("adentro", "afuera", "salio")
               AND (
                                        DATE(v.FECHA_INGRESO) = ?
                                        OR DATE(v.FECHA_SALIDA) = ?
               )
             ORDER BY veh.PLACA ASC';
                $stmt = $this->conn->prepare($sql);
                $stmt->bind_param('ss', $fechaHoy, $fechaHoy);
                $stmt->execute();
                return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

            public function getHistorial() {
                $sql =
                    'SELECT
                        veh.ID_PERSONA AS id,
                             r.ROL AS tipo,
                        TRIM(CONCAT(
                            COALESCE(p.NOMBRE_EMPLEADO, ""),
                            " ",
                            COALESCE(p.APELLIDO_PATERNO, ""),
                            " ",
                            COALESCE(p.APELLIDO_MATERNO, "")
                        )) AS nombre,
                        veh.PLACA AS placa,
                        CONCAT("Residencia ", COALESCE(v.ID_RESIDENCIA, "—")) AS residencia,
                        DATE_FORMAT(v.FECHA_INGRESO, "%Y-%m-%d %H:%i:%s") AS fecha_entrada,
                        DATE_FORMAT(v.FECHA_SALIDA, "%Y-%m-%d %H:%i:%s") AS fecha_salida,
                        COALESCE(e.NOMBRE_ESTADO, "—") AS estado
                     FROM FIDE_VEHICULOS_TB veh
                     INNER JOIN FIDE_PERSONAS_TB p ON p.ID_PERSONA = veh.ID_PERSONA
                     LEFT JOIN (
                        SELECT v1.*
                        FROM FIDE_VISITAS_TB v1
                        INNER JOIN (
                            SELECT ID_PERSONA, MAX(FECHA_INGRESO) AS MAX_FECHA_INGRESO
                            FROM FIDE_VISITAS_TB
                            GROUP BY ID_PERSONA
                        ) v2 ON v2.ID_PERSONA = v1.ID_PERSONA
                            AND v2.MAX_FECHA_INGRESO = v1.FECHA_INGRESO
                     ) v ON v.ID_PERSONA = veh.ID_PERSONA
                         LEFT JOIN FIDE_ROLES_TB r ON r.ID_ROL = p.ID_ROL
                     INNER JOIN FIDE_ESTADOS_TB e ON e.ID_ESTADO = veh.ID_ESTADO
                     ORDER BY veh.PLACA ASC';
                return $this->conn->query($sql)->fetch_all(MYSQLI_ASSOC);
            }

    public function countDentro() {
        $sql =
            'SELECT COUNT(*) c
             FROM FIDE_VEHICULOS_TB veh
             INNER JOIN FIDE_ESTADOS_TB e ON e.ID_ESTADO = veh.ID_ESTADO
             WHERE LOWER(e.NOMBRE_ESTADO) = "adentro"';
        return (int)$this->conn->query($sql)->fetch_assoc()['c'];
    }
}
