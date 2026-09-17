// ========================================
// SUPABASE
// ========================================

const SUPABASE_URL = "https://cayofsfrffwwvdqxwsdf.supabase.co";
const SUPABASE_KEY = "sb_publishable_iewpGszY8yRCQqruVUpKEA_R5Bz3gKI";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase conectado correctamente");

// ========================================
// AUTENTICACIÓN
// ========================================

async function iniciarSesion() {

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const mensaje =
        document.getElementById("mensajeLogin");

    if (!email || !password) {

        mensaje.textContent =
            "Ingrese el correo y la contraseña.";

        return;
    }

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,
            password: password

        });

    if (error) {

        console.error(error);

        mensaje.textContent =
            "Correo o contraseña incorrectos.";

        return;
    }

    console.log(
        "Usuario autenticado:",
        data.user
    );

    mostrarAplicacion();

}


// ========================================
// REGISTRAR USUARIO
// ========================================

async function registrarse() {

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const mensaje =
        document.getElementById("mensajeLogin");

    if (!email || !password) {

        mensaje.textContent =
            "Ingrese el correo y la contraseña.";

        return;
    }

    const { data, error } =
        await supabaseClient.auth.signUp({

            email: email,
            password: password

        });

    if (error) {

        console.error(error);

        mensaje.textContent =
            error.message;

        return;
    }

    mensaje.textContent =
        "Cuenta creada correctamente.";

}


// ========================================
// CERRAR SESIÓN
// ========================================

async function cerrarSesion() {

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {

        console.error(error);

        return;
    }

    mostrarLogin();

}


// ========================================
// MOSTRAR APLICACIÓN
// ========================================

function mostrarAplicacion() {

    document.getElementById("login")
        .style.display = "none";

    document.getElementById("app")
        .style.display = "block";

}


// ========================================
// MOSTRAR LOGIN
// ========================================

function mostrarLogin() {

    document.getElementById("login")
        .style.display = "block";

    document.getElementById("app")
        .style.display = "none";

}


// ========================================
// COMPROBAR SESIÓN
// ========================================

async function comprobarSesion() {

    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error) {

        console.error(error);

        mostrarLogin();

        return;
    }

    if (data.session) {

        console.log(
            "Sesión encontrada"
        );

        mostrarAplicacion();

    } else {

        console.log(
            "No hay sesión"
        );

        mostrarLogin();

    }

}


// ========================================
// VIGILAR CAMBIOS DE SESIÓN
// ========================================

supabaseClient.auth.onAuthStateChange(

    (event, session) => {

        console.log(
            "Cambio de autenticación:",
            event
        );

        if (session) {

            mostrarAplicacion();

        } else {

            mostrarLogin();

        }

    }

);


// Comprobar sesión al cargar
comprobarSesion();

// ========================================
// CARGAR CLIENTES
// ========================================

let clientes =
    JSON.parse(localStorage.getItem("clientes")) || [];

// ========================================
// ASISTENTE DE COBROS
// ========================================

function convertirFechaAbono(fechaTexto) {

    if (typeof fechaTexto !== "string") {
        return null;
    }

    const partes = fechaTexto.split("/");

    if (partes.length !== 3) {
        return null;
    }

    const dia = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const anio = Number(partes[2]);
    const fecha = new Date(anio, mes, dia);

    if (
        Number.isNaN(fecha.getTime()) ||
        fecha.getDate() !== dia ||
        fecha.getMonth() !== mes ||
        fecha.getFullYear() !== anio
    ) {
        return null;
    }

    return fecha;
}

function obtenerFechaRegistro(cliente) {

    if (typeof cliente.fechaRegistro === "string" && cliente.fechaRegistro) {
        return cliente.fechaRegistro;
    }

    if (typeof cliente.id === "number") {
        const fechaRegistro = new Date(cliente.id);

        if (!Number.isNaN(fechaRegistro.getTime())) {
            return fechaRegistro.toLocaleDateString("es-CR");
        }
    }

    return "fecha no disponible";
}

function clienteTieneAbonoReciente(cliente, fechaInicio) {

    const abonos = cliente.abonos || [];

    return abonos.some(abono => {
        const fechaAbono = convertirFechaAbono(abono.fecha);

        return fechaAbono && fechaAbono >= fechaInicio;
    });
}

function responderAsistente(pregunta) {

    const texto = pregunta.toLowerCase();

    const clientesPendientes = clientes.filter(cliente => {
        return cliente.total - cliente.abonado > 0;
    });

    const saldoTotal = clientesPendientes.reduce((total, cliente) => {
        return total + cliente.total - cliente.abonado;
    }, 0);

    const consultaSinAbonosRecientes =
        texto.includes("sin abonos") ||
        texto.includes("no ha realizado abonos") ||
        texto.includes("no han realizado abonos") ||
        texto.includes("no ha abonado") ||
        texto.includes("no han abonado") ||
        texto.includes("últimos meses") ||
        texto.includes("ultimos meses");

    if (consultaSinAbonosRecientes) {
        const fechaActual = new Date();
        const fechaInicio = new Date(
            fechaActual.getFullYear(),
            fechaActual.getMonth() - 11,
            1
        );

        const clientesSinAbonos = clientes.filter(cliente => {
            return !clienteTieneAbonoReciente(cliente, fechaInicio);
        });

        if (clientesSinAbonos.length === 0) {
            return "Todos los clientes tienen al menos un abono en los últimos 12 meses, incluido el mes actual.";
        }

        const resumen = clientesSinAbonos.map(cliente => {
            const saldo = cliente.total - cliente.abonado;
            return `${cliente.nombre} (${formatoMoneda(saldo)} pendiente)`;
        });

        return "Clientes sin abonos en los últimos 12 meses, incluido el mes actual: " + resumen.join(", ") + ".";
    }

    if (texto.includes("cuánto") || texto.includes("cuanto") || texto.includes("total")) {
        return `Tienes ${clientesPendientes.length} cliente(s) pendiente(s) y faltan ${formatoMoneda(saldoTotal)} por cobrar.`;
    }

    if (texto.includes("quién") || texto.includes("quien") || texto.includes("pendiente")) {
        if (clientesPendientes.length === 0) {
            return "No tienes clientes con saldo pendiente.";
        }

        const resumen = clientesPendientes.map(cliente => {
            const saldo = cliente.total - cliente.abonado;
            return `${cliente.nombre}: ${formatoMoneda(saldo)}`;
        });

        return "Clientes pendientes: " + resumen.join(", ") + ".";
    }

    const clienteEncontrado = clientes.find(cliente => {
        return texto.includes(cliente.nombre.toLowerCase());
    });

    if (clienteEncontrado) {
        const consultaUltimoAbono =
            texto.includes("último abono") ||
            texto.includes("ultimo abono") ||
            texto.includes("última fecha") ||
            texto.includes("ultima fecha") ||
            texto.includes("último pago") ||
            texto.includes("ultimo pago");

        if (consultaUltimoAbono) {
            const abonos = clienteEncontrado.abonos || [];

            if (abonos.length === 0) {
                const saldo = clienteEncontrado.total - clienteEncontrado.abonado;
                return `${clienteEncontrado.nombre} tiene un saldo pendiente de ${formatoMoneda(saldo)}, todavía no tiene abonos registrados y el monto a cobrar fue registrado el ${obtenerFechaRegistro(clienteEncontrado)}.`;
            }

            const ultimoAbono = abonos[abonos.length - 1];
            return `El último abono de ${clienteEncontrado.nombre} fue el ${ultimoAbono.fecha}, por ${formatoMoneda(ultimoAbono.monto)}.`;
        }

        const saldo = clienteEncontrado.total - clienteEncontrado.abonado;
        const abonos = clienteEncontrado.abonos || [];

        if (abonos.length === 0) {
            return `${clienteEncontrado.nombre} tiene un saldo pendiente de ${formatoMoneda(saldo)}, todavía no registra abonos y el monto a cobrar fue registrado el ${obtenerFechaRegistro(clienteEncontrado)}.`;
        }

        const ultimoAbono = abonos[abonos.length - 1];
        return `${clienteEncontrado.nombre} tiene un saldo pendiente de ${formatoMoneda(saldo)}. Su último abono fue el ${ultimoAbono.fecha}, por ${formatoMoneda(ultimoAbono.monto)}.`;
    }

    return "Puedo ayudarte con el total pendiente, los clientes con deuda o el saldo de un cliente específico.";
}

function agregarMensajeAsistente(texto, clase) {

    const mensajes = document.getElementById("mensajesAsistente");
    const mensaje = document.createElement("p");

    mensaje.className = clase;
    mensaje.textContent = texto;
    mensajes.appendChild(mensaje);
    mensajes.scrollTop = mensajes.scrollHeight;
}

function limpiarConversacionAsistente() {

    const mensajes = document.getElementById("mensajesAsistente");

    mensajes.innerHTML = "";
    agregarMensajeAsistente(
        "Conversación limpiada. ¿En qué puedo ayudarte?",
        "mensaje-asistente"
    );
}

function alternarAsistente(abrir) {

    const panel = document.getElementById("panelAsistente");
    const boton = document.getElementById("botonAbrirAsistente");
    const debeAbrir = typeof abrir === "boolean"
        ? abrir
        : panel.classList.contains("asistente-oculto");

    panel.classList.toggle("asistente-oculto", !debeAbrir);
    boton.setAttribute("aria-expanded", String(debeAbrir));
}

function configurarAsistente() {

    const formulario = document.getElementById("formularioAsistente");

    formulario.addEventListener("submit", function (evento) {

        evento.preventDefault();

        const entrada = document.getElementById("preguntaAsistente");
        const pregunta = entrada.value.trim();

        if (!pregunta) {
            return;
        }

        agregarMensajeAsistente(pregunta, "mensaje-usuario");
        agregarMensajeAsistente(responderAsistente(pregunta), "mensaje-asistente");
        entrada.value = "";
    });
}

configurarAsistente();


// ========================================
// GUARDAR CLIENTE
// ========================================

function guardarCliente() {

    const nombre =
        document.getElementById("nombreCliente").value;

    const monto =
        parseFloat(
            document.getElementById("montoCuenta").value
        );

    if (
        !nombre.trim() ||
        isNaN(monto) ||
        monto <= 0
    ) {
        alert("Ingrese un nombre y un monto válido");
        return;
    }

    clientes.push({

        id: Date.now(),

        nombre: nombre.trim(),

        fechaRegistro: new Date().toLocaleDateString("es-CR"),

        total: monto,

        abonado: 0,

        estado: "pendiente",

        abonos: [],

        historial: []

    });

 guardarDatos();

document.getElementById("nombreCliente").value = "";
document.getElementById("montoCuenta").value = "";

alert(
    "Cliente registrado correctamente."
);

mostrarClientes([]);
}

// ========================================
// EDITAR NOMBRE DEL CLIENTE
// ========================================

function editarNombreCliente(id) {

    const cliente =
        clientes.find(
            c => c.id === id
        );

    if (!cliente) {
        alert("Cliente no encontrado");
        return;
    }

    const nuevoNombre =
        prompt(
            "Ingrese el nuevo nombre del cliente:",
            cliente.nombre
        );

    // Si presiona Cancelar
    if (nuevoNombre === null) {
        return;
    }

    // Verificar que no esté vacío
    if (!nuevoNombre.trim()) {
        alert("El nombre no puede estar vacío");
        return;
    }

    // Actualizar nombre
    cliente.nombre =
        nuevoNombre.trim();

    // Guardar cambios
    guardarDatos();

    // Mostrar cliente actualizado
    mostrarClientes([cliente]);
}


// ========================================
// GUARDAR DATOS
// ========================================

function guardarDatos() {

    localStorage.setItem(
        "clientes",
        JSON.stringify(clientes)
    );

}


// ========================================
// MOSTRAR CLIENTES
// ========================================

function mostrarClientes(lista) {

    const contenedor =
        document.getElementById("clientes");

    contenedor.innerHTML = "";

    lista.forEach(cliente => {

        if (!cliente.abonos) {
            cliente.abonos = [];
        }

        if (!cliente.historial) {
            cliente.historial = [];
        }

        // Determinar siempre el estado
        if (cliente.abonado >= cliente.total) {

            cliente.estado = "saldada";

        } else {

            cliente.estado = "pendiente";

        }

        const saldo =
            cliente.total - cliente.abonado;


        // ========================================
        // HISTORIAL DE ABONOS
        // ========================================

        let historialAbonos = "";

cliente.abonos.forEach(abono => {

    historialAbonos += `

        <div class="abono">

            <p>
                <strong>Fecha:</strong>
                ${abono.fecha}
            </p>

            <p>
                <strong>Monto:</strong>
                ${formatoMoneda(abono.monto)}
            </p>

            <button
                onclick="editarAbono(${cliente.id}, ${abono.id})"
            >
                Editar
            </button>

        </div>

    `;

});


        // ========================================
        // HISTORIAL DE CUENTAS ANTERIORES
        // ========================================

        let historialCuentas = "";

        if (
            cliente.historial &&
            cliente.historial.length > 0
        ) {

            historialCuentas += `

                <hr>

                <h4>
                    Historial de cuentas anteriores
                </h4>

            `;

            cliente.historial.forEach(
                (cuenta, index) => {

                    historialCuentas += `

                        <div class="historial-cuenta">

                            <p>
                                <strong>
                                    Cuenta anterior ${index + 1}
                                </strong>
                            </p>

                            <p>
                                Total:
                                ${formatoMoneda(cuenta.total)}
                            </p>

                            <p>
                                Abonado:
                                ${formatoMoneda(cuenta.abonado)}
                            </p>

                            <p>
                                Estado:
                                Saldada
                            </p>

                        </div>

                    `;

                }
            );

        }


        // ========================================
        // FORMULARIO DE ABONO
        // ========================================

        let formularioAbono = "";

        if (
            cliente.estado === "pendiente"
        ) {

            formularioAbono = `

                <hr>

                <h4>
                    Registrar Abono
                </h4>

                <input
                    type="number"
                    id="abono-${cliente.id}"
                    placeholder="Monto del abono"
                    min="0"
                >

                <button
                    onclick="abonar(${cliente.id})"
                >
                    Registrar Abono
                </button>

            `;

        } else {

            formularioAbono = `

                <hr>

                <p>
                    <strong>
                        ✓ CUENTA SALDADA
                    </strong>
                </p>

                <button
                    onclick="agregarNuevoMonto(${cliente.id})"
                >
                    Agregar nuevo monto
                </button>

            `;

        }


        // ========================================
        // MOSTRAR CLIENTE
        // ========================================

        contenedor.innerHTML += `

            <div class="cliente">

                <h3>
                    ${cliente.nombre}
                </h3>
                <button
                    onclick="editarNombreCliente(${cliente.id})">
                    Editar nombre
                </button>

                <p>
                    <strong>Total:</strong>
                    ${formatoMoneda(cliente.total)}
                </p>

                <p>
                    <strong>Abonado:</strong>
                    ${formatoMoneda(cliente.abonado)}
                </p>

                <p>
                    <strong>Saldo:</strong>
                    ${formatoMoneda(saldo)}
                </p>

                <p>
                    <strong>Estado:</strong>
                    ${
                        cliente.estado === "saldada"
                            ? "Saldada"
                            : "Pendiente"
                    }
                </p>

                ${formularioAbono}

                <hr>

                <h4>
                    Historial de Abonos
                </h4>

                ${
                    cliente.abonos.length > 0
                        ? historialAbonos
                        : "<p>No hay abonos registrados.</p>"
                }

                ${historialCuentas}

            </div>

        `;

    });

}


// ========================================
// REGISTRAR ABONO
// ========================================

function abonar(id) {

    const cliente =
        clientes.find(
            c => c.id === id
        );

    if (!cliente) {

        alert("Cliente no encontrado");

        return;
    }

    if (
        cliente.estado === "saldada"
    ) {

        alert("Esta cuenta ya está saldada");

        return;
    }

    const input =
        document.getElementById(
            `abono-${id}`
        );

    const monto =
        parseFloat(input.value);

    if (
        isNaN(monto) ||
        monto <= 0
    ) {

        alert("Ingrese un monto de abono válido");

        return;
    }

    const saldo =
        cliente.total -
        cliente.abonado;

    if (monto > saldo) {

        alert(
            "El abono no puede ser mayor que el saldo pendiente"
        );

        return;
    }

    cliente.abonos.push({

        id: Date.now(),

        monto: monto,

        fecha:
            new Date().toLocaleDateString("es-CR")

    });

    cliente.abonado += monto;

    if (
        cliente.abonado >=
        cliente.total
    ) {

        cliente.abonado =
            cliente.total;

        cliente.estado =
            "saldada";

    }

guardarDatos();

if (cliente.estado === "saldada") {

    alert(
        "Abono registrado correctamente.\n\n" +
        "Cliente: " + cliente.nombre + "\n" +
        "Abono: " + formatoMoneda(monto) + "\n\n" +
        "✓ CUENTA SALDADA"
    );

} else {

    alert(
        "Abono registrado correctamente.\n\n" +
        "Cliente: " + cliente.nombre + "\n" +
        "Abono: " + formatoMoneda(monto) + "\n" +
        "Saldo pendiente: " +
        formatoMoneda(
            cliente.total - cliente.abonado
        )
    );
}

mostrarClientes([cliente]);

}

// ========================================
// EDITAR ABONO
// ========================================

function editarAbono(idCliente, idAbono) {

    const cliente =
        clientes.find(
            c => c.id === idCliente
        );

    if (!cliente) {

        alert("Cliente no encontrado");

        return;
    }

    const abono =
        cliente.abonos.find(
            a => a.id === idAbono
        );

    if (!abono) {

        alert("Abono no encontrado");

        return;
    }

    const montoAnterior =
        abono.monto;

    const nuevoMonto =
        parseFloat(
            prompt(
                "Ingrese el nuevo monto del abono:",
                montoAnterior
            )
        );

    if (
        isNaN(nuevoMonto) ||
        nuevoMonto <= 0
    ) {

        alert("Ingrese un monto válido");

        return;
    }

    // Calcular el abonado sin el abono que vamos a editar

    const abonadoSinAbono =
        cliente.abonado -
        montoAnterior;

    // Verificar que el nuevo monto
    // no supere el saldo disponible

    if (
        abonadoSinAbono + nuevoMonto >
        cliente.total
    ) {

        alert(
            "El nuevo monto supera el total de la cuenta"
        );

        return;
    }

    // Actualizar el monto del abono

    abono.monto =
        nuevoMonto;

    // Recalcular el total abonado

    cliente.abonado =
        abonadoSinAbono +
        nuevoMonto;

    // Actualizar estado

    if (
        cliente.abonado >=
        cliente.total
    ) {

        cliente.abonado =
            cliente.total;

        cliente.estado =
            "saldada";

    } else {

        cliente.estado =
            "pendiente";

    }

    // Guardar cambios

    guardarDatos();

    // Mostrar cliente actualizado

    mostrarClientes([cliente]);

}


// ========================================
// AGREGAR NUEVO MONTO
// ========================================

function agregarNuevoMonto(id) {

    const cliente =
        clientes.find(
            c => c.id === id
        );

    if (!cliente) {

        alert("Cliente no encontrado");

        return;
    }

    if (
        cliente.estado !== "saldada"
    ) {

        alert("La cuenta todavía está pendiente");

        return;
    }

    const nuevoMonto =
        parseFloat(
            prompt(
                "Ingrese el nuevo monto de la cuenta:"
            )
        );

    if (
        isNaN(nuevoMonto) ||
        nuevoMonto <= 0
    ) {

        alert("Ingrese un monto válido");

        return;
    }


    // Guardar cuenta anterior

    cliente.historial.push({

        total: cliente.total,

        abonado: cliente.abonado,

        estado: cliente.estado,

        abonos: cliente.abonos

    });


    // Crear nueva cuenta

    cliente.total =
        nuevoMonto;

    cliente.fechaRegistro =
        new Date().toLocaleDateString("es-CR");

    cliente.abonado =
        0;

    cliente.estado =
        "pendiente";

    cliente.abonos =
        [];


    guardarDatos();

    mostrarClientes([cliente]);

}


// ========================================
// FORMATO DE MONEDA
// ========================================

function formatoMoneda(valor) {

    return valor.toLocaleString(
        "es-CR",
        {
            style: "currency",
            currency: "CRC"
        }
    );

}


// ========================================
// BUSCAR CLIENTE
// ========================================

function buscarCliente() {

    const texto =
        document
            .getElementById("buscarCliente")
            .value
            .trim()
            .toLowerCase();

    console.log("Buscando:", texto);

    if (texto === "") {

        mostrarClientes([]);

        return;
    }

    const resultados =
        clientes.filter(
            cliente =>
                cliente.nombre
                    .toLowerCase()
                    .includes(texto)
        );

    console.log("Resultados:", resultados);

    mostrarClientes(resultados);

}


// ========================================
// SERVICE WORKER
// ========================================

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register("./service-worker.js")

                .then(() => {

                    console.log(
                        "Service Worker registrado correctamente"
                    );

                })

                .catch(error => {

                    console.error(
                        "Error al registrar Service Worker:",
                        error
                    );

                });

        }
    );

}

// ========================================
// EXPORTAR CLIENTES A JSON
// ========================================

function exportarClientesJSON() {

    const datos = JSON.stringify(clientes, null, 2);

    const archivo = new Blob(
        [datos],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(archivo);

    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "clientes.json";

    enlace.click();

    URL.revokeObjectURL(url);
}


// ========================================
// EXPORTAR CLIENTES A EXCEL
// ========================================

function exportarClientesExcel() {

    if (clientes.length === 0) {
        alert("No hay clientes para exportar.");
        return;
    }

    // ========================================
    // HOJA CLIENTES
    // ========================================

    const datosClientes = clientes.map(cliente => ({
        "Cliente": cliente.nombre,
        "Total": cliente.total,
        "Abonado": cliente.abonado,
        "Saldo": cliente.total - cliente.abonado,
        "Estado": cliente.estado
    }));

    const hojaClientes =
        XLSX.utils.json_to_sheet(datosClientes);


    // ========================================
    // HOJA ABONOS
    // ========================================

    const datosAbonos = [];

    clientes.forEach(cliente => {

        if (!cliente.abonos) {
            return;
        }

        cliente.abonos.forEach(abono => {

            datosAbonos.push({
                "Cliente": cliente.nombre,
                "Fecha": abono.fecha,
                "Monto": abono.monto
            });

        });

    });

    const hojaAbonos =
        XLSX.utils.json_to_sheet(
            datosAbonos.length > 0
                ? datosAbonos
                : [{
                    "Cliente": "",
                    "Fecha": "",
                    "Monto": ""
                }]
        );


    // ========================================
    // HOJA HISTORIAL
    // ========================================

    const datosHistorial = [];

    clientes.forEach(cliente => {

        if (!cliente.historial) {
            return;
        }

        cliente.historial.forEach((cuenta, index) => {

            datosHistorial.push({
                "Cliente": cliente.nombre,
                "Cuenta anterior": index + 1,
                "Total": cuenta.total,
                "Abonado": cuenta.abonado,
                "Saldo": cuenta.total - cuenta.abonado,
                "Estado": cuenta.estado
            });

        });

    });

    const hojaHistorial =
        XLSX.utils.json_to_sheet(
            datosHistorial.length > 0
                ? datosHistorial
                : [{
                    "Cliente": "",
                    "Cuenta anterior": "",
                    "Total": "",
                    "Abonado": "",
                    "Saldo": "",
                    "Estado": ""
                }]
        );


    // ========================================
    // CREAR LIBRO DE EXCEL
    // ========================================

    const libro = XLSX.utils.book_new();


    // ========================================
    // AGREGAR HOJAS
    // ========================================

    XLSX.utils.book_append_sheet(
        libro,
        hojaClientes,
        "Clientes"
    );

    XLSX.utils.book_append_sheet(
        libro,
        hojaAbonos,
        "Abonos"
    );

    XLSX.utils.book_append_sheet(
        libro,
        hojaHistorial,
        "Historial"
    );


    // ========================================
    // CREAR ARCHIVO
    // ========================================

    XLSX.writeFile(
        libro,
        "clientes.xlsx"
    );

}


// ========================================
// IMPORTAR CLIENTES DESDE JSON
// ========================================

function importarClientesJSON() {

    const input = document.createElement("input");

    input.type = "file";
    input.accept = ".json,application/json";

    input.onchange = function () {

        const archivo = input.files[0];

        if (!archivo) {
            return;
        }

        const lector = new FileReader();

        lector.onload = function (evento) {

            try {

                // ========================================
                // LEER JSON
                // ========================================

                const datos =
                    JSON.parse(
                        evento.target.result
                    );

                // ========================================
                // VERIFICAR QUE SEA UN ARRAY
                // ========================================

                if (!Array.isArray(datos)) {

                    alert(
                        "El archivo no contiene un respaldo válido."
                    );

                    return;
                }

                // ========================================
                // VERIFICAR ESTRUCTURA DE LOS CLIENTES
                // ========================================

                const datosValidos =
                    datos.every(cliente =>

                        cliente &&
                        typeof cliente === "object" &&
                        typeof cliente.id !== "undefined" &&
                        typeof cliente.nombre === "string" &&
                        typeof cliente.total === "number" &&
                        typeof cliente.abonado === "number" &&
                        Array.isArray(cliente.abonos) &&
                        Array.isArray(cliente.historial)

                    );

                if (!datosValidos) {

                    alert(
                        "El archivo no tiene una estructura de respaldo válida."
                    );

                    return;
                }

                // ========================================
                // CONFIRMAR REEMPLAZO
                // ========================================


// ========================================
// CONFIRMAR REEMPLAZO
// ========================================

const cantidadActual =
    clientes.length;

const cantidadRespaldo =
    datos.length;

const confirmar =
    confirm(
        "⚠️ IMPORTAR RESPALDO\n\n" +

        "Archivo:\n" +
        archivo.name +
        "\n\n" +

        "Clientes actuales: " +
        cantidadActual +
        "\n" +

        "Clientes en el respaldo: " +
        cantidadRespaldo +
        "\n\n" +

        "⚠️ Los datos actuales serán reemplazados " +
        "por los datos del respaldo.\n\n" +

        "Esta acción no se puede deshacer desde la aplicación.\n\n" +

        "¿Desea continuar?"
    );

if (!confirmar) {
    return;
}


                // ========================================
                // IMPORTAR DATOS
                // ========================================

                clientes = datos;

                guardarDatos();

                mostrarClientes(clientes);

                alert(
                    "Respaldo importado correctamente."
                );

            } catch (error) {

                alert(
                    "No se pudo leer el archivo JSON."
                );

                console.error(error);
            }
        };

        lector.readAsText(archivo);
    };

    input.click();
}



function borrarLocalStorage() {
    localStorage.removeItem("clientes");
    clientes = [];
    mostrarClientes([]);
    alert("Datos eliminados correctamente");
}