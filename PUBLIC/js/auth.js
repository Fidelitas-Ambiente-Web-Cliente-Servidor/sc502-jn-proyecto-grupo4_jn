$(function () {
    var url = 'index.php';

    function normalizeResponse(data) {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (e) {
                return { response: '01', message: 'Respuesta invalida del servidor.' };
            }
        }
        return data || { response: '01', message: 'Sin respuesta del servidor.' };
    }

    $('#formGuardia').on('submit', function (e) {
        e.preventDefault();
        var u = $('#usuarioGuardia').val().trim();
        var c = $('#claveGuardia').val().trim();
        if (!u || !c) { $('#errorGuardia').text('Complete todos los campos.').show(); return; }
        $.post(url, {option: 'login', usuario: u, clave: c, perfil: 'guardia'}, function (data) {
            data = normalizeResponse(data);
            if (data.response == '00') window.location = 'index.php?page=guardia';
            else $('#errorGuardia').text(data.message || 'Error.').show();
        }).fail(function () {
            $('#errorGuardia').text('No se pudo conectar con el servidor.').show();
        });
    });

    $('#formAdmin').on('submit', function (e) {
        e.preventDefault();
        var u = $('#usuarioAdmin').val().trim();
        var c = $('#claveAdmin').val().trim();
        if (!u || !c) { $('#errorAdmin').text('Complete todos los campos.').show(); return; }
        $.post(url, {option: 'login', usuario: u, clave: c, perfil: 'admin'}, function (data) {
            data = normalizeResponse(data);
            if (data.response == '00') window.location = 'index.php?page=admin';
            else $('#errorAdmin').text(data.message || 'Error.').show();
        }).fail(function () {
            $('#errorAdmin').text('No se pudo conectar con el servidor.').show();
        });
    });
});
