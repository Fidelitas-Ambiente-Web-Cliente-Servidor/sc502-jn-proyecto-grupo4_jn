<?php
$titulo = 'Condominio Las Aralias - Ingreso';
$pageJs = 'PUBLIC/js/auth.js';
include __DIR__ . '/header.php';
?>
<main class="login-main">
    <section class="seccion-login">
        <h2>Seleccione su perfil</h2>
        <p class="subtitulo">Ingrese con las credenciales correspondientes a su rol</p>
        <div class="contenedor-roles">
            <div class="card-rol card-guardia">
                <div class="card-icono"><i class="fa-solid fa-shield-halved"></i></div>
                <h3>Guardia</h3>
                <form id="formGuardia">
                    <label for="usuarioGuardia"><i class="fa-solid fa-user"></i> Usuario</label>
                    <input type="text" id="usuarioGuardia" name="usuario" placeholder="Usuario">
                    <label for="claveGuardia"><i class="fa-solid fa-lock"></i> Contraseña</label>
                    <input type="password" id="claveGuardia" name="clave" placeholder="Contraseña">
                    <span id="errorGuardia" class="mensaje-error"></span>
                    <button type="submit" class="btn-ingresar btn-guardia"><i class="fa-solid fa-right-to-bracket"></i> Ingresar como Guardia</button>
                </form>
            </div>
            <div class="card-rol card-admin">
                <div class="card-icono"><i class="fa-solid fa-user-tie"></i></div>
                <h3>Administrador</h3>
                <form id="formAdmin">
                    <label for="usuarioAdmin"><i class="fa-solid fa-user"></i> Usuario</label>
                    <input type="text" id="usuarioAdmin" name="usuario" placeholder="Usuario">
                    <label for="claveAdmin"><i class="fa-solid fa-lock"></i> Contraseña</label>
                    <input type="password" id="claveAdmin" name="clave" placeholder="Contraseña">
                    <span id="errorAdmin" class="mensaje-error"></span>
                    <button type="submit" class="btn-ingresar btn-admin"><i class="fa-solid fa-right-to-bracket"></i> Ingresar como Administrador</button>
                </form>
            </div>
        </div>
    </section>
</main>
<?php include __DIR__ . '/footer.php'; ?>
