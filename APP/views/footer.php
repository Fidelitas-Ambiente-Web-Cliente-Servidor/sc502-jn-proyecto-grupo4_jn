<footer>
    <p>Proyecto SC-502 Ambiente Web Cliente Servidor</p>
</footer>
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<?php if (!empty($pageJs)): ?>
<?php
    $pageJsPath = __DIR__ . '/../../' . ltrim($pageJs, '/');
    $pageJsVersion = file_exists($pageJsPath) ? filemtime($pageJsPath) : time();
?>
<script src="<?php echo htmlspecialchars($pageJs, ENT_QUOTES, 'UTF-8'); ?>?v=<?php echo $pageJsVersion; ?>"></script>
<?php endif; ?>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
