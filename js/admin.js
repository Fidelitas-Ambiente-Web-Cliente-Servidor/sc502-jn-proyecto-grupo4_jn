let guardias = [
    {
        id: 1,
        nombre: "Luis",
        apellidoPaterno: "Mora",
        apellidoMaterno: "Vega",
        telefono: "8888-1111",
        correo: "luis.mora@correo.com",
        estado: "Activo"
    }
];

let residencias = [
    {
        id: 1,
        montoAlquiler: 350000,
        montoMantenimiento: 25000,
        tipoPago: "Mensual",
        estado: "Activo"
    }
];

let residentes = [
    {
        id: 1,
        nombre: "Ana",
        apellidoPaterno: "Rojas",
        apellidoMaterno: "Solano",
        telefono: "8888-2222",
        correo: "ana.rojas@correo.com",
        residenciaId: 1,
        estado: "Activo"
    }
];

let eventos = [
    {
        id: 1,
        descripcion: "Panel inicializado",
        tipo: "Sistema",
        fecha: hoyTexto(),
        estado: "Activo"
    }
];

let facturas = [
    {
        id: 1,
        fecha: "2026-03-01",
        descripcion: "Pago mantenimiento marzo",
        residente: "Sebastian Rojas",
        tipoPago: "Mantenimiento",
        formaPago: "Transferencia",
        estado: "Pendiente"
    }
];

let servicios = [
    {
        id: 1,
        descripcion: "Revisión eléctrica",
        tipo: "Electricidad",
        fechaSalida: "2026-03-03",
        estado: "Activo"
    }
];

let tarjetasResumen;
let tablaInicio;
let guardiasFormulario;
let guardiasTabla;
let residenciasFormulario;
let residenciasTabla;
let residentesFormulario;
let residentesTabla;

let ultimoIdGuardia = 1;
let ultimoIdResidencia = 1;
let ultimoIdResidente = 1;
let ultimoIdFactura = 1;
let ultimoIdServicio = 1;
let ultimoIdEvento = 1;

let editandoGuardiaId = null;
let editandoResidenciaId = null;
let editandoResidenteId = null;
let editandoFacturaId = null;
let editandoServicioId = null;
let editandoEventoId = null;

function mostrarSeccion(idSeccion) {
    let secciones = document.querySelectorAll(".seccion");

    for (let i = 0; i < secciones.length; i++) {
        secciones[i].classList.remove("activa");
    }

    let seccion = document.getElementById(idSeccion);
    if (seccion) {
        seccion.classList.add("activa");
    }

    actualizarNavegacion(idSeccion);
}

document.addEventListener("DOMContentLoaded", function () {
    tarjetasResumen = document.querySelectorAll("#inicio .tarjeta-resumen h3");
    tablaInicio = document.querySelector("#inicio table tbody");

    guardiasFormulario = document.querySelector("#guardias form");
    guardiasTabla = document.querySelector("#guardias .bloque-tabla tbody");

    residenciasFormulario = document.querySelector("#residencias form");
    residenciasTabla = document.querySelector("#residencias .bloque-tabla tbody");

    residentesFormulario = document.querySelector("#residentes form");
    residentesTabla = document.querySelector("#residentes .bloque-tabla tbody");

    enlazarEventos();
    renderGuardias();
    renderResidencias();
    renderResidentes();
    mostrarFacturas();
    mostrarServicios();
    mostrarEventos();
    mostrarEventosInicio();
    actualizarInicio();
    actualizarNavegacion("inicio");
});

function enlazarEventos() {
    if (guardiasFormulario) {
        guardiasFormulario.addEventListener("submit", registrarGuardia);
        enlazarBotonLimpiar(guardiasFormulario, "guardia");
    }

    if (residenciasFormulario) {
        residenciasFormulario.addEventListener("submit", registrarResidencia);
        enlazarBotonLimpiar(residenciasFormulario, "residencia");
    }

    if (residentesFormulario) {
        residentesFormulario.addEventListener("submit", registrarResidente);
        enlazarBotonLimpiar(residentesFormulario, "residente");
    }

    if (guardiasTabla) {
        guardiasTabla.addEventListener("click", accionesGuardias);
    }

    if (residenciasTabla) {
        residenciasTabla.addEventListener("click", accionesResidencias);
    }

    if (residentesTabla) {
        residentesTabla.addEventListener("click", accionesResidentes);
    }

    enlazarEventosFacturasServiciosEventos();
}

function enlazarBotonLimpiar(formulario, tipo) {
    let boton = formulario.querySelector(".btn-limpiar");
    if (!boton) {
        return;
    }

    boton.addEventListener("click", function () {
        formulario.reset();

        if (tipo === "guardia") {
            editandoGuardiaId = null;
        }

        if (tipo === "residencia") {
            editandoResidenciaId = null;
        }

        if (tipo === "residente") {
            editandoResidenteId = null;
        }
    });
}

function registrarGuardia(event) {
    event.preventDefault();

    let form = guardiasFormulario;
    let inputs = form.querySelectorAll("input");
    let selectEstado = form.querySelector("select");

    let nombre = inputs[0].value.trim();
    let apellidoPaterno = inputs[1].value.trim();
    let apellidoMaterno = inputs[2].value.trim();
    let telefono = inputs[3].value.trim();
    let correo = inputs[4].value.trim();
    let estado = selectEstado.value.trim();

    limpiarMensajes(form);

    if (!nombre || !apellidoPaterno || !apellidoMaterno || !telefono || !correo) {
        window.alert("Complete todos los campos.");
        return;
    }

    if (editandoGuardiaId !== null) {
        let guardia = buscarPorId(guardias, editandoGuardiaId);
        if (!guardia) {
            return;
        }

        guardia.nombre = nombre;
        guardia.apellidoPaterno = apellidoPaterno;
        guardia.apellidoMaterno = apellidoMaterno;
        guardia.telefono = telefono;
        guardia.correo = correo;
        guardia.estado = estado;

        registrarIncidente("Guardia actualizado", "Guardias", "Activo");
    } else {
        ultimoIdGuardia++;
        guardias.push({
            id: ultimoIdGuardia,
            nombre: nombre,
            apellidoPaterno: apellidoPaterno,
            apellidoMaterno: apellidoMaterno,
            telefono: telefono,
            correo: correo,
            estado: estado
        });

        registrarIncidente("Guardia registrado", "Guardias", "Activo");
    }

    form.reset();
    editandoGuardiaId = null;
    renderGuardias();
    actualizarInicio();
}

function registrarResidencia(event) {
    event.preventDefault();

    let form = residenciasFormulario;
    let inputs = form.querySelectorAll("input");
    let selects = form.querySelectorAll("select");

    let montoAlquiler = Number(inputs[0].value);
    let montoMantenimiento = Number(inputs[1].value);
    let tipoPago = selects[0].value.trim();
    let estado = selects[1].value.trim();

    limpiarMensajes(form);

    if (!montoAlquiler || !montoMantenimiento) {
        window.alert("Ingrese montos validos.");
        return;
    }

    if (editandoResidenciaId !== null) {
        let residencia = buscarPorId(residencias, editandoResidenciaId);
        if (!residencia) {
            return;
        }

        residencia.montoAlquiler = montoAlquiler;
        residencia.montoMantenimiento = montoMantenimiento;
        residencia.tipoPago = tipoPago;
        residencia.estado = estado;

        registrarIncidente("Residencia actualizada", "Residencias", "Activo");
    } else {
        ultimoIdResidencia++;
        residencias.push({
            id: ultimoIdResidencia,
            montoAlquiler: montoAlquiler,
            montoMantenimiento: montoMantenimiento,
            tipoPago: tipoPago,
            estado: estado
        });

        registrarIncidente("Residencia registrada", "Residencias", "Activo");
    }

    form.reset();
    editandoResidenciaId = null;
    renderResidencias();
    renderResidentes();
    actualizarInicio();
}

function registrarResidente(event) {
    event.preventDefault();

    let form = residentesFormulario;
    let inputs = form.querySelectorAll("input");
    let selects = form.querySelectorAll("select");

    let nombre = inputs[0].value.trim();
    let apellidoPaterno = inputs[1].value.trim();
    let apellidoMaterno = inputs[2].value.trim();
    let telefono = inputs[3].value.trim();
    let correo = inputs[4].value.trim();
    let residenciaId = Number(selects[0].value);
    let estado = selects[1].value.trim();

    limpiarMensajes(form);

    if (!nombre || !apellidoPaterno || !apellidoMaterno || !telefono || !correo || !residenciaId) {
        window.alert("Complete todos los campos.");
        return;
    }

    if (!buscarPorId(residencias, residenciaId)) {
        window.alert("La residencia seleccionada no existe.");
        return;
    }

    if (editandoResidenteId !== null) {
        let residente = buscarPorId(residentes, editandoResidenteId);
        if (!residente) {
            return;
        }

        residente.nombre = nombre;
        residente.apellidoPaterno = apellidoPaterno;
        residente.apellidoMaterno = apellidoMaterno;
        residente.telefono = telefono;
        residente.correo = correo;
        residente.residenciaId = residenciaId;
        residente.estado = estado;

        registrarIncidente("Residente actualizado", "Residentes", "Activo");
    } else {
        ultimoIdResidente++;
        residentes.push({
            id: ultimoIdResidente,
            nombre: nombre,
            apellidoPaterno: apellidoPaterno,
            apellidoMaterno: apellidoMaterno,
            telefono: telefono,
            correo: correo,
            residenciaId: residenciaId,
            estado: estado
        });

        registrarIncidente("Residente registrado", "Residentes", "Activo");
    }

    form.reset();
    editandoResidenteId = null;
    renderResidentes();
    actualizarInicio();
}

function accionesGuardias(event) {
    let target = event.target;
    let accion = target.getAttribute("data-accion");
    let id = Number(target.getAttribute("data-id"));

    if (accion === "editar") {
        cargarGuardiaEnFormulario(id);
        return;
    }

    if (accion === "eliminar") {
        eliminarGuardia(id);
    }
}

function accionesResidencias(event) {
    let target = event.target;
    let accion = target.getAttribute("data-accion");
    let id = Number(target.getAttribute("data-id"));

    if (accion === "editar") {
        cargarResidenciaEnFormulario(id);
        return;
    }

    if (accion === "eliminar") {
        eliminarResidencia(id);
    }
}

function accionesResidentes(event) {
    let target = event.target;
    let accion = target.getAttribute("data-accion");
    let id = Number(target.getAttribute("data-id"));

    if (accion === "editar") {
        cargarResidenteEnFormulario(id);
        return;
    }

    if (accion === "eliminar") {
        eliminarResidente(id);
    }
}

function cargarGuardiaEnFormulario(id) {
    let guardia = buscarPorId(guardias, id);
    if (!guardia) {
        return;
    }

    let inputs = guardiasFormulario.querySelectorAll("input");
    let select = guardiasFormulario.querySelector("select");

    inputs[0].value = guardia.nombre;
    inputs[1].value = guardia.apellidoPaterno;
    inputs[2].value = guardia.apellidoMaterno;
    inputs[3].value = guardia.telefono;
    inputs[4].value = guardia.correo;
    select.value = normalizarEstadoFormulario(guardia.estado);

    editandoGuardiaId = id;
}

function cargarResidenciaEnFormulario(id) {
    let residencia = buscarPorId(residencias, id);
    if (!residencia) {
        return;
    }

    let inputs = residenciasFormulario.querySelectorAll("input");
    let selects = residenciasFormulario.querySelectorAll("select");

    inputs[0].value = String(residencia.montoAlquiler);
    inputs[1].value = String(residencia.montoMantenimiento);
    selects[0].value = residencia.tipoPago;
    selects[1].value = normalizarEstadoFormulario(residencia.estado);

    editandoResidenciaId = id;
}

function cargarResidenteEnFormulario(id) {
    let residente = buscarPorId(residentes, id);
    if (!residente) {
        return;
    }

    let inputs = residentesFormulario.querySelectorAll("input");
    let selects = residentesFormulario.querySelectorAll("select");

    inputs[0].value = residente.nombre;
    inputs[1].value = residente.apellidoPaterno;
    inputs[2].value = residente.apellidoMaterno;
    inputs[3].value = residente.telefono;
    inputs[4].value = residente.correo;
    selects[0].value = String(residente.residenciaId);
    selects[1].value = normalizarEstadoFormulario(residente.estado);

    editandoResidenteId = id;
}

function eliminarGuardia(id) {
    let confirmar = window.confirm("Desea eliminar este guardia?");
    if (!confirmar) {
        return;
    }

    let indice = obtenerIndicePorId(guardias, id);
    if (indice < 0) {
        return;
    }

    guardias.splice(indice, 1);

    if (editandoGuardiaId === id) {
        editandoGuardiaId = null;
        guardiasFormulario.reset();
    }

    registrarIncidente("Guardia eliminado", "Guardias", "Inactivo");
    renderGuardias();
    actualizarInicio();
}

function eliminarResidencia(id) {
    for (let i = 0; i < residentes.length; i++) {
        if (residentes[i].residenciaId === id) {
            window.alert("No puede eliminar esta residencia porque tiene residentes asociados.");
            return;
        }
    }

    let confirmar = window.confirm("Desea eliminar esta residencia?");
    if (!confirmar) {
        return;
    }

    let indice = obtenerIndicePorId(residencias, id);
    if (indice < 0) {
        return;
    }

    residencias.splice(indice, 1);

    if (editandoResidenciaId === id) {
        editandoResidenciaId = null;
        residenciasFormulario.reset();
    }

    registrarIncidente("Residencia eliminada", "Residencias", "Inactivo");
    renderResidencias();
    actualizarInicio();
}

function eliminarResidente(id) {
    let confirmar = window.confirm("Desea eliminar este residente?");
    if (!confirmar) {
        return;
    }

    let indice = obtenerIndicePorId(residentes, id);
    if (indice < 0) {
        return;
    }

    residentes.splice(indice, 1);

    if (editandoResidenteId === id) {
        editandoResidenteId = null;
        residentesFormulario.reset();
    }

    registrarIncidente("Residente eliminado", "Residentes", "Inactivo");
    renderResidentes();
    actualizarInicio();
}

function renderGuardias() {
    if (!guardiasTabla) {
        return;
    }

    guardiasTabla.innerHTML = "";

    if (guardias.length === 0) {
        guardiasTabla.innerHTML = "<tr><td colspan='6' class='celda-vacia'>Sin guardias registrados.</td></tr>";
        return;
    }

    for (let i = 0; i < guardias.length; i++) {
        let g = guardias[i];
        let fila = document.createElement("tr");

        fila.innerHTML =
            "<td>" + g.nombre + "</td>" +
            "<td>" + g.apellidoPaterno + " " + g.apellidoMaterno + "</td>" +
            "<td>" + g.telefono + "</td>" +
            "<td>" + g.correo + "</td>" +
            "<td class='" + claseEstado(g.estado) + "'>" + g.estado + "</td>" +
            "<td>" +
            "<button type='button' class='btn-editar' data-accion='editar' data-id='" + g.id + "'>Editar</button>" +
            "<button type='button' class='btn-eliminar' data-accion='eliminar' data-id='" + g.id + "'>Eliminar</button>" +
            "</td>";

        guardiasTabla.appendChild(fila);
    }
}

function renderResidencias() {
    if (!residenciasTabla) {
        return;
    }

    residenciasTabla.innerHTML = "";

    if (residencias.length === 0) {
        residenciasTabla.innerHTML = "<tr><td colspan='6' class='celda-vacia'>Sin residencias registradas.</td></tr>";
        poblarSelectResidencias();
        return;
    }

    for (let i = 0; i < residencias.length; i++) {
        let r = residencias[i];
        let fila = document.createElement("tr");

        fila.innerHTML =
            "<td>" + r.id + "</td>" +
            "<td>" + Number(r.montoAlquiler).toLocaleString("es-CR") + "</td>" +
            "<td>" + Number(r.montoMantenimiento).toLocaleString("es-CR") + "</td>" +
            "<td>" + r.tipoPago + "</td>" +
            "<td class='" + claseEstado(r.estado) + "'>" + r.estado + "</td>" +
            "<td>" +
            "<button type='button' class='btn-editar' data-accion='editar' data-id='" + r.id + "'>Editar</button>" +
            "<button type='button' class='btn-eliminar' data-accion='eliminar' data-id='" + r.id + "'>Eliminar</button>" +
            "</td>";

        residenciasTabla.appendChild(fila);
    }

    poblarSelectResidencias();
}

function renderResidentes() {
    if (!residentesTabla) {
        return;
    }

    residentesTabla.innerHTML = "";

    if (residentes.length === 0) {
        residentesTabla.innerHTML = "<tr><td colspan='6' class='celda-vacia'>Sin residentes registrados.</td></tr>";
        return;
    }

    for (let i = 0; i < residentes.length; i++) {
        let r = residentes[i];
        let fila = document.createElement("tr");

        fila.innerHTML =
            "<td>" + r.nombre + "</td>" +
            "<td>" + r.apellidoPaterno + " " + r.apellidoMaterno + "</td>" +
            "<td>" + r.telefono + "</td>" +
            "<td>" + nombreResidencia(r.residenciaId) + "</td>" +
            "<td class='" + claseEstado(r.estado) + "'>" + r.estado + "</td>" +
            "<td>" +
            "<button type='button' class='btn-editar' data-accion='editar' data-id='" + r.id + "'>Editar</button>" +
            "<button type='button' class='btn-eliminar' data-accion='eliminar' data-id='" + r.id + "'>Eliminar</button>" +
            "</td>";

        residentesTabla.appendChild(fila);
    }
}

function poblarSelectResidencias() {
    if (!residentesFormulario) {
        return;
    }

    let select = residentesFormulario.querySelectorAll("select")[0];
    if (!select) {
        return;
    }

    let opcionBase = "<option value=''>-- Seleccione --</option>";
    select.innerHTML = opcionBase;

    for (let i = 0; i < residencias.length; i++) {
        let opcion = document.createElement("option");
        opcion.value = String(residencias[i].id);
        opcion.textContent = "Residencia #" + residencias[i].id + " - " + residencias[i].estado;
        select.appendChild(opcion);
    }
}

function registrarIncidente(descripcion, tipo, estado) {
    let fecha = hoyTexto();
    ultimoIdEvento++;

    eventos.unshift({
        id: ultimoIdEvento,
        descripcion: descripcion,
        tipo: tipo,
        fecha: fecha,
        estado: estado
    });

    if (eventos.length > 8) {
        eventos.pop();
    }

    mostrarEventos();
    mostrarEventosInicio();
}

function actualizarInicio() {
    if (tarjetasResumen && tarjetasResumen.length >= 3) {
        let guardiasActivos = 0;

        for (let i = 0; i < guardias.length; i++) {
            if (guardias[i].estado === "Activo") {
                guardiasActivos++;
            }
        }

        tarjetasResumen[0].textContent = String(guardiasActivos);
        tarjetasResumen[1].textContent = String(residentes.length);
        tarjetasResumen[2].textContent = String(residencias.length);

        if (tarjetasResumen.length > 4) {
            let eventosActivos = 0;
            for (let i = 0; i < eventos.length; i++) {
                if (eventos[i].estado === "Activo") {
                    eventosActivos++;
                }
            }
            tarjetasResumen[4].textContent = String(eventosActivos);
        }

        if (tarjetasResumen.length > 5) {
            let facturasPendientes = 0;
            for (let i = 0; i < facturas.length; i++) {
                if (facturas[i].estado === "Pendiente") {
                    facturasPendientes++;
                }
            }
            tarjetasResumen[5].textContent = String(facturasPendientes);
        }
    }

    if (!tablaInicio) {
        return;
    }

    tablaInicio.innerHTML = "";

    if (eventos.length === 0) {
        tablaInicio.innerHTML = "<tr><td colspan='4' class='celda-vacia'>Sin eventos registrados.</td></tr>";
        return;
    }

    let limite = 5;
    if (eventos.length < limite) {
        limite = eventos.length;
    }

    for (let i = 0; i < limite; i++) {
        let e = eventos[i];
        let fila = document.createElement("tr");

        fila.innerHTML =
            "<td>" + e.descripcion + "</td>" +
            "<td>" + e.tipo + "</td>" +
            "<td>" + e.fecha + "</td>" +
            "<td class='" + claseEstado(e.estado) + "'>" + e.estado + "</td>";

        tablaInicio.appendChild(fila);
    }
}

function mostrarFacturas() {
    let tablaFacturas = document.querySelector("#facturas tbody");
    if (!tablaFacturas) {
        return;
    }

    tablaFacturas.innerHTML = "";

    if (facturas.length === 0) {
        tablaFacturas.innerHTML = "<tr><td colspan='7' class='celda-vacia'>Sin facturas registradas.</td></tr>";
        return;
    }

    for (let i = 0; i < facturas.length; i++) {
        let f = facturas[i];
        let fila = document.createElement("tr");

        fila.innerHTML =
            "<td>" + f.fecha + "</td>" +
            "<td>" + f.descripcion + "</td>" +
            "<td>" + f.residente + "</td>" +
            "<td>" + f.tipoPago + "</td>" +
            "<td>" + f.formaPago + "</td>" +
            "<td class='" + claseEstado(f.estado) + "'>" + f.estado + "</td>" +
            "<td>" +
            "<button type='button' class='btn-editar' data-accion='editar-factura' data-id='" + f.id + "'>Editar</button>" +
            "<button type='button' class='btn-eliminar' data-accion='eliminar-factura' data-id='" + f.id + "'>Eliminar</button>" +
            "</td>";

        tablaFacturas.appendChild(fila);
    }
}

function mostrarServicios() {
    let tablaServicios = document.querySelector("#servicios tbody");
    if (!tablaServicios) {
        return;
    }

    tablaServicios.innerHTML = "";

    if (servicios.length === 0) {
        tablaServicios.innerHTML = "<tr><td colspan='5' class='celda-vacia'>Sin servicios registrados.</td></tr>";
        return;
    }

    for (let i = 0; i < servicios.length; i++) {
        let s = servicios[i];
        let fila = document.createElement("tr");

        fila.innerHTML =
            "<td>" + s.descripcion + "</td>" +
            "<td>" + s.tipo + "</td>" +
            "<td>" + s.fechaSalida + "</td>" +
            "<td class='" + claseEstado(s.estado) + "'>" + s.estado + "</td>" +
            "<td>" +
            "<button type='button' class='btn-editar' data-accion='editar-servicio' data-id='" + s.id + "'>Editar</button>" +
            "<button type='button' class='btn-eliminar' data-accion='eliminar-servicio' data-id='" + s.id + "'>Eliminar</button>" +
            "</td>";

        tablaServicios.appendChild(fila);
    }
}

function mostrarEventos() {
    let tablaEventos = document.querySelector("#eventos tbody");
    if (!tablaEventos) {
        return;
    }

    tablaEventos.innerHTML = "";

    if (eventos.length === 0) {
        tablaEventos.innerHTML = "<tr><td colspan='5' class='celda-vacia'>Sin eventos registrados.</td></tr>";
        return;
    }

    for (let i = 0; i < eventos.length; i++) {
        let e = eventos[i];
        let fila = document.createElement("tr");

        fila.innerHTML =
            "<td>" + e.descripcion + "</td>" +
            "<td>" + e.tipo + "</td>" +
            "<td>" + e.fecha + "</td>" +
            "<td class='" + claseEstado(e.estado) + "'>" + e.estado + "</td>" +
            "<td>" +
            "<button type='button' class='btn-editar' data-accion='editar-evento' data-id='" + e.id + "'>Editar</button>" +
            "<button type='button' class='btn-eliminar' data-accion='eliminar-evento' data-id='" + e.id + "'>Eliminar</button>" +
            "</td>";

        tablaEventos.appendChild(fila);
    }
}

function mostrarEventosInicio() {
    let tabla = document.querySelector("#inicio tbody");
    if (!tabla) {
        return;
    }

    tabla.innerHTML = "";

    for (let i = eventos.length - 1; i >= 0; i--) {
        let fila = document.createElement("tr");

        let columnaDescripcion = document.createElement("td");
        columnaDescripcion.innerText = eventos[i].descripcion;

        let columnaTipo = document.createElement("td");
        columnaTipo.innerText = eventos[i].tipo;

        let columnaFecha = document.createElement("td");
        columnaFecha.innerText = eventos[i].fecha;

        let columnaEstado = document.createElement("td");
        columnaEstado.innerText = eventos[i].estado;

        fila.appendChild(columnaDescripcion);
        fila.appendChild(columnaTipo);
        fila.appendChild(columnaFecha);
        fila.appendChild(columnaEstado);

        tabla.appendChild(fila);
    }
}

function enlazarEventosFacturasServiciosEventos() {
    let formularioFactura = document.querySelector("#facturas form");
    let formularioServicio = document.querySelector("#servicios form");
    let formularioEvento = document.querySelector("#eventos form");
    let tablaFacturas = document.querySelector("#facturas tbody");
    let tablaServicios = document.querySelector("#servicios tbody");
    let tablaEventos = document.querySelector("#eventos tbody");

    if (tablaFacturas) {
        tablaFacturas.addEventListener("click", function (event) {
            let target = event.target;
            let accion = target.getAttribute("data-accion");
            let id = Number(target.getAttribute("data-id"));

            if (accion === "editar-factura") {
                cargarFacturaEnFormulario(id);
            }
            if (accion === "eliminar-factura") {
                let confirmar = window.confirm("¿Desea eliminar esta factura?");
                if (!confirmar) { return; }
                let idx = obtenerIndicePorId(facturas, id);
                if (idx < 0) { return; }
                facturas.splice(idx, 1);
                if (editandoFacturaId === id) {
                    editandoFacturaId = null;
                    resetearFormularioFactura(formularioFactura);
                }
                mostrarFacturas();
                actualizarInicio();
            }
        });
    }

    if (tablaServicios) {
        tablaServicios.addEventListener("click", function (event) {
            let target = event.target;
            let accion = target.getAttribute("data-accion");
            let id = Number(target.getAttribute("data-id"));

            if (accion === "editar-servicio") {
                cargarServicioEnFormulario(id);
            }
            if (accion === "eliminar-servicio") {
                let confirmar = window.confirm("¿Desea eliminar este servicio?");
                if (!confirmar) { return; }
                let idx = obtenerIndicePorId(servicios, id);
                if (idx < 0) { return; }
                servicios.splice(idx, 1);
                if (editandoServicioId === id) {
                    editandoServicioId = null;
                    resetearFormularioServicio(formularioServicio);
                }
                mostrarServicios();
            }
        });
    }

    if (tablaEventos) {
        tablaEventos.addEventListener("click", function (event) {
            let target = event.target;
            let accion = target.getAttribute("data-accion");
            let id = Number(target.getAttribute("data-id"));

            if (accion === "editar-evento") {
                cargarEventoEnFormulario(id);
            }
            if (accion === "eliminar-evento") {
                let confirmar = window.confirm("¿Desea eliminar este evento?");
                if (!confirmar) { return; }
                let idx = obtenerIndicePorId(eventos, id);
                if (idx < 0) { return; }
                eventos.splice(idx, 1);
                if (editandoEventoId === id) {
                    editandoEventoId = null;
                    resetearFormularioEvento(formularioEvento);
                }
                mostrarEventos();
                mostrarEventosInicio();
                actualizarInicio();
            }
        });
    }

    if (formularioFactura) {
        let inputsFactura = formularioFactura.querySelectorAll("input");
        let selectsFactura = formularioFactura.querySelectorAll("select");
        let botonLimpiarFactura = formularioFactura.querySelector(".btn-limpiar");
        let selectResidenteFactura = selectsFactura[0];

        if (selectResidenteFactura) {
            selectResidenteFactura.innerHTML = "<option value=''>-- Seleccione --</option>";
            for (let i = 0; i < residentes.length; i++) {
                let opcion = document.createElement("option");
                opcion.value = residentes[i].nombre + " " + residentes[i].apellidoPaterno;
                opcion.innerText = residentes[i].nombre + " " + residentes[i].apellidoPaterno;
                selectResidenteFactura.appendChild(opcion);
            }
        }

        formularioFactura.addEventListener("submit", function (event) {
            event.preventDefault();

            if (editandoFacturaId !== null) {
                let factura = buscarPorId(facturas, editandoFacturaId);
                if (!factura) { return; }
                factura.estado = selectsFactura[3].value;
                registrarIncidente("Factura actualizada", "Facturas", "Activo");
                editandoFacturaId = null;
                resetearFormularioFactura(formularioFactura);
                mostrarFacturas();
                actualizarInicio();
                return;
            }

            let fecha = inputsFactura[0].value;
            let descripcion = inputsFactura[1].value;
            let residente = selectsFactura[0].value;
            let tipoPago = selectsFactura[1].value;
            let formaPago = selectsFactura[2].value;
            let estado = selectsFactura[3].value;

            if (fecha === "" || descripcion === "" || residente === "") {
                if (fecha === "") {
                    inputsFactura[0].style.borderColor = "red";
                } else {
                    inputsFactura[0].style.borderColor = "black";
                }
                if (descripcion === "") {
                    inputsFactura[1].style.borderColor = "red";
                } else {
                    inputsFactura[1].style.borderColor = "black";
                }
                if (residente === "") {
                    selectsFactura[0].style.borderColor = "red";
                } else {
                    selectsFactura[0].style.borderColor = "black";
                }
            } else {
                ultimoIdFactura++;
                let nuevaFactura = {
                    id: ultimoIdFactura,
                    fecha: fecha,
                    descripcion: descripcion,
                    residente: residente,
                    tipoPago: tipoPago,
                    formaPago: formaPago,
                    estado: estado
                };
                facturas.push(nuevaFactura);
                mostrarFacturas();
                actualizarInicio();
                limpiarFormularioFactura(formularioFactura);
            }
        });

        if (botonLimpiarFactura) {
            botonLimpiarFactura.addEventListener("click", function () {
                editandoFacturaId = null;
                resetearFormularioFactura(formularioFactura);
            });
        }
    }

    if (formularioServicio) {
        let inputsServicio = formularioServicio.querySelectorAll("input");
        let selectsServicio = formularioServicio.querySelectorAll("select");
        let botonLimpiarServicio = formularioServicio.querySelector(".btn-limpiar");

        formularioServicio.addEventListener("submit", function (event) {
            event.preventDefault();

            if (editandoServicioId !== null) {
                let servicio = buscarPorId(servicios, editandoServicioId);
                if (!servicio) { return; }
                servicio.estado = selectsServicio[1].value;
                registrarIncidente("Servicio actualizado", "Servicios", "Activo");
                editandoServicioId = null;
                resetearFormularioServicio(formularioServicio);
                mostrarServicios();
                return;
            }

            let descripcion = inputsServicio[0].value;
            let tipo = selectsServicio[0].value;
            let fechaSalida = inputsServicio[1].value;
            let estado = selectsServicio[1].value;

            if (descripcion === "" || fechaSalida === "") {
                if (descripcion === "") {
                    inputsServicio[0].style.borderColor = "red";
                } else {
                    inputsServicio[0].style.borderColor = "black";
                }
                if (fechaSalida === "") {
                    inputsServicio[1].style.borderColor = "red";
                } else {
                    inputsServicio[1].style.borderColor = "black";
                }
            } else {
                ultimoIdServicio++;
                let nuevoServicio = {
                    id: ultimoIdServicio,
                    descripcion: descripcion,
                    tipo: tipo,
                    fechaSalida: fechaSalida,
                    estado: estado
                };
                servicios.push(nuevoServicio);
                mostrarServicios();
                limpiarFormularioServicio(formularioServicio);
            }
        });

        if (botonLimpiarServicio) {
            botonLimpiarServicio.addEventListener("click", function () {
                editandoServicioId = null;
                resetearFormularioServicio(formularioServicio);
            });
        }
    }

    if (formularioEvento) {
        let textareaEvento = formularioEvento.querySelector("textarea");
        let inputsEvento = formularioEvento.querySelectorAll("input");
        let selectsEvento = formularioEvento.querySelectorAll("select");
        let botonLimpiarEvento = formularioEvento.querySelector(".btn-limpiar");

        formularioEvento.addEventListener("submit", function (event) {
            event.preventDefault();

            if (editandoEventoId !== null) {
                let evento = buscarPorId(eventos, editandoEventoId);
                if (!evento) { return; }
                evento.estado = selectsEvento[1].value;
                editandoEventoId = null;
                resetearFormularioEvento(formularioEvento);
                mostrarEventos();
                mostrarEventosInicio();
                actualizarInicio();
                return;
            }

            let descripcion = textareaEvento.value;
            let tipo = selectsEvento[0].value;
            let fecha = inputsEvento[0].value;
            let estado = selectsEvento[1].value;

            if (descripcion === "" || fecha === "") {
                if (descripcion === "") {
                    textareaEvento.style.borderColor = "red";
                } else {
                    textareaEvento.style.borderColor = "black";
                }
                if (fecha === "") {
                    inputsEvento[0].style.borderColor = "red";
                } else {
                    inputsEvento[0].style.borderColor = "black";
                }
            } else {
                ultimoIdEvento++;
                let nuevoEvento = {
                    id: ultimoIdEvento,
                    descripcion: descripcion,
                    tipo: tipo,
                    fecha: fecha,
                    estado: estado
                };
                eventos.push(nuevoEvento);
                mostrarEventos();
                mostrarEventosInicio();
                actualizarInicio();
                limpiarFormularioEvento(formularioEvento);
            }
        });

        if (botonLimpiarEvento) {
            botonLimpiarEvento.addEventListener("click", function () {
                editandoEventoId = null;
                resetearFormularioEvento(formularioEvento);
            });
        }
    }
}

function buscarPorId(lista, id) {
    for (let i = 0; i < lista.length; i++) {
        if (lista[i].id === id) {
            return lista[i];
        }
    }
    return null;
}

function obtenerIndicePorId(lista, id) {
    for (let i = 0; i < lista.length; i++) {
        if (lista[i].id === id) {
            return i;
        }
    }
    return -1;
}

function nombreResidencia(id) {
    let residencia = buscarPorId(residencias, Number(id));
    if (!residencia) {
        return "Sin asignar";
    }
    return "Residencia #" + residencia.id;
}

function normalizarEstadoFormulario(estado) {
    let e = estado.toUpperCase();
    if (e === "ACTIVO") {
        return "Activo";
    }
    return "Inactivo";
}

function claseEstado(estado) {
    let e = estado.toUpperCase();
    if (e === "ACTIVO") {
        return "estado-activo";
    }
    if (e === "PENDIENTE") {
        return "estado-pendiente";
    }
    return "estado-inactivo";
}

function hoyTexto() {
    let d = new Date();
    let y = d.getFullYear();
    let m = String(d.getMonth() + 1).padStart(2, "0");
    let day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
}

function mostrarError(formulario, texto) {
    let error = formulario.querySelector(".mensaje-error");
    let exito = formulario.querySelector(".mensaje-exito");

    if (exito) {
        exito.style.display = "none";
        exito.textContent = "";
    }

    if (error) {
        error.textContent = texto;
        error.style.display = "block";
    }
}

function mostrarExito(formulario, texto) {
    let error = formulario.querySelector(".mensaje-error");
    let exito = formulario.querySelector(".mensaje-exito");

    if (error) {
        error.style.display = "none";
        error.textContent = "";
    }

    if (exito) {
        exito.textContent = texto;
        exito.style.display = "block";
    }
}

function limpiarMensajes(formulario) {
    let error = formulario.querySelector(".mensaje-error");
    let exito = formulario.querySelector(".mensaje-exito");

    if (error) {
        error.style.display = "none";
        error.textContent = "";
    }

    if (exito) {
        exito.style.display = "none";
        exito.textContent = "";
    }
}

function actualizarNavegacion(idSeccion) {
    let links = document.querySelectorAll(".navbar .nav-link");

    for (let i = 0; i < links.length; i++) {
        let onclick = links[i].getAttribute("onclick");
        if (onclick && onclick.indexOf("'" + idSeccion + "'") !== -1) {
            links[i].classList.add("activo");
        } else {
            links[i].classList.remove("activo");
        }
    }
}

function cargarFacturaEnFormulario(id) {
    let factura = buscarPorId(facturas, id);
    if (!factura) { return; }

    let formulario = document.querySelector("#facturas form");
    if (!formulario) { return; }

    let inputs = formulario.querySelectorAll("input");
    let selects = formulario.querySelectorAll("select");
    let titulo = formulario.querySelector("h3");

    inputs[0].value = factura.fecha;
    inputs[1].value = factura.descripcion;
    selects[0].value = factura.residente;
    selects[1].value = factura.tipoPago;
    selects[2].value = factura.formaPago;
    selects[3].value = factura.estado;

    for (let i = 0; i < inputs.length; i++) {
        inputs[i].disabled = true;
    }
    selects[0].disabled = true;
    selects[1].disabled = true;
    selects[2].disabled = true;
    selects[3].disabled = false;

    if (titulo) { titulo.textContent = "Editar Estado de Factura"; titulo.classList.add("modo-edicion"); }
    editandoFacturaId = id;
}

function cargarServicioEnFormulario(id) {
    let servicio = buscarPorId(servicios, id);
    if (!servicio) { return; }

    let formulario = document.querySelector("#servicios form");
    if (!formulario) { return; }

    let inputs = formulario.querySelectorAll("input");
    let selects = formulario.querySelectorAll("select");
    let titulo = formulario.querySelector("h3");

    inputs[0].value = servicio.descripcion;
    selects[0].value = servicio.tipo;
    inputs[1].value = servicio.fechaSalida;
    selects[1].value = servicio.estado;

    inputs[0].disabled = true;
    selects[0].disabled = true;
    inputs[1].disabled = true;
    selects[1].disabled = false;

    if (titulo) { titulo.textContent = "Editar Estado de Servicio"; titulo.classList.add("modo-edicion"); }
    editandoServicioId = id;
}

function cargarEventoEnFormulario(id) {
    let evento = buscarPorId(eventos, id);
    if (!evento) { return; }

    let formulario = document.querySelector("#eventos form");
    if (!formulario) { return; }

    let textarea = formulario.querySelector("textarea");
    let inputs = formulario.querySelectorAll("input");
    let selects = formulario.querySelectorAll("select");
    let titulo = formulario.querySelector("h3");

    textarea.value = evento.descripcion;
    selects[0].value = evento.tipo;
    inputs[0].value = evento.fecha;
    selects[1].value = evento.estado;

    textarea.disabled = true;
    selects[0].disabled = true;
    inputs[0].disabled = true;
    selects[1].disabled = false;

    if (titulo) { titulo.textContent = "Editar Estado de Evento"; titulo.classList.add("modo-edicion"); }
    editandoEventoId = id;
}

function resetearFormularioFactura(formulario) {
    if (!formulario) { return; }

    let inputs = formulario.querySelectorAll("input");
    let selects = formulario.querySelectorAll("select");
    let titulo = formulario.querySelector("h3");

    for (let i = 0; i < inputs.length; i++) {
        inputs[i].disabled = false;
        inputs[i].value = "";
        inputs[i].style.borderColor = "black";
    }
    for (let i = 0; i < selects.length; i++) {
        selects[i].disabled = false;
        selects[i].selectedIndex = 0;
        selects[i].style.borderColor = "black";
    }

    if (titulo) { titulo.textContent = "Agregar Factura"; titulo.classList.remove("modo-edicion"); }
}

function resetearFormularioServicio(formulario) {
    if (!formulario) { return; }

    let inputs = formulario.querySelectorAll("input");
    let selects = formulario.querySelectorAll("select");
    let titulo = formulario.querySelector("h3");

    for (let i = 0; i < inputs.length; i++) {
        inputs[i].disabled = false;
        inputs[i].value = "";
        inputs[i].style.borderColor = "black";
    }
    for (let i = 0; i < selects.length; i++) {
        selects[i].disabled = false;
        selects[i].selectedIndex = 0;
        selects[i].style.borderColor = "black";
    }

    if (titulo) { titulo.textContent = "Agregar Servicio"; titulo.classList.remove("modo-edicion"); }
}

function resetearFormularioEvento(formulario) {
    if (!formulario) { return; }

    let textarea = formulario.querySelector("textarea");
    let inputs = formulario.querySelectorAll("input");
    let selects = formulario.querySelectorAll("select");
    let titulo = formulario.querySelector("h3");

    if (textarea) {
        textarea.disabled = false;
        textarea.value = "";
        textarea.style.borderColor = "black";
    }
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].disabled = false;
        inputs[i].value = "";
        inputs[i].style.borderColor = "black";
    }
    for (let i = 0; i < selects.length; i++) {
        selects[i].disabled = false;
        selects[i].selectedIndex = 0;
        selects[i].style.borderColor = "black";
    }

    if (titulo) { titulo.textContent = "Agregar Evento"; titulo.classList.remove("modo-edicion"); }
}

function limpiarFormularioFactura(formulario) {
    let inputs = formulario.querySelectorAll("input");
    let selects = formulario.querySelectorAll("select");

    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = "";
        inputs[i].style.borderColor = "black";
    }

    for (let i = 0; i < selects.length; i++) {
        selects[i].selectedIndex = 0;
        selects[i].style.borderColor = "black";
    }
}

function limpiarFormularioServicio(formulario) {
    let inputs = formulario.querySelectorAll("input");
    let selects = formulario.querySelectorAll("select");

    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = "";
        inputs[i].style.borderColor = "black";
    }

    for (let i = 0; i < selects.length; i++) {
        selects[i].selectedIndex = 0;
        selects[i].style.borderColor = "black";
    }
}

function limpiarFormularioEvento(formulario) {
    let textarea = formulario.querySelector("textarea");
    let inputs = formulario.querySelectorAll("input");
    let selects = formulario.querySelectorAll("select");

    if (textarea) {
        textarea.value = "";
        textarea.style.borderColor = "black";
    }

    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = "";
        inputs[i].style.borderColor = "black";
    }

    for (let i = 0; i < selects.length; i++) {
        selects[i].selectedIndex = 0;
        selects[i].style.borderColor = "black";
    }
}