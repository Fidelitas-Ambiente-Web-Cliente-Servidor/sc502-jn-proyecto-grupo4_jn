let visitantes = [];
let vehiculos = [];

let residentes = [
    { nombre: "Ana", apellidoPaterno: "Fernandez", apellidoMaterno: "Gutierrez", telefono: "8321-0987", residenciaId: "101", estado: "Activo" },
    { nombre: "Roberto", apellidoPaterno: "Chavarria", apellidoMaterno: "Arias", telefono: "8210-9876", residenciaId: "102", estado: "Activo" },
    { nombre: "Maria", apellidoPaterno: "Salas", apellidoMaterno: "Badilla", telefono: "8109-8765", residenciaId: "129", estado: "Inactivo" }
];

let PATRON_PLACA = /^[A-Z0-9-]{5,10}$/;
let PATRON_FECHA_HORA = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})$/;

let tarjetasResumen;
let tablaInicio;
let visitantesFormulario;
let visitantesTabla;
let vehiculosFormulario;
let vehiculosTabla;
let residentesTabla;

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

    visitantesFormulario = document.querySelector("#visitantes form");
    visitantesTabla = document.querySelector("#visitantes .bloque-tabla tbody");

    vehiculosFormulario = document.querySelector("#vehiculos form");
    vehiculosTabla = document.querySelector("#vehiculos .bloque-tabla tbody");

    residentesTabla = document.querySelector("#residentes table tbody");

    poblarResidentes();
    poblarSelects();
    enlazarEventos();
    renderVisitantes();
    renderVehiculos();
    actualizarInicio();
    actualizarNavegacion("inicio");
});

function poblarResidentes() {
    if (!residentesTabla) {
        return;
    }

    residentesTabla.innerHTML = "";

    for (let i = 0; i < residentes.length; i++) {
        let fila = document.createElement("tr");
        fila.innerHTML = "<td>" + residentes[i].nombre + "</td>" +
            "<td>" + residentes[i].apellidoPaterno + "</td>" +
            "<td>" + residentes[i].apellidoMaterno + "</td>" +
            "<td>" + residentes[i].telefono + "</td>" +
            "<td>" + residentes[i].residenciaId + "</td>" +
            "<td class='" + claseEstado(residentes[i].estado) + "'>" + residentes[i].estado + "</td>";
        residentesTabla.appendChild(fila);
    }
}

function poblarSelects() {
    let selectResidenciaVisitante = visitantesFormulario.querySelectorAll("select")[0];
    let selectResidenteVehiculo = vehiculosFormulario.querySelectorAll("select")[0];

    let residenciasUnicas = [];
    for (let i = 0; i < residentes.length; i++) {
        let existeResidencia = false;
        for (let j = 0; j < residenciasUnicas.length; j++) {
            if (residenciasUnicas[j] === residentes[i].residenciaId) {
                existeResidencia = true;
            }
        }
        if (!existeResidencia) {
            residenciasUnicas.push(residentes[i].residenciaId);
        }
    }

    let opcionResidencia = selectResidenciaVisitante.options[0] ? selectResidenciaVisitante.options[0].outerHTML : "<option value=''>-- Seleccione --</option>";
    selectResidenciaVisitante.innerHTML = opcionResidencia;

    for (let i = 0; i < residenciasUnicas.length; i++) {
        let opcion = document.createElement("option");
        opcion.value = residenciasUnicas[i];
        opcion.textContent = residenciasUnicas[i];
        selectResidenciaVisitante.appendChild(opcion);
    }

    let opcionResidente = selectResidenteVehiculo.options[0] ? selectResidenteVehiculo.options[0].outerHTML : "<option value=''>-- Seleccione --</option>";
    selectResidenteVehiculo.innerHTML = opcionResidente;

    for (let i = 0; i < residentes.length; i++) {
        let opcion = document.createElement("option");
        opcion.value = String(i);
        opcion.textContent = nombreCompletoResidente(residentes[i]) + " - " + residentes[i].residenciaId;
        selectResidenteVehiculo.appendChild(opcion);
    }
}

function enlazarEventos() {
    visitantesFormulario.addEventListener("submit", registrarVisitante);
    vehiculosFormulario.addEventListener("submit", registrarVehiculo);

    enlazarBotonLimpiar(visitantesFormulario);
    enlazarBotonLimpiar(vehiculosFormulario);
}

function enlazarBotonLimpiar(formulario) {
    let boton = formulario.querySelector(".btn-limpiar");
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

    let form = visitantesFormulario;
    let inputs = form.querySelectorAll("input");
    let selects = form.querySelectorAll("select");

    let nombre = inputs[0].value.trim();
    let residencia = selects[0].value.trim();
    let rol = selects[1].value.trim();
    let ingresoTexto = inputs[1].value.trim();
    let salidaTexto = inputs[2].value.trim();
    let estadoRaw = selects[2].value.trim().toUpperCase();
    let estado = estadoRaw === "ADENTRO" ? "Adentro" : "Afuera";
    let placa = form.querySelector("#visitantePlacaVehiculo").value.trim().toUpperCase();

    limpiarMensajes(form);
    limpiarErrores(form);

    if (!nombre || !residencia || !rol || !ingresoTexto) {
        window.alert("Complete todos los campos.");
        return;
    }

    if (!fechaHoraValida(ingresoTexto)) {
        window.alert("Fecha de ingreso invalida. Use YYYY-MM-DD HH:MM.");
        marcarError(inputs[1]);
        return;
    }

    if (salidaTexto) {
        if (!fechaHoraValida(salidaTexto)) {
            window.alert("Fecha de salida invalida. Use YYYY-MM-DD HH:MM.");
            marcarError(inputs[2]);
            return;
        }

        if (new Date(salidaTexto.replace(" ", "T")) < new Date(ingresoTexto.replace(" ", "T"))) {
            window.alert("La fecha de salida no puede ser menor al ingreso.");
            marcarError(inputs[2]);
            return;
        }
    }

    if (estado === "Afuera" && !salidaTexto) {
        window.alert("Si el estado es Afuera, ingrese fecha de salida.");
        marcarError(inputs[2]);
        return;
    }

    if (placa && !PATRON_PLACA.test(placa)) {
        window.alert("Placa invalida. Ejemplo: ABC-123");
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

    let form = vehiculosFormulario;
    let inputs = form.querySelectorAll("input");
    let selects = form.querySelectorAll("select");

    let placa = inputs[0].value.trim().toUpperCase();
    let descripcion = inputs[1].value.trim();
    let indiceResidente = selects[0].value.trim();
    let estadoRaw = selects[1].value.trim().toUpperCase();
    let estado = estadoRaw === "ACTIVO" ? "Activo" : "Inactivo";

    limpiarMensajes(form);
    limpiarErrores(form);

    if (!placa || !descripcion || indiceResidente === "") {
        window.alert("Complete todos los campos.");
        return;
    }

    if (!PATRON_PLACA.test(placa)) {
        window.alert("Placa invalida. Ejemplo: ABC-123");
        marcarError(inputs[0]);
        return;
    }

    for (let i = 0; i < vehiculos.length; i++) {
        if (vehiculos[i].placa === placa) {
            window.alert("La placa ya existe.");
            marcarError(inputs[0]);
            return;
        }
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
    visitantesTabla.innerHTML = "";

    if (visitantes.length === 0) {
        visitantesTabla.innerHTML = "<tr><td colspan='7' class='celda-vacia'>Sin visitantes registrados.</td></tr>";
        return;
    }

    for (let i = 0; i < visitantes.length; i++) {
        let v = visitantes[i];
        let fila = document.createElement("tr");

        let html = "";
        html += "<td>" + v.nombre + " (" + v.rol + ")</td>";
        html += "<td>" + v.placaVehiculo + "</td>";
        html += "<td>" + v.residencia + "</td>";
        html += "<td>" + v.ingresoTexto + "</td>";
        html += "<td>" + v.salidaTexto + "</td>";
        html += "<td class='" + claseEstado(v.estado) + "'>" + v.estado + "</td>";
        html += "<td></td>";

        fila.innerHTML = html;

        let celdaAcciones = fila.lastElementChild;

        if (v.estado === "Adentro") {
            let btnSalida = document.createElement("button");
            btnSalida.type = "button";
            btnSalida.className = "btn-editar";
            btnSalida.textContent = "Registrar salida";
            btnSalida.addEventListener("click", function () {
                registrarSalidaVisitante(i);
            });
            celdaAcciones.appendChild(btnSalida);
        }

        let btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "btn-editar btn-accion-secundaria";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", function () {
            let confirmar = window.confirm("Desea eliminar este visitante?");
            if (!confirmar) {
                return;
            }

            if (v.placaVehiculo !== "--") {
                eliminarVehiculoVisitante(v.placaVehiculo);
            }
            visitantes.splice(i, 1);
            renderVisitantes();
            renderVehiculos();
            actualizarInicio();
        });
        celdaAcciones.appendChild(btnEliminar);

        visitantesTabla.appendChild(fila);
    }
}

function renderVehiculos() {
    vehiculosTabla.innerHTML = "";

    if (vehiculos.length === 0) {
        vehiculosTabla.innerHTML = "<tr><td colspan='5' class='celda-vacia'>Sin vehiculos registrados.</td></tr>";
        return;
    }

    for (let i = 0; i < vehiculos.length; i++) {
        let v = vehiculos[i];
        let fila = document.createElement("tr");
        fila.innerHTML = "<td>" + v.placa + "</td>" +
            "<td>" + v.descripcion + "</td>" +
            "<td>" + v.propietarioNombre + "</td>" +
            "<td class='" + claseEstado(v.estado) + "'>" + v.estado + "</td>" +
            "<td></td>";

        let btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "btn-editar";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", function () {
            let confirmar = window.confirm("Desea eliminar este vehiculo?");
            if (!confirmar) {
                return;
            }

            let placa = v.placa;
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
        vehiculosTabla.appendChild(fila);
    }
}

function registrarSalidaVisitante(indice) {
    let visitante = visitantes[indice];
    if (!visitante || visitante.estado !== "Adentro") {
        return;
    }

    let salidaSugerida = ahoraTexto();
    let salidaIngresada = window.prompt("Ingrese fecha y hora de salida (YYYY-MM-DD HH:MM):", salidaSugerida);

    if (salidaIngresada === null) {
        return;
    }

    let salidaTexto = salidaIngresada.trim();
    if (!fechaHoraValida(salidaTexto)) {
        window.alert("Fecha de salida invalida. Use YYYY-MM-DD HH:MM.");
        return;
    }

    if (new Date(salidaTexto.replace(" ", "T")) < new Date(visitante.ingresoTexto.replace(" ", "T"))) {
        window.alert("La fecha de salida no puede ser menor al ingreso.");
        return;
    }

    visitante.salidaTexto = salidaTexto;
    visitante.estado = "Afuera";

    if (visitante.placaVehiculo !== "--") {
        for (let i = 0; i < vehiculos.length; i++) {
            if (vehiculos[i].placa === visitante.placaVehiculo && vehiculos[i].esVehiculoVisitante) {
                vehiculos[i].estado = "Inactivo";
            }
        }
    }

    renderVisitantes();
    renderVehiculos();
    actualizarInicio();
}

function registrarOActualizarVehiculoVisitante(nombre, placa, estadoVisitante) {
    let estadoVehiculo = estadoVisitante === "Adentro" ? "Activo" : "Inactivo";

    for (let i = 0; i < vehiculos.length; i++) {
        if (vehiculos[i].placa === placa) {
            vehiculos[i].descripcion = "Vehiculo de visita";
            vehiculos[i].propietarioNombre = nombre;
            vehiculos[i].estado = estadoVehiculo;
            vehiculos[i].esVehiculoVisitante = true;
            return;
        }
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
    let indice = -1;
    for (let i = 0; i < vehiculos.length; i++) {
        if (vehiculos[i].placa === placa && vehiculos[i].esVehiculoVisitante) {
            indice = i;
        }
    }

    if (indice >= 0) {
        vehiculos.splice(indice, 1);
    }
}

function actualizarInicio() {
    if (!tarjetasResumen || tarjetasResumen.length < 4) {
        return;
    }

    let hoy = hoyTexto();
    let visitantesHoy = 0;
    for (let i = 0; i < visitantes.length; i++) {
        if (visitantes[i].ingresoTexto.substring(0, 10) === hoy) {
            visitantesHoy++;
        }
    }

    let vehiculosActivos = 0;
    for (let i = 0; i < vehiculos.length; i++) {
        if (vehiculos[i].estado === "Activo") {
            vehiculosActivos++;
        }
    }

    tarjetasResumen[0].textContent = String(visitantesHoy);
    tarjetasResumen[1].textContent = "0";
    tarjetasResumen[2].textContent = "0";
    tarjetasResumen[3].textContent = String(vehiculosActivos);

    if (!tablaInicio) {
        return;
    }

    tablaInicio.innerHTML = "";

    let ultimos = [];
    for (let i = visitantes.length - 1; i >= 0; i--) {
        ultimos.push(visitantes[i]);
        if (ultimos.length === 5) {
            break;
        }
    }
    if (ultimos.length === 0) {
        tablaInicio.innerHTML = "<tr><td colspan='4' class='celda-vacia'>No hay visitas registradas hoy.</td></tr>";
        return;
    }

    for (let i = 0; i < ultimos.length; i++) {
        let v = ultimos[i];
        let fila = document.createElement("tr");
        fila.innerHTML = "<td>" + v.nombre + "</td>" +
            "<td>" + v.residencia + "</td>" +
            "<td>" + v.ingresoTexto + "</td>" +
            "<td class='" + claseEstado(v.estado) + "'>" + v.estado + "</td>";
        tablaInicio.appendChild(fila);
    }
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

function limpiarErrores(formulario) {
    let campos = formulario.querySelectorAll("input, select, textarea");
    for (let i = 0; i < campos.length; i++) {
        campos[i].style.borderColor = "";
    }
}

function marcarError(campo) {
    if (campo) {
        campo.style.borderColor = "#c21c1c";
    }
}

function fechaHoraValida(texto) {
    let m = texto.match(PATRON_FECHA_HORA);
    if (!m) {
        return false;
    }

    let fecha = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
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
    let e = estado.toUpperCase();
    if (e === "ACTIVO" || e === "ADENTRO" || e === "ENTREGADO") {
        return "estado-activo";
    }
    if (e === "PENDIENTE" || e === "RESERVADO") {
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

function ahoraTexto() {
    let d = new Date();
    let y = d.getFullYear();
    let m = String(d.getMonth() + 1).padStart(2, "0");
    let day = String(d.getDate()).padStart(2, "0");
    let h = String(d.getHours()).padStart(2, "0");
    let min = String(d.getMinutes()).padStart(2, "0");
    return y + "-" + m + "-" + day + " " + h + ":" + min;
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