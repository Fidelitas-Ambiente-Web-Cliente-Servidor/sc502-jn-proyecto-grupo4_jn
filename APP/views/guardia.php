<?php
$titulo = 'Panel Guardia – Las Aralias';
$pageJs = 'PUBLIC/js/guardia.js';
include __DIR__ . '/header.php';
$nombreGuardia = htmlspecialchars($_SESSION['usuario']['nombre'] ?? 'Guardia', ENT_QUOTES);
?>
<nav class="navbar navbar-expand-lg">
    <div class="container-fluid">
        <span class="navbar-brand"><i class="fa-solid fa-shield-halved"></i> Guardia &mdash; <?php echo $nombreGuardia; ?></span>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navGuardia">
            <span class="navbar-toggler-icon" style="filter:invert(1)"></span>
        </button>
        <div class="collapse navbar-collapse" id="navGuardia">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <li class="nav-item"><a class="nav-link nav-sec" href="#" data-sec="inicio"><i class="fa-solid fa-house-chimney"></i> Inicio</a></li>
                <li class="nav-item"><a class="nav-link nav-sec" href="#" data-sec="visitas"><i class="fa-solid fa-person-walking-arrow-right"></i> Visitas</a></li>
                <li class="nav-item"><a class="nav-link nav-sec" href="#" data-sec="paquetes"><i class="fa-solid fa-box"></i> Paquetes</a></li>
                <li class="nav-item"><a class="nav-link nav-sec" href="#" data-sec="accesos"><i class="fa-solid fa-car"></i> Accesos</a></li>
                <li class="nav-item"><a class="nav-link nav-sec" href="#" data-sec="turnos"><i class="fa-solid fa-clock-rotate-left"></i> Turnos</a></li>
            </ul>
            <a href="logout.php" class="nav-link nav-logout ms-3"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a>
        </div>
    </div>
</nav>

<div id="alertaGlobal" style="display:none"></div>

<main>

<section class="seccion" id="sec-inicio">
    <h2><i class="fa-solid fa-house-chimney"></i> Resumen del día</h2>
    <div class="resumen-inicio">
        <div class="tarjeta-resumen">
            <div class="icono-tarjeta"><i class="fa-solid fa-person-walking-arrow-right"></i></div>
            <h3 id="stat-visitas">—</h3>
            <p>Visitas activas</p>
        </div>
        <div class="tarjeta-resumen">
            <div class="icono-tarjeta"><i class="fa-solid fa-box"></i></div>
            <h3 id="stat-paquetes">—</h3>
            <p>Paquetes pendientes</p>
        </div>
        <div class="tarjeta-resumen">
            <div class="icono-tarjeta"><i class="fa-solid fa-car"></i></div>
            <h3 id="stat-accesos">—</h3>
            <p>Accesos dentro</p>
        </div>
        <div class="tarjeta-resumen tarjeta-turno">
            <div class="icono-tarjeta"><i class="fa-solid fa-clock"></i></div>
            <p id="stat-turno-txt">Cargando...</p>
        </div>
    </div>
    <div class="contenedor-principal">
        <div class="bloque-tabla">
            <h3 class="subtitulo-bloque"><i class="fa-solid fa-person-walking-arrow-right"></i> Visitas activas</h3>
            <table id="res-vis"><thead><tr><th>#</th><th>Nombre</th><th>Rol</th><th>Residencia</th><th>Motivo</th><th>Hora</th></tr></thead><tbody></tbody></table>
        </div>
        <div class="bloque-tabla">
            <h3 class="subtitulo-bloque"><i class="fa-solid fa-box"></i> Paquetes pendientes</h3>
            <table id="res-paq"><thead><tr><th>#</th><th>Destinatario</th><th>Residencia</th><th>Recibido</th></tr></thead><tbody></tbody></table>
        </div>
    </div>
</section>

<section class="seccion" id="sec-visitas">
    <h2><i class="fa-solid fa-person-walking-arrow-right"></i> Gestión de Visitas</h2>
    <div class="contenedor-principal">
        <div class="bloque-tabla">
            <h3 class="subtitulo-bloque">Visitas activas</h3>
            <table id="vis-activas"><thead><tr><th>#</th><th>Nombre</th><th>Rol</th><th>Cédula</th><th>Residencia</th><th>Motivo</th><th>Entrada</th><th>Acción</th></tr></thead><tbody></tbody></table>
            <h3 class="subtitulo-bloque" style="margin-top:22px">Historial del día</h3>
            <table id="vis-hoy"><thead><tr><th>#</th><th>Nombre</th><th>Rol</th><th>Residencia</th><th>Entrada</th><th>Salida</th><th>Estado</th></tr></thead><tbody></tbody></table>
        </div>
        <div class="bloque-formulario">
            <h3><i class="fa-solid fa-plus"></i> Registrar visita</h3>
            <form id="formVisita">
                <label>Rol *</label>
                <select name="rol" id="v_rol" required></select>
                <label>Nombre completo *</label>
                <input type="text" id="v_nombre" name="nombre" placeholder="Nombre del visitante" required>
                <label>Cédula / ID</label>
                <input type="text" name="cedula" placeholder="Número de identificación">
                <label>Residencia / Casa *</label>
                <input type="text" id="v_residencia" name="residencia" placeholder="Ej: Casa 12, Apto 3B" required>
                <label>Motivo</label>
                <textarea name="motivo" placeholder="Ej: visita familiar, reunión..."></textarea>
                <button type="submit"><i class="fa-solid fa-check"></i> Registrar entrada</button>
                <button type="reset" class="btn-limpiar"><i class="fa-solid fa-broom"></i> Limpiar</button>
            </form>
        </div>
    </div>
</section>

<section class="seccion" id="sec-paquetes">
    <h2><i class="fa-solid fa-box"></i> Gestión de Paquetes</h2>
    <div class="contenedor-principal">
        <div class="bloque-tabla">
            <h3 class="subtitulo-bloque">Paquetes pendientes</h3>
            <table id="paq-pendientes"><thead><tr><th>#</th><th>Destinatario</th><th>Residencia</th><th>Empresa</th><th>Descripción</th><th>Recibido</th><th>Acción</th></tr></thead><tbody></tbody></table>
            <h3 class="subtitulo-bloque" style="margin-top:22px">Paquetes de hoy</h3>
            <table id="paq-hoy"><thead><tr><th>#</th><th>Destinatario</th><th>Residencia</th><th>Recibido</th><th>Entregado</th><th>Estado</th></tr></thead><tbody></tbody></table>
        </div>
        <div class="bloque-formulario">
            <h3><i class="fa-solid fa-plus"></i> Registrar paquete</h3>
            <form id="formPaquete">
                <label>Destinatario *</label>
                <input type="text" id="p_dest" name="destinatario" placeholder="Nombre del condómino" required>
                <label>Residencia / Casa *</label>
                <input type="text" id="p_res" name="residencia" placeholder="Ej: Casa 12, Apto 3B" required>
                <label>Empresa / Mensajería</label>
                <input type="text" name="empresa" placeholder="Ej: Correos CR, Amazon...">
                <label>Descripción</label>
                <textarea name="descripcion" placeholder="Ej: caja mediana, sobre..."></textarea>
                <button type="submit"><i class="fa-solid fa-check"></i> Registrar paquete</button>
                <button type="reset" class="btn-limpiar"><i class="fa-solid fa-broom"></i> Limpiar</button>
            </form>
        </div>
    </div>
</section>

<section class="seccion" id="sec-accesos">
    <h2><i class="fa-solid fa-car"></i> Control de Accesos</h2>
    <div class="contenedor-principal">
        <div class="bloque-tabla">
            <h3 class="subtitulo-bloque">Actualmente dentro</h3>
            <table id="acc-dentro"><thead><tr><th>#</th><th>Rol</th><th>Nombre</th><th>Placa</th><th>Residencia</th><th>Entrada</th><th>Acción</th></tr></thead><tbody></tbody></table>
            <h3 class="subtitulo-bloque" style="margin-top:22px">Historial de hoy</h3>
            <table id="acc-hoy"><thead><tr><th>#</th><th>Rol</th><th>Nombre</th><th>Placa</th><th>Entrada</th><th>Salida</th><th>Estado</th></tr></thead><tbody></tbody></table>
        </div>
        <div class="bloque-formulario">
            <h3><i class="fa-solid fa-plus"></i> Registrar acceso</h3>
            <form id="formAcceso">
                <label>Rol *</label>
                <select id="a_rol" name="rol" required></select>
                <label>Nombre / Conductor *</label>
                <input type="text" id="a_nombre" name="nombre" placeholder="Nombre completo" required>
                <div id="campoPlaca" style="display:block">
                    <label>Placa</label>
                    <input type="text" name="placa" placeholder="Ej: ABC-123" required>
                </div>
                <label>Destino / Residencia</label>
                <input type="text" name="residencia" placeholder="Ej: Casa 5">
                <label>Motivo</label>
                <textarea name="motivo" placeholder="Ej: entrega, mantenimiento..."></textarea>
                <button type="submit"><i class="fa-solid fa-check"></i> Registrar entrada</button>
                <button type="reset" class="btn-limpiar" id="btnLimpiarAcceso"><i class="fa-solid fa-broom"></i> Limpiar</button>
            </form>
        </div>
    </div>
</section>

<section class="seccion" id="sec-turnos">
    <h2><i class="fa-solid fa-clock-rotate-left"></i> Gestión de Turnos</h2>
    <div class="contenedor-principal">
        <div class="bloque-tabla">
            <div id="turno-banner" style="display:none"></div>
            <div id="turno-sin" class="turno-sin-banner" style="display:none"><i class="fa-solid fa-circle-pause" style="color:var(--color-gris)"></i> No hay turno activo.</div>
            <h3 class="subtitulo-bloque" style="margin-top:22px">Historial de turnos</h3>
            <table id="tbl-turnos"><thead><tr><th>#</th><th>Guardia</th><th>Inicio</th><th>Fin</th><th>Estado</th></tr></thead><tbody></tbody></table>
        </div>
        <div class="bloque-formulario">
            <h3><i class="fa-solid fa-play"></i> Iniciar turno</h3>
            <form id="formTurno">
                <label>Nombre del guardia</label>
                <input type="text" name="guardia_nombre" value="<?php echo $nombreGuardia; ?>" placeholder="Nombre del guardia">
                <label>Notas</label>
                <textarea name="notas" placeholder="Observaciones al iniciar turno..."></textarea>
                <button type="submit"><i class="fa-solid fa-play"></i> Iniciar turno</button>
            </form>
        </div>
    </div>
</section>

</main>
<?php include __DIR__ . '/footer.php'; ?>
