// ========================================
// CARGAR CLIENTES
// ========================================

let clientes =
    JSON.parse(localStorage.getItem("clientes")) || [];


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