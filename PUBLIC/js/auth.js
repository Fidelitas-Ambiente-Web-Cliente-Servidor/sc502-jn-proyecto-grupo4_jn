$(function () {
    var url = 'index.php';

    $('#formGuardia').on('submit', function (e) {
        e.preventDefault();
        var u = $('#usuarioGuardia').val().trim();
        var c = $('#claveGuardia').val().trim();
        if (!u || !c) { $('#errorGuardia').text('Complete todos los campos.').show(); return; }
        $.post(url, {option: 'login', usuario: u, clave: c, perfil: 'guardia'}, function (data) {
            data = JSON.parse(data);
            if (data.response == '00') window.location = 'index.php?page=guardia';
            else $('#errorGuardia').text(data.message || 'Error.').show();
        });
    });

    $('#formAdmin').on('submit', function (e) {
        e.preventDefault();
        var u = $('#usuarioAdmin').val().trim();
        var c = $('#claveAdmin').val().trim();
        if (!u || !c) { $('#errorAdmin').text('Complete todos los campos.').show(); return; }
        $.post(url, {option: 'login', usuario: u, clave: c, perfil: 'admin'}, function (data) {
            data = JSON.parse(data);
            if (data.response == '00') window.location = 'index.php?page=admin';
            else $('#errorAdmin').text(data.message || 'Error.').show();
        });
    });
});
