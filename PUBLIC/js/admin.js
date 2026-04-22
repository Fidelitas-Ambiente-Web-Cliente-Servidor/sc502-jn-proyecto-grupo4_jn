$(function () {
    var KEY_RESIDENCIAS = 'aralias_admin_residencias';
    var KEY_CONDOMINOS = 'aralias_admin_condominos';

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

    function ahoraTexto() {
        var d = new Date();
        var yyyy = d.getFullYear();
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        var hh = String(d.getHours()).padStart(2, '0');
        var mi = String(d.getMinutes()).padStart(2, '0');
        return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + mi;
    }

    function leer(clave) {
        try {
            return JSON.parse(localStorage.getItem(clave)) || [];
        } catch (e) {
            return [];
        }
    }

    function guardar(clave, datos) {
        localStorage.setItem(clave, JSON.stringify(datos));
    }

    function siguienteId(lista) {
        var max = 0;
        $.each(lista, function (_, item) {
            var id = parseInt(item.id, 10) || 0;
            if (id > max) max = id;
        });
        return max + 1;
    }

    function getResidencias() {
        return leer(KEY_RESIDENCIAS);
    }

    function getCondominos() {
        return leer(KEY_CONDOMINOS);
    }

    function saveResidencias(data) {
        guardar(KEY_RESIDENCIAS, data);
    }

    function saveCondominos(data) {
        guardar(KEY_CONDOMINOS, data);
    }

    function sembrarDatosSiHaceFalta() {
        var residencias = getResidencias();
        var condominos = getCondominos();

        if (!residencias.length) {
            residencias = [
                { id: 1, codigo: 'A-101', tipo: 'Apartamento', bloque: 'Torre A', capacidad: 4, estado: 'Activa' },
                { id: 2, codigo: 'A-102', tipo: 'Apartamento', bloque: 'Torre A', capacidad: 3, estado: 'Activa' },
                { id: 3, codigo: 'Casa 7', tipo: 'Casa', bloque: 'Residencial Norte', capacidad: 5, estado: 'Activa' }
            ];
            saveResidencias(residencias);
        }

        if (!condominos.length) {
            condominos = [
                { id: 1, nombre: 'Daniela Mora', identificacion: '123456789', telefono: '8888-1111', residencia_id: 1, estado: 'Activo', fecha_registro: ahoraTexto() },
                { id: 2, nombre: 'María Jiménez', identificacion: '223456789', telefono: '8888-2222', residencia_id: 1, estado: 'Activo', fecha_registro: ahoraTexto() },
                { id: 3, nombre: 'Carlos Rojas', identificacion: '323456789', telefono: '8888-3333', residencia_id: 2, estado: 'Activo', fecha_registro: ahoraTexto() }
            ];
            saveCondominos(condominos);
        }
    }

    function contarCondominosPorResidencia(idResidencia) {
        var condominos = getCondominos();
        var total = 0;
        $.each(condominos, function (_, c) {
            if (parseInt(c.residencia_id, 10) === parseInt(idResidencia, 10)) {
                total++;
            }
        });
        return total;
    }

    function nombreResidencia(idResidencia) {
        var residencias = getResidencias();
        var nombre = '—';
        $.each(residencias, function (_, r) {
            if (parseInt(r.id, 10) === parseInt(idResidencia, 10)) {
                nombre = r.codigo;
                return false;
            }
        });
        return nombre;
    }

    function llenarSelectResidencias() {
        var select = $('#cond_residencia').empty();
        var residencias = getResidencias();

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
        var residencias = getResidencias();
        var condominos = getCondominos();

        var ocupadas = 0;
        var cuposDisponibles = 0;

        $.each(residencias, function (_, r) {
            var ocupantes = contarCondominosPorResidencia(r.id);
            if (ocupantes > 0) ocupadas++;
            cuposDisponibles += Math.max((parseInt(r.capacidad, 10) || 0) - ocupantes, 0);
        });

        $('#rep-total-residencias').text(residencias.length);
        $('#rep-total-residentes').text(condominos.length);
        $('#rep-residencias-ocupadas').text(ocupadas);
        $('#rep-cupos-disponibles').text(cuposDisponibles);

        var tbResidentes = $('#tbl-reporte-residentes tbody').empty();
        var recientes = condominos.slice().sort(function (a, b) {
            return String(b.fecha_registro || '').localeCompare(String(a.fecha_registro || ''));
        });

        $.each(recientes, function (_, c) {
            tbResidentes.append(
                '<tr>' +
                    '<td>' + c.id + '</td>' +
                    '<td>' + c.nombre + '</td>' +
                    '<td>' + c.identificacion + '</td>' +
                    '<td>' + nombreResidencia(c.residencia_id) + '</td>' +
                    '<td><span class="estado-' + (c.estado === 'Activo' ? 'activo' : 'inactivo') + '">' + c.estado + '</span></td>' +
                    '<td>' + (c.fecha_registro || '—') + '</td>' +
                '</tr>'
            );
        });
        vacio(tbResidentes, 6, 'No hay condóminos registrados');

        var tbResidencias = $('#tbl-reporte-residencias tbody').empty();
        $.each(residencias, function (_, r) {
            var ocupantes = contarCondominosPorResidencia(r.id);
            tbResidencias.append(
                '<tr>' +
                    '<td>' + r.id + '</td>' +
                    '<td>' + r.codigo + '</td>' +
                    '<td>' + r.tipo + '</td>' +
                    '<td>' + (r.bloque || '—') + '</td>' +
                    '<td>' + r.capacidad + '</td>' +
                    '<td>' + ocupantes + '</td>' +
                    '<td><span class="estado-' + (r.estado === 'Activa' ? 'activo' : 'inactivo') + '">' + r.estado + '</span></td>' +
                '</tr>'
            );
        });
        vacio(tbResidencias, 7, 'No hay residencias registradas');
    }

    function renderGestion() {
        var residencias = getResidencias();
        var condominos = getCondominos();

        var tbResidencias = $('#tbl-residencias tbody').empty();
        $.each(residencias, function (_, r) {
            var ocupantes = contarCondominosPorResidencia(r.id);
            tbResidencias.append(
                '<tr>' +
                    '<td>' + r.id + '</td>' +
                    '<td>' + r.codigo + '</td>' +
                    '<td>' + r.tipo + '</td>' +
                    '<td>' + (r.bloque || '—') + '</td>' +
                    '<td>' + r.capacidad + '</td>' +
                    '<td>' + ocupantes + '</td>' +
                    '<td><span class="estado-' + (r.estado === 'Activa' ? 'activo' : 'inactivo') + '">' + r.estado + '</span></td>' +
                    '<td class="tabla-acciones">' +
                        '<button class="btn-editar btn-editar-residencia" data-id="' + r.id + '"><i class="fa-solid fa-pen"></i> Editar</button>' +
                        '<button class="btn-eliminar btn-eliminar-residencia" data-id="' + r.id + '"><i class="fa-solid fa-trash"></i> Eliminar</button>' +
                    '</td>' +
                '</tr>'
            );
        });
        vacio(tbResidencias, 8, 'No hay residencias registradas');

        var tbCondominos = $('#tbl-condominos tbody').empty();
        $.each(condominos, function (_, c) {
            tbCondominos.append(
                '<tr>' +
                    '<td>' + c.id + '</td>' +
                    '<td>' + c.nombre + '</td>' +
                    '<td>' + c.identificacion + '</td>' +
                    '<td>' + (c.telefono || '—') + '</td>' +
                    '<td>' + nombreResidencia(c.residencia_id) + '</td>' +
                    '<td><span class="estado-' + (c.estado === 'Activo' ? 'activo' : 'inactivo') + '">' + c.estado + '</span></td>' +
                    '<td class="tabla-acciones">' +
                        '<button class="btn-editar btn-editar-condomino" data-id="' + c.id + '"><i class="fa-solid fa-pen"></i> Editar</button>' +
                        '<button class="btn-eliminar btn-eliminar-condomino" data-id="' + c.id + '"><i class="fa-solid fa-trash"></i> Eliminar</button>' +
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

        if (sec === 'reportes') renderResumen();
        if (sec === 'gestion') renderGestion();
    }

    $('.nav-sec').on('click', function (e) {
        e.preventDefault();
        activar($(this).data('sec'));
    });

    $('#formResidencia').on('submit', function (e) {
        e.preventDefault();

        var id = $('#res_id').val();
        var codigo = $('#res_codigo').val().trim();
        var tipo = $('#res_tipo').val();
        var bloque = $('#res_bloque').val().trim();
        var capacidad = parseInt($('#res_capacidad').val(), 10);
        var estado = $('#res_estado').val();

        if (!codigo || !tipo || !capacidad || capacidad < 1) {
            alerta('Complete correctamente los datos de la residencia.', 'err');
            return;
        }

        var residencias = getResidencias();

        if (id) {
            $.each(residencias, function (_, r) {
                if (parseInt(r.id, 10) === parseInt(id, 10)) {
                    r.codigo = codigo;
                    r.tipo = tipo;
                    r.bloque = bloque;
                    r.capacidad = capacidad;
                    r.estado = estado;
                    return false;
                }
            });
            saveResidencias(residencias);
            alerta('Residencia actualizada correctamente.', 'ok');
        } else {
            residencias.push({
                id: siguienteId(residencias),
                codigo: codigo,
                tipo: tipo,
                bloque: bloque,
                capacidad: capacidad,
                estado: estado
            });
            saveResidencias(residencias);
            alerta('Residencia registrada correctamente.', 'ok');
        }

        limpiarFormResidencia();
        renderTodo();
    });

    $('#formCondomino').on('submit', function (e) {
        e.preventDefault();

        var id = $('#cond_id').val();
        var nombre = $('#cond_nombre').val().trim();
        var identificacion = $('#cond_identificacion').val().trim();
        var telefono = $('#cond_telefono').val().trim();
        var residenciaId = $('#cond_residencia').val();
        var estado = $('#cond_estado').val();

        if (!nombre || !identificacion || !residenciaId) {
            alerta('Nombre, identificación y residencia son requeridos.', 'err');
            return;
        }

        if (!getResidencias().length) {
            alerta('Primero debe registrar una residencia.', 'err');
            return;
        }

        var condominos = getCondominos();

        if (id) {
            $.each(condominos, function (_, c) {
                if (parseInt(c.id, 10) === parseInt(id, 10)) {
                    c.nombre = nombre;
                    c.identificacion = identificacion;
                    c.telefono = telefono;
                    c.residencia_id = parseInt(residenciaId, 10);
                    c.estado = estado;
                    return false;
                }
            });
            saveCondominos(condominos);
            alerta('Condómino actualizado correctamente.', 'ok');
        } else {
            condominos.push({
                id: siguienteId(condominos),
                nombre: nombre,
                identificacion: identificacion,
                telefono: telefono,
                residencia_id: parseInt(residenciaId, 10),
                estado: estado,
                fecha_registro: ahoraTexto()
            });
            saveCondominos(condominos);
            alerta('Condómino registrado correctamente.', 'ok');
        }

        limpiarFormCondomino();
        renderTodo();
    });

    $('#tbl-residencias').on('click', '.btn-editar-residencia', function () {
        var id = parseInt($(this).data('id'), 10);
        var residencias = getResidencias();

        $.each(residencias, function (_, r) {
            if (parseInt(r.id, 10) === id) {
                $('#res_id').val(r.id);
                $('#res_codigo').val(r.codigo);
                $('#res_tipo').val(r.tipo);
                $('#res_bloque').val(r.bloque);
                $('#res_capacidad').val(r.capacidad);
                $('#res_estado').val(r.estado);
                $('#tituloFormResidencia').html('<i class="fa-solid fa-pen"></i> Editar residencia').addClass('modo-edicion');
                return false;
            }
        });
    });

    $('#tbl-condominos').on('click', '.btn-editar-condomino', function () {
        var id = parseInt($(this).data('id'), 10);
        var condominos = getCondominos();

        $.each(condominos, function (_, c) {
            if (parseInt(c.id, 10) === id) {
                llenarSelectResidencias();
                $('#cond_id').val(c.id);
                $('#cond_nombre').val(c.nombre);
                $('#cond_identificacion').val(c.identificacion);
                $('#cond_telefono').val(c.telefono);
                $('#cond_residencia').val(c.residencia_id);
                $('#cond_estado').val(c.estado);
                $('#tituloFormCondomino').html('<i class="fa-solid fa-pen"></i> Editar condómino').addClass('modo-edicion');
                return false;
            }
        });
    });

    $('#tbl-residencias').on('click', '.btn-eliminar-residencia', function () {
        var id = parseInt($(this).data('id'), 10);

        if (contarCondominosPorResidencia(id) > 0) {
            alerta('No puede eliminar una residencia que tiene condóminos asociados.', 'err');
            return;
        }

        if (!confirm('¿Desea eliminar esta residencia?')) return;

        var residencias = $.grep(getResidencias(), function (r) {
            return parseInt(r.id, 10) !== id;
        });

        saveResidencias(residencias);
        limpiarFormResidencia();
        renderTodo();
        alerta('Residencia eliminada correctamente.', 'ok');
    });

    $('#tbl-condominos').on('click', '.btn-eliminar-condomino', function () {
        var id = parseInt($(this).data('id'), 10);

        if (!confirm('¿Desea eliminar este condómino?')) return;

        var condominos = $.grep(getCondominos(), function (c) {
            return parseInt(c.id, 10) !== id;
        });

        saveCondominos(condominos);
        limpiarFormCondomino();
        renderTodo();
        alerta('Condómino eliminado correctamente.', 'ok');
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

    sembrarDatosSiHaceFalta();
    renderTodo();
    activar('reportes');
});