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

let eventos = [];

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

let editandoGuardiaId = null;
let editandoResidenciaId = null;
let editandoResidenteId = null;

function mostrarSeccion(id) {
    let secciones = document.querySelectorAll(".seccion");
    for (let i = 0; i < secciones.length; i++) {
        secciones[i].classList.remove("activa");
    }

    let seccion = document.getElementById(id);
    if (seccion) {
        seccion.classList.add("activa");
    }

    actualizarNavegacion(id);
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
    actualizarInicio();
    registrarIncidente("Panel inicializado", "Sistema", "Activo");
    actualizarNavegacion("inicio");
});

function enlazarEventos() {
    guardiasFormulario.addEventListener("submit", registrarGuardia);
    residenciasFormulario.addEventListener("submit", registrarResidencia);
    residentesFormulario.addEventListener("submit", registrarResidente);

    guardiasTabla.addEventListener("click", accionesGuardias);
    residenciasTabla.addEventListener("click", accionesResidencias);
    residentesTabla.addEventListener("click", accionesResidentes);

    enlazarBotonLimpiar(guardiasFormulario, "guardia");
    enlazarBotonLimpiar(residenciasFormulario, "residencia");
    enlazarBotonLimpiar(residentesFormulario, "residente");
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
    if (!(target instanceof HTMLElement)) {
        return;
    }

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
    if (!(target instanceof HTMLElement)) {
        return;
    }

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
    if (!(target instanceof HTMLElement)) {
        return;
    }

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
    guardiasTabla.innerHTML = "";

    if (guardias.length === 0) {
        guardiasTabla.innerHTML = "<tr><td colspan='6' class='celda-vacia'>Sin guardias registrados.</td></tr>";
        return;
    }

    for (let i = 0; i < guardias.length; i++) {
        let g = guardias[i];
        let fila = document.createElement("tr");

        fila.innerHTML = "<td>" + g.nombre + "</td>" +
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
    residenciasTabla.innerHTML = "";

    if (residencias.length === 0) {
        residenciasTabla.innerHTML = "<tr><td colspan='6' class='celda-vacia'>Sin residencias registradas.</td></tr>";
        poblarSelectResidencias();
        return;
    }

    for (let i = 0; i < residencias.length; i++) {
        let r = residencias[i];
        let fila = document.createElement("tr");

        fila.innerHTML = "<td>" + r.id + "</td>" +
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
    residentesTabla.innerHTML = "";

    if (residentes.length === 0) {
        residentesTabla.innerHTML = "<tr><td colspan='6' class='celda-vacia'>Sin residentes registrados.</td></tr>";
        return;
    }

    for (let i = 0; i < residentes.length; i++) {
        let r = residentes[i];
        let fila = document.createElement("tr");

        fila.innerHTML = "<td>" + r.nombre + "</td>" +
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
    let select = residentesFormulario.querySelectorAll("select")[0];
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

    eventos.unshift({
        descripcion: descripcion,
        tipo: tipo,
        fecha: fecha,
        estado: estado
    });

    if (eventos.length > 8) {
        eventos.pop();
    }
}

function actualizarInicio() {
    if (!tarjetasResumen || tarjetasResumen.length < 3) {
        return;
    }

    let guardiasActivos = 0;
    for (let i = 0; i < guardias.length; i++) {
        if (guardias[i].estado === "Activo") {
            guardiasActivos++;
        }
    }

    tarjetasResumen[0].textContent = String(guardiasActivos);
    tarjetasResumen[1].textContent = String(residentes.length);
    tarjetasResumen[2].textContent = String(residencias.length);

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
        fila.innerHTML = "<td>" + e.descripcion + "</td>" +
            "<td>" + e.tipo + "</td>" +
            "<td>" + e.fecha + "</td>" +
            "<td class='" + claseEstado(e.estado) + "'>" + e.estado + "</td>";
        tablaInicio.appendChild(fila);
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
