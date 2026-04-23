<?php
$titulo = 'Panel Administrador – Las Aralias';
$pageJs = 'PUBLIC/js/admin.js';
include __DIR__ . '/header.php';
$nombreAdmin = htmlspecialchars($_SESSION['usuario']['nombre'] ?? 'Administrador', ENT_QUOTES);
?>
<nav class="navbar navbar-expand-lg">
    <div class="container-fluid">
        <span class="navbar-brand"><i class="fa-solid fa-user-tie"></i> Admin &mdash; <?php echo $nombreAdmin; ?></span>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navAdmin">
            <span class="navbar-toggler-icon" style="filter:invert(1)"></span>
        </button>

        <div class="collapse navbar-collapse" id="navAdmin">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <li class="nav-item">
                    <a class="nav-link nav-sec" href="#" data-sec="reportes">
                        <i class="fa-solid fa-chart-column"></i> Resumen del día
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link nav-sec" href="#" data-sec="gestion">
                        <i class="fa-solid fa-building-user"></i> Gestión de apartamentos y condóminos
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link nav-sec" href="#" data-sec="accesos-admin">
                        <i class="fa-solid fa-road-barrier"></i> Control de accesos
                    </a>
                </li>
            </ul>
            <a href="logout.php" class="nav-link nav-logout ms-3">
                <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
            </a>
        </div>
    </div>
</nav>

<div id="alertaGlobal" style="display:none"></div>

<main>

    <section class="seccion" id="sec-reportes">
        <h2><i class="fa-solid fa-chart-column"></i> Resumen del día</h2>

        <div class="resumen-inicio">
            <div class="tarjeta-resumen">
                <div class="icono-tarjeta"><i class="fa-solid fa-building"></i></div>
                <h3 id="rep-total-residencias">—</h3>
                <p>Total de residencias</p>
            </div>

            <div class="tarjeta-resumen">
                <div class="icono-tarjeta"><i class="fa-solid fa-users"></i></div>
                <h3 id="rep-total-condominos">—</h3>
                <p>Total de condóminos</p>
            </div>

            <div class="tarjeta-resumen">
                <div class="icono-tarjeta"><i class="fa-solid fa-house-user"></i></div>
                <h3 id="rep-residencias-ocupadas">—</h3>
                <p>Residencias ocupadas</p>
            </div>

            <div class="tarjeta-resumen">
                <div class="icono-tarjeta"><i class="fa-solid fa-bed"></i></div>
                <h3 id="rep-cupos-disponibles">—</h3>
                <p>Cupos disponibles</p>
            </div>
        </div>

        <div class="contenedor-principal">
            <div class="bloque-tabla">
                <h3 class="subtitulo-bloque">
                    <i class="fa-solid fa-user-clock"></i> Últimos condóminos registrados
                </h3>
                <table id="tbl-reporte-condominos">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nombre</th>
                            <th>Identificación</th>
                            <th>Residencia</th>
                            <th>Estado</th>
                            <th>Registro</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>

                <h3 class="subtitulo-bloque" style="margin-top:22px">
                    <i class="fa-solid fa-building-circle-check"></i> Resumen de residencias
                </h3>
                <table id="tbl-reporte-residencias">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Código</th>
                            <th>Tipo</th>
                            <th>Bloque / Torre</th>
                            <th>Capacidad</th>
                            <th>Condóminos</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </section>

    <section class="seccion" id="sec-gestion">
        <h2><i class="fa-solid fa-building-user"></i> Gestión de apartamentos y condóminos</h2>

        <div class="contenedor-principal">
            <div class="bloque-tabla">
                <h3><i class="fa-solid fa-building"></i> Residencias registradas</h3>
                <table id="tbl-residencias">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Código</th>
                            <th>Tipo</th>
                            <th>Bloque / Torre</th>
                            <th>Capacidad</th>
                            <th>Condóminos</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>

                <h3 style="margin-top:22px"><i class="fa-solid fa-users"></i> Condóminos registrados</h3>
                <table id="tbl-condominos">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nombre</th>
                            <th>Identificación</th>
                            <th>Teléfono</th>
                            <th>Residencia</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <div class="bloque-formulario">
                <div class="form-card">
                    <h3 id="tituloFormResidencia"><i class="fa-solid fa-building"></i> Registrar residencia</h3>
                    <form id="formResidencia">
                        <input type="hidden" name="id" id="res_id">

                        <label>Código / Número *</label>
                        <input type="text" name="codigo" id="res_codigo" required>

                        <label>Tipo *</label>
                        <input type="text" name="tipo" id="res_tipo" required>

                        <label>Bloque / Torre</label>
                        <input type="text" name="bloque" id="res_bloque">

                        <label>Capacidad *</label>
                        <input type="number" name="capacidad" id="res_capacidad" min="1" required>

                        <label>Estado *</label>
                        <select name="estado" id="res_estado" required>
                            <option value="Disponible">Disponible</option>
                            <option value="Ocupada">Ocupada</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Inactiva">Inactiva</option>
                        </select>

                        <button type="submit">
                            <i class="fa-solid fa-check"></i> Guardar residencia
                        </button>
                        <button type="reset" class="btn-limpiar" id="btnLimpiarResidencia">
                            <i class="fa-solid fa-broom"></i> Limpiar
                        </button>
                    </form>
                </div>

                <div class="form-card" style="margin-top:22px">
                    <h3 id="tituloFormCondomino"><i class="fa-solid fa-user-plus"></i> Registrar condómino</h3>
                    <form id="formCondomino">
                        <input type="hidden" name="id" id="cond_id">

                        <label>Nombre completo *</label>
                        <input type="text" name="nombre" id="cond_nombre" required>

                        <label>Identificación *</label>
                        <input type="text" name="identificacion" id="cond_identificacion" required>

                        <label>Teléfono *</label>
                        <input type="text" name="telefono" id="cond_telefono" required>

                        <label>Residencia *</label>
                        <select name="residencia_id" id="cond_residencia" required></select>

                        <label>Estado *</label>
                        <select name="estado" id="cond_estado" required>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>

                        <button type="submit">
                            <i class="fa-solid fa-check"></i> Guardar condómino
                        </button>
                        <button type="reset" class="btn-limpiar" id="btnLimpiarCondomino">
                            <i class="fa-solid fa-broom"></i> Limpiar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <section class="seccion" id="sec-accesos-admin" style="display:none;">
        <h2><i class="fa-solid fa-road-barrier"></i> Control de accesos</h2>
        <p>Registros de entrada y salida de visitas y gestión de cambios de turno.</p>

        <div class="contenedor-principal">
            <div class="bloque-tabla">
                <h3>Accesos dentro</h3>
                <table id="acc-dentro-admin">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tipo</th>
                            <th>Nombre</th>
                            <th>Placa</th>
                            <th>Residencia</th>
                            <th>Entrada</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>

                <h3>Accesos de hoy</h3>
                <table id="acc-hoy-admin">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tipo</th>
                            <th>Nombre</th>
                            <th>Placa</th>
                            <th>Entrada</th>
                            <th>Salida</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>

                <h3>Historial de accesos</h3>
                <table id="acc-hist-admin">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tipo</th>
                            <th>Nombre</th>
                            <th>Placa</th>
                            <th>Entrada</th>
                            <th>Salida</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>

                <h3>Turno actual</h3>
                <div id="turno-activo-admin"></div>

                <h3>Turnos recientes</h3>
                <table id="turnos-admin">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Guardia</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <div class="bloque-formulario">
                <h3>Registrar acceso</h3>
                <form id="formAccesoAdmin">
                    <label>Rol</label>
                    <select id="a_rol_admin" name="rol"></select>

                    <label>Nombre</label>
                    <input type="text" id="a_nombre_admin" name="nombre">

                    <label>Placa</label>
                    <input type="text" id="a_placa_admin" name="placa">

                    <label>Residencia</label>
                    <input type="text" id="a_residencia_admin" name="residencia">

                    <button type="submit">
                        <i class="fa-solid fa-check"></i> Registrar acceso
                    </button>
                    <button type="button" class="btn-limpiar" id="btnLimpiarAccesoAdmin">
                        <i class="fa-solid fa-broom"></i> Limpiar
                    </button>
                </form>

                <div class="form-card" style="margin-top:22px">
                    <h3>Gestión de turno</h3>
                    <form id="formTurnoAdmin">
                        <label>Nombre</label>
                        <input type="text" id="guardia_nombre_admin" name="guardia_nombre">

                        <label>Notas</label>
                        <textarea id="notas_turno_admin" name="notas"></textarea>

                        <button type="submit">
                            <i class="fa-solid fa-play"></i> Iniciar turno
                        </button>
                        <button type="button" class="btn-limpiar" id="btnFinalizarTurnoAdmin">
                            <i class="fa-solid fa-stop"></i> Finalizar turno
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>

</main>

<?php include __DIR__ . '/footer.php'; ?>