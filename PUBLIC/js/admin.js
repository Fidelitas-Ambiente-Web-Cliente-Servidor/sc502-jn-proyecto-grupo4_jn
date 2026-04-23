$(function () {
    var url = 'index.php';
    var cache = {
        residencias: [],
        condominos: [],
        resumen: {
            total_residencias: 0,
            total_condominos: 0,
            residencias_ocupadas: 0,
            cupos_disponibles: 0
        }
    };

    function alerta(msg, tipo) {
        var el = $('<div class="alerta alerta-' + (tipo === 'ok' ? 'ok' : 'err') + '">').text(msg);
        $('main').prepend(el);
        setTimeout(function () {
            el.fadeOut(400, function () {
                el.remove();
            });
        }, 3500);
    }

    function vacio(tb, cols, msg) {
        if (!tb.children().length) {
            tb.append('<tr><td colspan="' + cols + '" class="celda-vacia">' + msg + '</td></tr>');
        }
    }

    function estadoClass(estado) {
        var e = String(estado || '').trim().toLowerCase();
        if (e === 'activo' || e === 'activa' || e === 'disponible' || e === 'ocupada' || e === 'dentro' || e === 'adentro') {
            return 'activo';
        }
        if (e === 'afuera' || e === 'salio' || e === 'salió') {
            return 'afuera';
        }
        if (e === 'mantenimiento' || e === 'en mantenimiento') {
            return 'mantenimiento';
        }
        if (e === 'vetado') {
            return 'vetado';
        }
        if (e === 'pendiente') {
            return 'pendiente';
        }
        return 'inactivo';
    }

    function fetchGestion(cb) {
        $.get(url + '?page=admin&option=get_gestion_admin', function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            cache.residencias = d.residencias || [];
            cache.condominos = d.condominos || [];
            cache.resumen = d.resumen || cache.resumen;
            if (typeof cb === 'function') cb();
        }).fail(function () {
            alerta('No se pudo cargar gestión desde la base de datos.', 'err');
            if (typeof cb === 'function') cb();
        });
    }

    function llenarSelectResidencias() {
        var select = $('#cond_residencia').empty();
        var residencias = cache.residencias;

        if (!residencias.length) {
            select.append('<option value="">No hay residencias registradas</option>');
            return;
        }

        $.each(residencias, function (_, r) {
            select.append(
                $('<option>')
                    .val(r.id)
                    .text(r.codigo + ' (' + r.tipo + ')')
            );
        });
    }

    function renderResumen() {
        $('#rep-total-residencias').text(cache.resumen.total_residencias || 0);
        $('#rep-total-condominos').text(cache.resumen.total_condominos || 0);
        $('#rep-residencias-ocupadas').text(cache.resumen.residencias_ocupadas || 0);
        $('#rep-cupos-disponibles').text(cache.resumen.cupos_disponibles || 0);

        var tbCondominosRep = $('#tbl-reporte-condominos tbody').empty();
        $.each(cache.condominos, function (_, c) {
            tbCondominosRep.append(
                '<tr>' +
                    '<td>' + c.id + '</td>' +
                    '<td>' + (c.nombre || '—') + '</td>' +
                    '<td>' + (c.identificacion || '—') + '</td>' +
                    '<td>' + (c.residencia_codigo || ('Residencia ' + (c.residencia_id || '—'))) + '</td>' +
                    '<td><span class="estado-' + estadoClass(c.estado) + '">' + (c.estado || '—') + '</span></td>' +
                    '<td>' + (c.fecha_registro || '—') + '</td>' +
                '</tr>'
            );
        });
        vacio(tbCondominosRep, 6, 'No hay condóminos registrados');

        var tbResidencias = $('#tbl-reporte-residencias tbody').empty();
        $.each(cache.residencias, function (_, r) {
            tbResidencias.append(
                '<tr>' +
                    '<td>' + (r.id || '—') + '</td>' +
                    '<td>' + (r.codigo || '—') + '</td>' +
                    '<td>' + (r.tipo || '—') + '</td>' +
                    '<td>' + (r.bloque || '—') + '</td>' +
                    '<td>' + (r.capacidad || '—') + '</td>' +
                    '<td>' + (r.condominos || 0) + '</td>' +
                    '<td><span class="estado-' + estadoClass(r.estado) + '">' + (r.estado || '—') + '</span></td>' +
                '</tr>'
            );
        });
        vacio(tbResidencias, 7, 'No hay residencias registradas');
    }

    function renderGestion() {
        var tbResidencias = $('#tbl-residencias tbody').empty();
        $.each(cache.residencias, function (_, r) {
            tbResidencias.append(
                '<tr>' +
                    '<td>' + (r.id || '—') + '</td>' +
                    '<td>' + (r.codigo || '—') + '</td>' +
                    '<td>' + (r.tipo || '—') + '</td>' +
                    '<td>' + (r.condominos || 0) + '</td>' +
                    '<td><span class="estado-' + estadoClass(r.estado) + '">' + (r.estado || '—') + '</span></td>' +
                    '<td class="tabla-acciones">' +
                        '<button class="btn-editar btn-editar-residencia" data-id="' + (r.id || '') + '"><i class="fa-solid fa-pen"></i> Editar</button>' +
                        '<button class="btn-eliminar btn-eliminar-residencia" data-id="' + (r.id || '') + '"><i class="fa-solid fa-trash"></i> Eliminar</button>' +
                    '</td>' +
                '</tr>'
            );
        });
        vacio(tbResidencias, 6, 'No hay residencias registradas');

        var tbCondominos = $('#tbl-condominos tbody').empty();
        $.each(cache.condominos, function (_, c) {
            tbCondominos.append(
                '<tr>' +
                    '<td>' + (c.id || '—') + '</td>' +
                    '<td>' + (c.nombre || '—') + '</td>' +
                    '<td>' + (c.identificacion || '—') + '</td>' +
                    '<td>' + (c.telefono || '—') + '</td>' +
                    '<td>' + (c.residencia_codigo || ('Residencia ' + (c.residencia_id || '—'))) + '</td>' +
                    '<td><span class="estado-' + estadoClass(c.estado) + '">' + (c.estado || '—') + '</span></td>' +
                    '<td class="tabla-acciones">' +
                        '<button class="btn-editar btn-editar-condomino" data-id="' + (c.id || '') + '"><i class="fa-solid fa-pen"></i> Editar</button>' +
                        '<button class="btn-eliminar btn-eliminar-condomino" data-id="' + (c.id || '') + '"><i class="fa-solid fa-trash"></i> Eliminar</button>' +
                    '</td>' +
                '</tr>'
            );
        });
        vacio(tbCondominos, 7, 'No hay condóminos registrados');

        llenarSelectResidencias();
    }

    function renderTodo() {
        renderResumen();
        renderGestion();
    }

    function limpiarFormResidencia() {
        $('#formResidencia')[0].reset();
        $('#res_id').val('');
        $('#tituloFormResidencia').html('<i class="fa-solid fa-plus"></i> Registrar residencia').removeClass('modo-edicion');
    }

    function limpiarFormCondomino() {
        $('#formCondomino')[0].reset();
        $('#cond_id').val('');
        $('#tituloFormCondomino').html('<i class="fa-solid fa-plus"></i> Registrar condómino').removeClass('modo-edicion');
        llenarSelectResidencias();
    }

    function activar(sec) {
        $('.seccion').hide();
        $('#sec-' + sec).show();
        $('.nav-sec').removeClass('activo');
        $('.nav-sec[data-sec="' + sec + '"]').addClass('activo');

        if (sec === 'reportes' || sec === 'gestion') {
            fetchGestion(function () {
                if (sec === 'reportes') renderResumen();
                if (sec === 'gestion') renderGestion();
            });
        }
    }

    $('.nav-sec').on('click', function (e) {
        e.preventDefault();
        activar($(this).data('sec'));
    });

    $('#formResidencia').on('submit', function (e) {
        e.preventDefault();

        var payload = $(this).serialize() + '&page=admin&option=registrar_residencia_admin';
        $.post(url, payload, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') {
                alerta('Residencia guardada correctamente.', 'ok');
                limpiarFormResidencia();
                fetchGestion(renderTodo);
            } else {
                alerta(d.message || 'No se pudo guardar la residencia.', 'err');
            }
        }).fail(function (xhr) {
            alert(xhr.responseText || 'Error al conectar con el servidor.');
        });
    });

    $('#formCondomino').on('submit', function (e) {
        e.preventDefault();

        var payload = $(this).serialize() + '&page=admin&option=registrar_condomino_admin';
        $.post(url, payload, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') {
                alerta('Condómino guardado correctamente.', 'ok');
                limpiarFormCondomino();
                fetchGestion(renderTodo);
            } else {
                alerta(d.message || 'No se pudo guardar el condómino.', 'err');
            }
        }).fail(function (xhr) {
            alert(xhr.responseText || 'Error al conectar con el servidor.');
        });
    });

    $('#tbl-residencias').on('click', '.btn-editar-residencia', function () {
        var id = parseInt($(this).data('id'), 10);
        var r = null;
        $.each(cache.residencias, function (_, row) {
            if (parseInt(row.id, 10) === id) {
                r = row;
                return false;
            }
        });
        if (!r) return;

        $('#res_id').val(r.id || '');
        $('#res_codigo').val(r.codigo || '');
        $('#res_tipo').val(r.tipo || 'Residencial');
        $('#res_estado').val(r.estado || 'Disponible');
        $('#tituloFormResidencia').html('<i class="fa-solid fa-pen"></i> Editar residencia').addClass('modo-edicion');
    });

    $('#tbl-condominos').on('click', '.btn-editar-condomino', function () {
        var id = parseInt($(this).data('id'), 10);
        var c = null;
        $.each(cache.condominos, function (_, row) {
            if (parseInt(row.id, 10) === id) {
                c = row;
                return false;
            }
        });
        if (!c) return;

        llenarSelectResidencias();
        $('#cond_id').val(c.id || '');
        $('#cond_nombre').val(c.nombre || '');
        $('#cond_identificacion').val(c.identificacion || '');
        $('#cond_telefono').val((c.telefono === '—' ? '' : (c.telefono || '')));
        $('#cond_residencia').val(c.residencia_id || '');
        $('#cond_estado').val(c.estado || 'Activo');
        $('#tituloFormCondomino').html('<i class="fa-solid fa-pen"></i> Editar condómino').addClass('modo-edicion');
    });

    $('#tbl-residencias').on('click', '.btn-eliminar-residencia', function () {
        var id = parseInt($(this).data('id'), 10);
        if (!confirm('¿Desea eliminar esta residencia?')) return;

        $.post(url, { page: 'admin', option: 'eliminar_residencia_admin', id: id }, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') {
                alerta('Residencia eliminada correctamente.', 'ok');
                limpiarFormResidencia();
                fetchGestion(renderTodo);
            } else {
                alerta(d.message || 'No se pudo eliminar la residencia.', 'err');
            }
        }).fail(function (xhr) {
            alert(xhr.responseText || 'Error al conectar con el servidor.');
        });
    });

    $('#tbl-condominos').on('click', '.btn-eliminar-condomino', function () {
        var id = parseInt($(this).data('id'), 10);
        if (!confirm('¿Desea eliminar este condómino?')) return;

        $.post(url, { page: 'admin', option: 'eliminar_condomino_admin', id: id }, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') {
                alerta('Condómino eliminado correctamente.', 'ok');
                limpiarFormCondomino();
                fetchGestion(renderTodo);
            } else {
                alerta(d.message || 'No se pudo eliminar el condómino.', 'err');
            }
        }).fail(function (xhr) {
            alert(xhr.responseText || 'Error al conectar con el servidor.');
        });
    });

    $('#btnLimpiarResidencia').on('click', function () {
        setTimeout(function () {
            limpiarFormResidencia();
        }, 0);
    });

    $('#btnLimpiarCondomino').on('click', function () {
        setTimeout(function () {
            limpiarFormCondomino();
        }, 0);
    });

    fetchGestion(function () {
        renderTodo();
        activar('reportes');
    });
});

$(function () {
    var url = 'index.php';

    function estadoClass(estado) {
        var e = String(estado || '').trim().toLowerCase();
        if (e === 'activo' || e === 'activa' || e === 'dentro' || e === 'adentro' || e === 'disponible' || e === 'ocupada') {
            return 'activo';
        }
        if (e === 'afuera' || e === 'salio' || e === 'salió') {
            return 'afuera';
        }
        if (e === 'mantenimiento') {
            return 'mantenimiento';
        }
        if (e === 'pendiente') {
            return 'pendiente';
        }
        return 'inactivo';
    }

    function alerta(msg, tipo) {
        var el = $('<div class="alerta alerta-' + (tipo === 'ok' ? 'ok' : 'err') + '">').text(msg);
        $('main').prepend(el);
        setTimeout(function () {
            el.fadeOut(400, function () { el.remove(); });
        }, 3500);
    }

    function fechaHora(str) {
        if (!str) return '—';
        var s = String(str).replace('T', ' ');
        return s.length >= 16 ? s.substr(0, 16) : s;
    }

    function vacio(tb, cols, msg) {
        if (!tb.children().length) tb.append('<tr><td colspan="' + cols + '" class="celda-vacia">' + msg + '</td></tr>');
    }

    function cargarAccesosAdmin() {
        if (!$('#acc-hist-admin').length) return;
        $.get(url + '?page=admin&option=get_accesos_admin', function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            var tb = $('#acc-hist-admin tbody').empty();
            $.each(d.historial || [], function (i, a) {
                tb.append(
                    '<tr>' +
                        '<td>' + (a.id || '—') + '</td>' +
                        '<td>' + (a.tipo || '—') + '</td>' +
                        '<td>' + (a.nombre || '—') + '</td>' +
                        '<td>' + (a.placa || '—') + '</td>' +
                        '<td>' + fechaHora(a.fecha_entrada) + '</td>' +
                        '<td>' + fechaHora(a.fecha_salida) + '</td>' +
                        '<td><span class="estado-' + estadoClass(a.estado) + '">' + (a.estado || '—') + '</span></td>' +
                        '<td><button class="btn-eliminar btn-eliminar-acceso-admin" data-id="' + (a.id || '') + '"><i class="fa-solid fa-trash"></i> Eliminar</button></td>' +
                    '</tr>'
                );
            });
            vacio(tb, 8, 'Sin historial registrado');
        });
    }

    function cargarTurnosAdmin() {
        if (!$('#turnos-admin').length) return;
        $.get(url + '?page=admin&option=get_turnos_admin', function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            var turnoActivo = $('#turno-activo-admin').empty();
            if (d.activo) {
                turnoActivo.html(
                    '<div class="alerta alerta-ok" style="display:block;">' +
                        '<strong>TURNO ACTIVO:</strong> ' + String(d.activo.guardia_nombre || '—').toUpperCase() +
                        ' | Inicio: ' + fechaHora(d.activo.fecha_inicio) +
                    '</div>'
                );
            } else {
                turnoActivo.html(
                    '<div class="alerta alerta-err" style="display:block;">SIN TURNO ACTIVO.</div>'
                );
            }

            var tb = $('#turnos-admin tbody').empty();
            $.each(d.recientes || d.turnos || [], function (i, t) {
                tb.append(
                    '<tr>' +
                        '<td>' + String(t.guardia_nombre || '—').toUpperCase() + '</td>' +
                        '<td>' + (t.fecha_turno || (t.fecha_inicio ? fechaHora(t.fecha_inicio).substr(0, 10) : '—')) + '</td>' +
                        '<td>' + String(t.horario_turno || '—').toUpperCase() + '</td>' +
                        '<td><span class="estado-' + estadoClass(t.estado) + '">' + String(t.estado || '—').toUpperCase() + '</span></td>' +
                        '<td class="tabla-acciones">' +
                            '<button class="btn-editar btn-editar-turno-admin" data-id_persona="' + (t.id_persona || '') + '" data-id_fechas="' + (t.id_fechas || '') + '" data-id_horario="' + (t.id_horario || '') + '" data-nombre="' + (t.guardia_nombre || '') + '" data-fecha="' + (t.fecha_turno || '') + '" data-horario="' + (t.horario_turno || '') + '" data-estado="' + (t.estado || '') + '"><i class="fa-solid fa-pencil"></i> Editar</button>' +
                            '<button class="btn-eliminar btn-eliminar-turno-admin" data-id_persona="' + (t.id_persona || '') + '" data-id_fechas="' + (t.id_fechas || '') + '" data-id_horario="' + (t.id_horario || '') + '"><i class="fa-solid fa-trash"></i> Eliminar</button>' +
                        '</td>' +
                    '</tr>'
                );
            });
            vacio(tb, 5, 'Sin turnos registrados');
        });
    }

    function limpiarTurnoForm() {
        if (!$('#formTurnoAdmin').length) return;
        $('#formTurnoAdmin')[0].reset();
        $('#turno_id_persona, #turno_id_fechas, #turno_id_horario').val('');
        $('#tituloTurnoAdmin').html('<i class="fa-solid fa-pen"></i> Editar turno');
    }

    $('#formTurnoAdmin').on('submit', function (e) {
        e.preventDefault();
        $.post(url, { page: 'admin', option: 'guardar_turno_admin', ...$(this).serializeArray().reduce((acc, {name, value}) => ({...acc, [name]: value}), {}) }, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') {
                alerta('Turno guardado.', 'ok');
                limpiarTurnoForm();
                cargarTurnosAdmin();
            } else {
                alerta(d.message || 'No se pudo guardar.', 'err');
            }
        });
    });

    $('#btnLimpiarTurnoAdmin').on('click', function () {
        limpiarTurnoForm();
    });

    $(document).on('click', '.nav-sec', function (e) {
        var sec = $(this).data('sec');
        if (sec === 'accesos-admin') {
            cargarAccesosAdmin();
        }
        if (sec === 'turnos-admin') {
            cargarTurnosAdmin();
        }
    });

    $('#sec-accesos-admin').on('click', '.btn-eliminar-acceso-admin', function () {
        if (!confirm('¿Eliminar este acceso?')) return;
        $.post(url, { page: 'admin', option: 'eliminar_acceso_admin', id: $(this).data('id') }, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') {
                alerta('Acceso eliminado.', 'ok');
                cargarAccesosAdmin();
            } else {
                alerta(d.message || 'No se pudo eliminar.', 'err');
            }
        });
    });

    $('#sec-accesos-admin').on('click', function () {
        cargarAccesosAdmin();
    });

    $('#sec-turnos-admin').on('click', '.btn-editar-turno-admin', function () {
        var btn = $(this);
        $('#turno_id_persona').val(btn.data('id_persona'));
        $('#turno_id_fechas').val(btn.data('id_fechas'));
        $('#turno_id_horario').val(btn.data('id_horario'));
        $('#turno_guardia_nombre').val(btn.data('nombre'));
        $('#turno_fecha').val(btn.data('fecha'));
        $('#turno_horario').val(btn.data('horario'));
        $('#turno_estado').val(btn.data('estado'));
        $('#tituloTurnoAdmin').html('<i class="fa-solid fa-pen"></i> Editando turno');
        $('html, body').animate({scrollTop: $('#sec-turnos-admin').offset().top + 500}, 300);
    });

    $('#sec-turnos-admin').on('click', '.btn-eliminar-turno-admin', function () {
        if (!confirm('¿Eliminar este turno?')) return;
        $.post(url, {
            page: 'admin',
            option: 'eliminar_turno_admin',
            id_persona: $(this).data('id_persona'),
            id_fechas: $(this).data('id_fechas'),
            id_horario: $(this).data('id_horario')
        }, function (raw) {
            var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (d.response == '00') {
                alerta('Turno eliminado.', 'ok');
                cargarTurnosAdmin();
            } else {
                alerta(d.message || 'No se pudo eliminar.', 'err');
            }
        });
    });

    $('#sec-turnos-admin').on('click', function () {
        cargarTurnosAdmin();
    });

    cargarAccesosAdmin();
    cargarTurnosAdmin();
});