$(function () {
    var url = 'index.php';
    var testParam = window.location.search.includes('test=1') ? '&test=1' : '';

    function alerta(msg, tipo) {
        var el = $('<div class="alerta alerta-' + (tipo === 'ok' ? 'ok' : 'err') + '">').text(msg);
        $('main').prepend(el);
        setTimeout(function () { el.fadeOut(400, function () { el.remove(); }); }, 3500);
    }

    function t(str, start, len) { return str ? str.substr(start, len) : '—'; }
    function hora(str) {
        if (!str) return '—';
        var s = String(str).replace('T', ' ');
        return s.length >= 16 ? s.substr(11, 5) : s;
    }
    function fechaHora(str) {
        if (!str) return '—';
        var s = String(str).replace('T', ' ');
        return s.length >= 16 ? s.substr(0, 16) : s;
    }
    function vacio(tb, cols, msg) { if (!tb.children().length) tb.append('<tr><td colspan="' + cols + '" class="celda-vacia">' + msg + '</td></tr>'); }

    function cargarRoles() {
        return $.get(url + '?option=get_roles' + testParam, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            var rolesVisita = d.roles_visita || [];
            var rolesAcceso = d.roles_acceso || [];
            var visita = $('#v_rol').empty();
            var acceso = $('#a_rol').empty();
            $.each(rolesVisita, function (i, r) {
                var rolNombre = r.rol || r.ROL || '';
                var option = $('<option>').val(rolNombre).text(rolNombre);
                visita.append(option.clone());
            });
            $.each(rolesAcceso, function (i, r) {
                var rolNombre = r.rol || r.ROL || '';
                var option = $('<option>').val(rolNombre).text(rolNombre);
                acceso.append(option.clone());
            });
            if (!visita.children().length) {
                visita.append('<option value="visita">Visita</option>');
            }
            if (!acceso.children().length) {
                acceso.append('<option value="residente">Residente</option>');
                acceso.append('<option value="proveedor">Proveedor</option>');
            }
        });
    }

    function activar(sec) {
        $('.seccion').hide();
        $('#sec-' + sec).show();
        $('.nav-sec').removeClass('activo');
        $('.nav-sec[data-sec="' + sec + '"]').addClass('activo');
        if (sec === 'inicio')   cargarStats();
        if (sec === 'visitas')  cargarVisitas();
        if (sec === 'paquetes') cargarPaquetes();
        if (sec === 'accesos')  cargarAccesos();
        if (sec === 'turnos')   cargarTurnos();
    }

    $('.nav-sec').on('click', function (e) { e.preventDefault(); activar($(this).data('sec')); });

    function cargarStats() {
        $.get(url + '?option=stats' + testParam, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            $('#stat-visitas').text(d.visitas_activas);
            $('#stat-paquetes').text(d.paquetes_pendientes);
            $('#stat-accesos').text(d.accesos_dentro);
            $('#stat-turno-txt').text(d.turno_activo ? 'Activo desde ' + hora(d.turno_activo.fecha_inicio) : 'Sin turno activo');

            var tbV = $('#res-vis tbody').empty();
            $.each(d.visitas_list, function (i, v) {
                tbV.append('<tr><td>' + v.id + '</td><td>' + v.nombre + '</td><td>' + (v.rol || '—') + '</td><td>' + v.residencia + '</td><td>' + (v.motivo || '—') + '</td><td>' + fechaHora(v.fecha_entrada) + '</td></tr>');
            });
            vacio(tbV, 6, 'Sin visitas activas');

            var tbP = $('#res-paq tbody').empty();
            $.each(d.paquetes_list, function (i, p) {
                tbP.append('<tr><td>' + p.id + '</td><td>' + p.destinatario + '</td><td>' + p.residencia + '</td><td>' + fechaHora(p.fecha_recepcion) + '</td></tr>');
            });
            vacio(tbP, 4, 'Sin paquetes pendientes');
        });
    }

    function cargarVisitas() {
        $.get(url + '?option=get_visitas' + testParam, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            var tbA = $('#vis-activas tbody').empty();
            $.each(d.activas, function (i, v) {
                tbA.append('<tr><td>' + v.id + '</td><td>' + v.nombre + '</td><td>' + (v.rol || '—') + '</td><td>' + (v.cedula || '—') + '</td><td>' + v.residencia + '</td><td>' + (v.motivo || '—') + '</td><td>' + fechaHora(v.fecha_entrada) + '</td><td><button class="btn-editar btn-accion-secundaria btn-checkout" data-id="' + v.id + '"><i class="fa-solid fa-right-from-bracket"></i> Check-out</button></td></tr>');
            });
            vacio(tbA, 8, 'Sin visitas activas');

            var tbH = $('#vis-hoy tbody').empty();
            $.each(d.hoy, function (i, v) {
                var esActivoVisita = String(v.estado || '').toLowerCase() === 'adentro';
                tbH.append('<tr><td>' + v.id + '</td><td>' + v.nombre + '</td><td>' + (v.rol || '—') + '</td><td>' + v.residencia + '</td><td>' + fechaHora(v.fecha_entrada) + '</td><td>' + fechaHora(v.fecha_salida) + '</td><td><span class="estado-' + (esActivoVisita ? 'activo' : 'inactivo') + '">' + v.estado + '</span></td></tr>');
            });
            vacio(tbH, 7, 'Sin registros hoy');

            var tbHist = $('#vis-hist tbody').empty();
            $.each(d.historial || [], function (i, v) {
                var esActivoHistVisita = String(v.estado || '').toLowerCase() === 'adentro';
                tbHist.append('<tr><td>' + v.id + '</td><td>' + v.nombre + '</td><td>' + (v.rol || '—') + '</td><td>' + v.residencia + '</td><td>' + fechaHora(v.fecha_entrada) + '</td><td>' + fechaHora(v.fecha_salida) + '</td><td><span class="estado-' + (esActivoHistVisita ? 'activo' : 'inactivo') + '">' + v.estado + '</span></td></tr>');
            });
            vacio(tbHist, 7, 'Sin historial registrado');
        });
    }

    $('#sec-visitas').on('click', '.btn-checkout', function () {
        if (!confirm('¿Confirmar salida?')) return;
        $.post(url + '?test=' + (testParam.includes('test=1') ? '1' : '0'), {option: 'checkout_visita', id: $(this).data('id')}, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') { alerta('Check-out registrado.', 'ok'); cargarVisitas(); }
            else alerta('Error al registrar.', 'err');
        });
    });

    $('#formVisita').on('submit', function (e) {
        e.preventDefault();
        if (!$('#v_rol').val() || !$('#v_nombre').val().trim() || !$('#v_residencia').val().trim()) { alerta('Rol, nombre y residencia son requeridos.', 'err'); return; }
        $.post(url + '?test=' + (testParam.includes('test=1') ? '1' : '0'), $(this).serialize() + '&option=registrar_visita', function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') { alerta('Visita registrada.', 'ok'); $('#formVisita')[0].reset(); cargarVisitas(); }
            else alerta('Error al registrar.', 'err');
        });
    });

    function cargarPaquetes() {
        $.get(url + '?option=get_paquetes' + testParam, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            var tbP = $('#paq-pendientes tbody').empty();
            $.each(d.pendientes, function (i, p) {
                tbP.append('<tr><td>' + p.id + '</td><td>' + p.destinatario + '</td><td>' + p.residencia + '</td><td>' + (p.empresa || '—') + '</td><td>' + (p.descripcion || '—') + '</td><td>' + fechaHora(p.fecha_recepcion) + '</td><td><button class="btn-editar btn-entregar" data-id="' + p.id + '"><i class="fa-solid fa-hand-holding-box"></i> Entregar</button></td></tr>');
            });
            vacio(tbP, 7, 'Sin paquetes pendientes');

            var tbH = $('#paq-hoy tbody').empty();
            $.each(d.hoy, function (i, p) {
                tbH.append('<tr><td>' + p.id + '</td><td>' + p.destinatario + '</td><td>' + p.residencia + '</td><td>' + fechaHora(p.fecha_recepcion) + '</td><td>' + fechaHora(p.fecha_entrega) + '</td><td><span class="estado-' + (p.estado === 'Pendiente' ? 'pendiente' : 'activo') + '">' + p.estado + '</span></td></tr>');
            });
            vacio(tbH, 6, 'Sin paquetes hoy');

            var tbHist = $('#paq-hist tbody').empty();
            $.each(d.historial || [], function (i, p) {
                tbHist.append('<tr><td>' + p.id + '</td><td>' + p.destinatario + '</td><td>' + p.residencia + '</td><td>' + fechaHora(p.fecha_recepcion) + '</td><td>' + fechaHora(p.fecha_entrega) + '</td><td><span class="estado-' + (p.estado === 'Pendiente' ? 'pendiente' : 'activo') + '">' + p.estado + '</span></td></tr>');
            });
            vacio(tbHist, 6, 'Sin historial registrado');
        });
    }

    $('#sec-paquetes').on('click', '.btn-entregar', function () {
        if (!confirm('¿Confirmar entrega?')) return;
        $.post(url + '?test=' + (testParam.includes('test=1') ? '1' : '0'), {option: 'entregar_paquete', id: $(this).data('id')}, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') { alerta('Entrega registrada.', 'ok'); cargarPaquetes(); }
            else alerta('Error al registrar.', 'err');
        });
    });

    $('#formPaquete').on('submit', function (e) {
        e.preventDefault();
        if (!$('#p_dest').val().trim() || !$('#p_res').val().trim()) { alerta('Destinatario y residencia son requeridos.', 'err'); return; }
        $.post(url + '?test=' + (testParam.includes('test=1') ? '1' : '0'), $(this).serialize() + '&option=registrar_paquete', function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') { alerta('Paquete registrado.', 'ok'); $('#formPaquete')[0].reset(); cargarPaquetes(); }
            else alerta('Error al registrar.', 'err');
        });
    });

    function cargarAccesos() {
        $.get(url + '?option=get_accesos' + testParam, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            var tbD = $('#acc-dentro tbody').empty();
            $.each(d.dentro, function (i, a) {
                tbD.append('<tr><td>' + a.id + '</td><td>' + (a.tipo || '—') + '</td><td>' + a.nombre + '</td><td>' + (a.placa || '—') + '</td><td>' + (a.residencia || '—') + '</td><td>' + fechaHora(a.fecha_entrada) + '</td><td><button class="btn-editar btn-accion-secundaria btn-salida" data-placa="' + (a.placa || '') + '" data-id="' + a.id + '"><i class="fa-solid fa-arrow-right-from-bracket"></i> Salida</button></td></tr>');
            });
            vacio(tbD, 7, 'Nadie dentro en este momento');

            var tbH = $('#acc-hoy tbody').empty();
            $.each(d.hoy, function (i, a) {
                tbH.append('<tr><td>' + a.id + '</td><td>' + (a.tipo || '—') + '</td><td>' + a.nombre + '</td><td>' + (a.placa || '—') + '</td><td>' + fechaHora(a.fecha_entrada) + '</td><td>' + fechaHora(a.fecha_salida) + '</td><td><span class="estado-' + (a.estado === 'Dentro' ? 'activo' : 'inactivo') + '">' + a.estado + '</span></td></tr>');
            });
            vacio(tbH, 7, 'Sin accesos hoy');

            var tbHist = $('#acc-hist tbody').empty();
            $.each(d.historial || [], function (i, a) {
                tbHist.append('<tr><td>' + a.id + '</td><td>' + (a.tipo || '—') + '</td><td>' + a.nombre + '</td><td>' + (a.placa || '—') + '</td><td>' + fechaHora(a.fecha_entrada) + '</td><td>' + fechaHora(a.fecha_salida) + '</td><td><span class="estado-' + (a.estado === 'Dentro' ? 'activo' : 'inactivo') + '">' + a.estado + '</span></td></tr>');
            });
            vacio(tbHist, 7, 'Sin historial registrado');
        });
    }

    $('#sec-accesos').on('click', '.btn-salida', function () {
        if (!confirm('¿Registrar salida?')) return;
        $.post(url + '?test=' + (testParam.includes('test=1') ? '1' : '0'), {option: 'registrar_salida', id: $(this).data('id')}, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') { alerta('Salida registrada.', 'ok'); cargarAccesos(); }
            else alerta('Error al registrar.', 'err');
        });
    });

    $('#btnLimpiarAcceso').on('click', function () {
        $('#campoPlaca').show();
        $('#a_rol').val($('#a_rol option:first').val());
    });

    $('#formAcceso').on('submit', function (e) {
        e.preventDefault();
        if (!$('#a_rol').val() || !$('#a_nombre').val().trim()) { alerta('El rol y el nombre son requeridos.', 'err'); return; }
        if (!$('input[name="placa"]').val().trim()) { alerta('La placa es requerida.', 'err'); return; }
        $.post(url + '?test=' + (testParam.includes('test=1') ? '1' : '0'), $(this).serialize() + '&option=registrar_acceso', function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') { alerta('Acceso registrado.', 'ok'); $('#formAcceso')[0].reset(); $('#campoPlaca').show(); $('#a_rol').val($('#a_rol option:first').val()); cargarAccesos(); }
            else alerta('Error al registrar.', 'err');
        });
    });

    function cargarTurnos() {
        $.get(url + '?option=get_turnos' + testParam, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            var banner = $('#turno-banner');
            var sin = $('#turno-sin');
            var formT = $('#formTurno');
            if (d.activo) {
                banner.html('<i class="fa-solid fa-circle-dot" style="color:var(--color-activo)"></i> <strong>Turno activo</strong> — ' + d.activo.guardia_nombre + ' desde ' + hora(d.activo.fecha_inicio) + ' <button class="btn-editar btn-accion-secundaria btn-fin-turno" data-id="' + d.activo.id + '"><i class="fa-solid fa-stop"></i> Finalizar</button>').show();
                sin.hide();
                formT.hide();
            } else {
                banner.hide();
                sin.show();
                formT.show();
            }

            var tb = $('#tbl-turnos tbody').empty();
            $.each(d.recientes, function (i, t) {
                tb.append('<tr><td>' + t.id + '</td><td>' + t.guardia_nombre + '</td><td>' + t.fecha_inicio.substr(0, 16) + '</td><td>' + (t.fecha_fin ? t.fecha_fin.substr(0, 16) : '—') + '</td><td><span class="estado-' + (t.estado === 'Activo' ? 'activo' : 'inactivo') + '">' + t.estado + '</span></td></tr>');
            });
            vacio(tb, 5, 'Sin turnos registrados');
        });
    }

    $('#sec-turnos').on('click', '.btn-fin-turno', function () {
        if (!confirm('¿Finalizar turno actual?')) return;
        $.post(url + '?test=' + (testParam.includes('test=1') ? '1' : '0'), {option: 'finalizar_turno', id: $(this).data('id')}, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') { alerta('Turno finalizado.', 'ok'); cargarTurnos(); }
            else alerta('Error al finalizar.', 'err');
        });
    });

    $('#formTurno').on('submit', function (e) {
        e.preventDefault();
        $.post(url + '?test=' + (testParam.includes('test=1') ? '1' : '0'), $(this).serialize() + '&option=iniciar_turno', function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') { alerta('Turno iniciado.', 'ok'); cargarTurnos(); }
            else alerta('Error al iniciar.', 'err');
        });
    });

    cargarRoles().always(function () {
        activar('inicio');
    });
});
