const visitantes = [];
const vehiculos = [];

const residentes = [
    { nombre: "Ana", apellidoPaterno: "Fernandez", apellidoMaterno: "Gutierrez", telefono: "8321-0987", residenciaId: "101", estado: "ACTIVO" },
    { nombre: "Roberto", apellidoPaterno: "Chavarria", apellidoMaterno: "Arias", telefono: "8210-9876", residenciaId: "102", estado: "ACTIVO" },
    { nombre: "Maria", apellidoPaterno: "Salas", apellidoMaterno: "Badilla", telefono: "8109-8765", residenciaId: "129", estado: "INACTIVO" }
];

const ui = {};
const PATRON_PLACA = /^[A-Z0-9-]{5,10}$/;
const PATRON_FECHA_HORA = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})$/;

function mostrarSeccion(id) {
    const secciones = document.querySelectorAll(".seccion");
    for (let i = 0; i < secciones.length; i++) {
        secciones[i].classList.remove("activa");
    }

    const seccion = document.getElementById(id);
    if (seccion) {
        seccion.classList.add("activa");
    }

    actualizarNavegacion(id);
}

document.addEventListener("DOMContentLoaded", function () {
    inicializarUI();
    poblarResidentes();
    poblarSelects();
    enlazarEventos();
    renderVisitantes();
    renderVehiculos();
    actualizarInicio();
    actualizarNavegacion("inicio");
});

function inicializarUI() {
    ui.tarjetasResumen = document.querySelectorAll("#inicio .tarjeta-resumen h3");
    ui.tablaInicio = document.querySelector("#inicio table tbody");

    ui.visitantesFormulario = document.querySelector("#visitantes form");
    ui.visitantesTabla = document.querySelector("#visitantes .bloque-tabla tbody");

    ui.vehiculosFormulario = document.querySelector("#vehiculos form");
    ui.vehiculosTabla = document.querySelector("#vehiculos .bloque-tabla tbody");

    ui.residentesTabla = document.querySelector("#residentes table tbody");
}

function poblarResidentes() {
    if (!ui.residentesTabla) {
        return;
    }

    ui.residentesTabla.innerHTML = "";

    for (let i = 0; i < residentes.length; i++) {
        const fila = document.createElement("tr");
        fila.innerHTML = "<td>" + residentes[i].nombre + "</td>" +
            "<td>" + residentes[i].apellidoPaterno + "</td>" +
            "<td>" + residentes[i].apellidoMaterno + "</td>" +
            "<td>" + residentes[i].telefono + "</td>" +
            "<td>" + residentes[i].residenciaId + "</td>" +
            "<td class='" + claseEstado(residentes[i].estado) + "'>" + residentes[i].estado + "</td>";
        ui.residentesTabla.appendChild(fila);
    }
}

function poblarSelects() {
    const selectResidenciaVisitante = ui.visitantesFormulario.querySelectorAll("select")[0];
    const selectResidenteVehiculo = ui.vehiculosFormulario.querySelectorAll("select")[0];

    const residenciasUnicas = [];
    for (let i = 0; i < residentes.length; i++) {
        if (!residenciasUnicas.includes(residentes[i].residenciaId)) {
            residenciasUnicas.push(residentes[i].residenciaId);
        }
    }

    const opcionResidencia = selectResidenciaVisitante.options[0] ? selectResidenciaVisitante.options[0].outerHTML : "<option value=''>-- Seleccione --</option>";
    selectResidenciaVisitante.innerHTML = opcionResidencia;

    for (let i = 0; i < residenciasUnicas.length; i++) {
        const opcion = document.createElement("option");
        opcion.value = residenciasUnicas[i];
        opcion.textContent = residenciasUnicas[i];
        selectResidenciaVisitante.appendChild(opcion);
    }

    const opcionResidente = selectResidenteVehiculo.options[0] ? selectResidenteVehiculo.options[0].outerHTML : "<option value=''>-- Seleccione --</option>";
    selectResidenteVehiculo.innerHTML = opcionResidente;

    for (let i = 0; i < residentes.length; i++) {
        const opcion = document.createElement("option");
        opcion.value = String(i);
        opcion.textContent = nombreCompletoResidente(residentes[i]) + " - " + residentes[i].residenciaId;
        selectResidenteVehiculo.appendChild(opcion);
    }
}

function enlazarEventos() {
    ui.visitantesFormulario.addEventListener("submit", registrarVisitante);
    ui.vehiculosFormulario.addEventListener("submit", registrarVehiculo);

    enlazarBotonLimpiar(ui.visitantesFormulario);
    enlazarBotonLimpiar(ui.vehiculosFormulario);
}

function enlazarBotonLimpiar(formulario) {
    const boton = formulario.querySelector(".btn-limpiar");
    if (!boton) {
        return;
    }

    boton.addEventListener("click", function () {
        formulario.reset();
        limpiarMensajes(formulario);
        limpiarErrores(formulario);
    });
}

function registrarVisitante(event) {
    event.preventDefault();

    const form = ui.visitantesFormulario;
    const inputs = form.querySelectorAll("input");
    const selects = form.querySelectorAll("select");

    const nombre = inputs[0].value.trim();
    const residencia = selects[0].value.trim();
    const rol = selects[1].value.trim();
    const ingresoTexto = inputs[1].value.trim();
    const salidaTexto = inputs[2].value.trim();
    const estado = selects[2].value.trim().toUpperCase();
    const placa = form.querySelector("#visitantePlacaVehiculo").value.trim().toUpperCase();

    limpiarMensajes(form);
    limpiarErrores(form);

    if (!nombre || !residencia || !rol || !ingresoTexto) {
        mostrarError(form, "Complete los campos obligatorios.");
        return;
    }

    if (!fechaHoraValida(ingresoTexto)) {
        mostrarError(form, "Fecha de ingreso invalida. Use YYYY-MM-DD HH:MM.");
        marcarError(inputs[1]);
        return;
    }

    if (salidaTexto) {
        if (!fechaHoraValida(salidaTexto)) {
            mostrarError(form, "Fecha de salida invalida. Use YYYY-MM-DD HH:MM.");
            marcarError(inputs[2]);
            return;
        }

        if (new Date(salidaTexto.replace(" ", "T")) < new Date(ingresoTexto.replace(" ", "T"))) {
            mostrarError(form, "La salida no puede ser menor al ingreso.");
            marcarError(inputs[2]);
            return;
        }
    }

    if (estado === "AFUERA" && !salidaTexto) {
        mostrarError(form, "Si el estado es AFUERA, ingrese fecha de salida.");
        marcarError(inputs[2]);
        return;
    }

    if (placa && !PATRON_PLACA.test(placa)) {
        mostrarError(form, "Placa invalida. Ejemplo: ABC-123");
        marcarError(form.querySelector("#visitantePlacaVehiculo"));
        return;
    }

    visitantes.push({
        nombre,
        rol,
        residencia,
        ingresoTexto,
        salidaTexto: salidaTexto || "--",
        estado,
        placaVehiculo: placa || "--"
    });

    if (placa) {
        registrarOActualizarVehiculoVisitante(nombre, placa, estado);
    }

    form.reset();
    mostrarExito(form, "Visitante registrado.");
    renderVisitantes();
    renderVehiculos();
    actualizarInicio();
}

function registrarVehiculo(event) {
    event.preventDefault();

    const form = ui.vehiculosFormulario;
    const inputs = form.querySelectorAll("input");
    const selects = form.querySelectorAll("select");

    const placa = inputs[0].value.trim().toUpperCase();
    const descripcion = inputs[1].value.trim();
    const indiceResidente = selects[0].value.trim();
    const estado = selects[1].value.trim().toUpperCase();

    limpiarMensajes(form);
    limpiarErrores(form);

    if (!placa || !descripcion || indiceResidente === "") {
        mostrarError(form, "Complete los campos obligatorios.");
        return;
    }

    if (!PATRON_PLACA.test(placa)) {
        mostrarError(form, "Placa invalida. Ejemplo: AAA-111");
        marcarError(inputs[0]);
        return;
    }

    if (vehiculos.some(function (v) { return v.placa === placa; })) {
        mostrarError(form, "La placa ya existe.");
        marcarError(inputs[0]);
        return;
    }

    vehiculos.push({
        placa,
        descripcion,
        propietarioNombre: nombreCompletoResidente(residentes[Number(indiceResidente)]),
        estado,
        esVehiculoVisitante: false
    });

    form.reset();
    mostrarExito(form, "Vehiculo registrado.");
    renderVehiculos();
    actualizarInicio();
}

function renderVisitantes() {
    ui.visitantesTabla.innerHTML = "";

    if (visitantes.length === 0) {
        ui.visitantesTabla.innerHTML = "<tr><td colspan='7' class='celda-vacia'>Sin visitantes registrados.</td></tr>";
        return;
    }

    for (let i = 0; i < visitantes.length; i++) {
        const v = visitantes[i];
        const fila = document.createElement("tr");

        let html = "";
        html += "<td>" + v.nombre + " (" + v.rol + ")</td>";
        html += "<td>" + v.placaVehiculo + "</td>";
        html += "<td>" + v.residencia + "</td>";
        html += "<td>" + v.ingresoTexto + "</td>";
        html += "<td>" + v.salidaTexto + "</td>";
        html += "<td class='" + claseEstado(v.estado) + "'>" + v.estado + "</td>";
        html += "<td></td>";

        fila.innerHTML = html;

        const celdaAcciones = fila.lastElementChild;

        if (v.estado === "ADENTRO") {
            const btnSalida = document.createElement("button");
            btnSalida.type = "button";
            btnSalida.className = "btn-editar";
            btnSalida.textContent = "Registrar salida";
            btnSalida.addEventListener("click", function () {
                registrarSalidaVisitante(i);
            });
            celdaAcciones.appendChild(btnSalida);
        }

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "btn-editar btn-accion-secundaria";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", function () {
            if (v.placaVehiculo !== "--") {
                eliminarVehiculoVisitante(v.placaVehiculo);
            }
            visitantes.splice(i, 1);
            renderVisitantes();
            renderVehiculos();
            actualizarInicio();
        });
        celdaAcciones.appendChild(btnEliminar);

        ui.visitantesTabla.appendChild(fila);
    }
}

function renderVehiculos() {
    ui.vehiculosTabla.innerHTML = "";

    if (vehiculos.length === 0) {
        ui.vehiculosTabla.innerHTML = "<tr><td colspan='5' class='celda-vacia'>Sin vehiculos registrados.</td></tr>";
        return;
    }

    for (let i = 0; i < vehiculos.length; i++) {
        const v = vehiculos[i];
        const fila = document.createElement("tr");
        fila.innerHTML = "<td>" + v.placa + "</td>" +
            "<td>" + v.descripcion + "</td>" +
            "<td>" + v.propietarioNombre + "</td>" +
            "<td class='" + claseEstado(v.estado) + "'>" + v.estado + "</td>" +
            "<td></td>";

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "btn-editar";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", function () {
            const placa = v.placa;
            vehiculos.splice(i, 1);

            for (let j = 0; j < visitantes.length; j++) {
                if (visitantes[j].placaVehiculo === placa) {
                    visitantes[j].placaVehiculo = "--";
                }
            }

            renderVehiculos();
            renderVisitantes();
            actualizarInicio();
        });

        fila.lastElementChild.appendChild(btnEliminar);
        ui.vehiculosTabla.appendChild(fila);
    }
}

function registrarSalidaVisitante(indice) {
    const visitante = visitantes[indice];
    if (!visitante || visitante.estado !== "ADENTRO") {
        return;
    }

    const salidaSugerida = ahoraTexto();
    const salidaIngresada = window.prompt("Ingrese fecha y hora de salida (YYYY-MM-DD HH:MM):", salidaSugerida);

    if (salidaIngresada === null) {
        return;
    }

    const salidaTexto = salidaIngresada.trim();
    if (!fechaHoraValida(salidaTexto)) {
        window.alert("Fecha de salida invalida. Use YYYY-MM-DD HH:MM.");
        return;
    }

    if (new Date(salidaTexto.replace(" ", "T")) < new Date(visitante.ingresoTexto.replace(" ", "T"))) {
        window.alert("La fecha de salida no puede ser menor al ingreso.");
        return;
    }

    visitante.salidaTexto = salidaTexto;
    visitante.estado = "AFUERA";

    if (visitante.placaVehiculo !== "--") {
        const vehiculo = vehiculos.find(function (v) {
            return v.placa === visitante.placaVehiculo && v.esVehiculoVisitante;
        });
        if (vehiculo) {
            vehiculo.estado = "INACTIVO";
        }
    }

    renderVisitantes();
    renderVehiculos();
    actualizarInicio();
}

function registrarOActualizarVehiculoVisitante(nombre, placa, estadoVisitante) {
    const estadoVehiculo = estadoVisitante === "ADENTRO" ? "ACTIVO" : "INACTIVO";

    const existente = vehiculos.find(function (v) {
        return v.placa === placa;
    });

    if (existente) {
        existente.descripcion = "Vehiculo de visita";
        existente.propietarioNombre = nombre;
        existente.estado = estadoVehiculo;
        existente.esVehiculoVisitante = true;
        return;
    }

    vehiculos.push({
        placa,
        descripcion: "Vehiculo de visita",
        propietarioNombre: nombre,
        estado: estadoVehiculo,
        esVehiculoVisitante: true
    });
}

function eliminarVehiculoVisitante(placa) {
    const indice = vehiculos.findIndex(function (v) {
        return v.placa === placa && v.esVehiculoVisitante;
    });

    if (indice >= 0) {
        vehiculos.splice(indice, 1);
    }
}

function actualizarInicio() {
    if (!ui.tarjetasResumen || ui.tarjetasResumen.length < 4) {
        return;
    }

    const hoy = hoyTexto();
    const visitantesHoy = visitantes.filter(function (v) {
        return v.ingresoTexto.startsWith(hoy);
    }).length;

    const vehiculosActivos = vehiculos.filter(function (v) {
        return v.estado === "ACTIVO";
    }).length;

    ui.tarjetasResumen[0].textContent = String(visitantesHoy);
    ui.tarjetasResumen[1].textContent = "0";
    ui.tarjetasResumen[2].textContent = "0";
    ui.tarjetasResumen[3].textContent = String(vehiculosActivos);

    if (!ui.tablaInicio) {
        return;
    }

    ui.tablaInicio.innerHTML = "";

    const ultimos = visitantes.slice(-5).reverse();
    if (ultimos.length === 0) {
        ui.tablaInicio.innerHTML = "<tr><td colspan='4' class='celda-vacia'>No hay visitas registradas hoy.</td></tr>";
        return;
    }

    for (let i = 0; i < ultimos.length; i++) {
        const v = ultimos[i];
        const fila = document.createElement("tr");
        fila.innerHTML = "<td>" + v.nombre + "</td>" +
            "<td>" + v.residencia + "</td>" +
            "<td>" + v.ingresoTexto + "</td>" +
            "<td class='" + claseEstado(v.estado) + "'>" + v.estado + "</td>";
        ui.tablaInicio.appendChild(fila);
    }
}

function mostrarError(formulario, texto) {
    const error = formulario.querySelector(".mensaje-error");
    const exito = formulario.querySelector(".mensaje-exito");

    if (exito) {
        exito.classList.remove("mensaje-visible");
        exito.textContent = "";
    }

    if (error) {
        error.textContent = texto;
        error.classList.add("mensaje-visible");
    }
}

function mostrarExito(formulario, texto) {
    const error = formulario.querySelector(".mensaje-error");
    const exito = formulario.querySelector(".mensaje-exito");

    if (error) {
        error.classList.remove("mensaje-visible");
        error.textContent = "";
    }

    if (exito) {
        exito.textContent = texto;
        exito.classList.add("mensaje-visible");
    }
}

function limpiarMensajes(formulario) {
    const error = formulario.querySelector(".mensaje-error");
    const exito = formulario.querySelector(".mensaje-exito");

    if (error) {
        error.classList.remove("mensaje-visible");
        error.textContent = "";
    }

    if (exito) {
        exito.classList.remove("mensaje-visible");
        exito.textContent = "";
    }
}

function limpiarErrores(formulario) {
    const campos = formulario.querySelectorAll("input, select, textarea");
    for (let i = 0; i < campos.length; i++) {
        campos[i].classList.remove("campo-error");
    }
}

function marcarError(campo) {
    if (campo) {
        campo.classList.add("campo-error");
    }
}

function fechaHoraValida(texto) {
    const m = texto.match(PATRON_FECHA_HORA);
    if (!m) {
        return false;
    }

    const fecha = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
    return fecha.getFullYear() === Number(m[1]) &&
        fecha.getMonth() === Number(m[2]) - 1 &&
        fecha.getDate() === Number(m[3]) &&
        fecha.getHours() === Number(m[4]) &&
        fecha.getMinutes() === Number(m[5]);
}

function nombreCompletoResidente(r) {
    return r.nombre + " " + r.apellidoPaterno + " " + r.apellidoMaterno;
}

function claseEstado(estado) {
    const e = estado.toUpperCase();
    if (e === "ACTIVO" || e === "ADENTRO" || e === "ENTREGADO") {
        return "estado-activo";
    }
    if (e === "PENDIENTE" || e === "RESERVADO") {
        return "estado-pendiente";
    }
    return "estado-inactivo";
}

function hoyTexto() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
}

function ahoraTexto() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return y + "-" + m + "-" + day + " " + h + ":" + min;
}

function actualizarNavegacion(idSeccion) {
    const links = document.querySelectorAll(".navbar .nav-link");
    for (let i = 0; i < links.length; i++) {
        const onclick = links[i].getAttribute("onclick");
        if (onclick && onclick.indexOf("'" + idSeccion + "'") !== -1) {
            links[i].classList.add("activo");
        } else {
            links[i].classList.remove("activo");
        }
    }
}