<?php if (!session_id()) session_start(); ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($titulo ?? 'Condominio Las Aralias', ENT_QUOTES, 'UTF-8'); ?></title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%23333'>🏢</text></svg>">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="PUBLIC/css/style.css" rel="stylesheet">
    <link href="PUBLIC/css/admin.css" rel="stylesheet">
    <link href="PUBLIC/css/guardia.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>
<header>
    <div class="header-logo"><i class="fa-solid fa-building-shield fa-2x"></i></div>
    <h1>Condominio las Aralias</h1>
    <p>Sistema de Gestión – Condominio Las Aralias</p>
</header>
