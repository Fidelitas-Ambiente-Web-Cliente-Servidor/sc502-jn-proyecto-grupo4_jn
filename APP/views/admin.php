<?php
$titulo = 'Panel Administrador – Las Aralias';
$pageJs = '/PUBLIC/js/admin.js';
include __DIR__ . '/header.php';
$nombreAdmin = htmlspecialchars($_SESSION['usuario']['nombre'] ?? 'Administrador', ENT_QUOTES);
?>
<nav class="navbar navbar-expand-lg">
    <div class="container-fluid">
        <span class="navbar-brand"><i class="fa-solid fa-user-tie"></i> Admin &mdash; <?php echo $nombreAdmin; ?></span>
        <a href="logout.php" class="nav-link nav-logout ms-auto"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a>
    </div>
</nav>
<main>
    <section class="seccion activa">
        <h2><i class="fa-solid fa-gears"></i> Panel Administrador</h2>
    </section>
</main>
<?php include __DIR__ . '/footer.php'; ?>
