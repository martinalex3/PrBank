/* * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
// ARRAY FECHAS CORRECTAS
const isoRegex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2})/;
// PATH PARAM DEL SERVIDOR
const SERVICE_URL = "/CRUDBankServerSide/webresources/movement/account/";
// PATH PARAM del DELETE de MOVIMIENTOS.
const SERVICE_DEL_URL = "/CRUDBankServerSide/webresources/movement/";
// NUEVA URL PARA ACTUALIZAR LA CUENTA (AÑADIDO)
const ACCOUNT_URL = "/CRUDBankServerSide/webresources/account/";
// ARRAY GLOBAL MOVEMENTS
let movements = [];
// LINEA DOM
document.addEventListener("DOMContentLoaded", () => {
    // Actualizar saldo de la cuenta
    updateAccountInfo();
    // Mostrar el ID de la cuenta
    const accountId = sessionStorage.getItem("account.id") || "Unknown";
    document.getElementById("accountIdText").textContent = accountId;
    // CONSTRUIR TABLA
    buildMovementsTable();
    // ABRIR FORMULARIO
    document.getElementById("btnOpen").addEventListener("click", () => {
        document.getElementById("formLayer").style.display = "flex";
    });
    // CERRAR FORMULARIO
    document.getElementById("btnClose").addEventListener("click", () => {
        document.getElementById("formLayer").style.display = "none";
    });
    // ENVIAR FORMULARIO
    document.getElementById("formAccount").addEventListener("submit", createMovement);
    // BOTON UNDO: CON MENSAJE DE CONFIRMACION
    document.getElementById("btnUndo").addEventListener("click", () => {
        if (movements.length > 0) {
            document.getElementById("confirmLayer").style.display = "flex";
        } else {
            alert("No hay movimientos para borrar");
        }
    });
    // BOTON SI, BORRAR (Dentro del confirmLayer)
    document.getElementById("btnConfirmYes").addEventListener("click", () => {
        deleteMovement(); // Llamamos a la función de borrar
        document.getElementById("confirmLayer").style.display = "none"; // CERRAMOS REALIZANDO BORRADO
    });
    // BOTON NO, CANCELAR (Dentro del confirmLayer)
    document.getElementById("btnConfirmNo").addEventListener("click", () => {
        document.getElementById("confirmLayer").style.display = "none"; // CERRAMOS SIN REALIZAR BORRADO
    });
});
// LEER TABLAS EN EL SERVIDOR (cRud)
// FETCH MOVEMENTS IN JSON FORMAT
async function fetchMovements() {
    const response = await fetch(SERVICE_URL + `${sessionStorage.getItem("account.id")}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    return await response.json();
}
// GENERACION DE TABLAS CON FECHAS FORMATEADAS
function* userRowGenerator(movements) {
    for (const movement of movements) {
        const tr = document.createElement("tr");
        ["timestamp", "description", "amount", "balance"].forEach(field => {
            const td = document.createElement("td");
            let value = movement[field];
            // FORMATEO DE FECHA MDN (CON MINUTOS Y HORAS)
            if (field === "timestamp" && value) {
                const date = new Date(value); // Convertimos la cadena ISO a Date
                value = new Intl.DateTimeFormat("es-ES", { 
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                }).format(date); // DD/MM/YYYY HH:MM
            }
            // FORMATEO MDN EN EUROS
            else if (field === "amount" || field === "balance") {
                const number = parseFloat(value);
                value = new Intl.NumberFormat("es-ES", { 
                    style: "currency", currency: "EUR"
                }).format(number);
            }
            td.textContent = value;
            tr.appendChild(td);
        });
        yield tr;
    }
}
// FUNCION PARA CREAR TABLAS DE MOVIMIENTOS
async function buildMovementsTable() {
    movements = await fetchMovements();
    const tbody = document.querySelector("#tableBody");
    tbody.innerHTML = ""; 
    if (movements && movements.length > 0) {
        const lastMovement = movements[movements.length - 1];
        sessionStorage.setItem("account.balance", lastMovement.balance);
    }
    const rowGenerator = userRowGenerator(movements);
    for (const row of rowGenerator) {
        tbody.appendChild(row);
    }
    updateAccountInfo();
}
// CREACIÓN DE MOVIMIENTOS (Crud)
async function createMovement(evt) {
    evt.preventDefault(); 
    try {
        const tfAmount = document.getElementById("tfAmount");
        const rbDeposit = document.getElementById("rbDeposit");
        //  MIRAR QUE TIPO DE MOVIMIENTO HA SIDO SELECCIONADO
        let description;
        let balance;
        // SESSION STORAGE DEL ACCOUNT BALANCE Y CREDITLINE
        let currentBalance = parseFloat(sessionStorage.getItem("account.balance")) || 0;
        let amountValue = parseFloat(tfAmount.value);
        // Validación: no permitir signos ni valores negativos
        if (isNaN(amountValue) || amountValue < 0) {
            alert("Introduce una cantidad válida, sin signos ni valores negativos.");
        return;
        }
        let creditLine = parseFloat(sessionStorage.getItem("account.creditLine")) || 0; // AÑADIDO
        // ELECCION DEPENDIENDO DEL RADIOBUTTON
        if (rbDeposit.checked){ 
            description = "Deposit";
            balance = currentBalance + amountValue;
        } else { 
            description = "Payment";
            balance = currentBalance - amountValue;
            
            // VALIDACIÓN DE CRÉDITO
            if (balance < -creditLine) {
                alert(`Operación denegada. Límite de crédito excedido. Su límite es de -${creditLine}€`);
                return;
            }
        }
        //ARRAY NUEVO MOVIMIENTO PARA CALCULAR SALDO DE LA CUENTA ACTUALIZADO
        const newMovement = {
            id: null,
            amount: amountValue,
            description: description,
            timestamp: new Date().toISOString(),
            balance: balance
        };
        // FETCH CON POST PARA ENVIO DE DATOS
        const response = await fetch(SERVICE_DEL_URL + sessionStorage.getItem("account.id"), {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newMovement)
        });

        if (!response.ok) throw new Error("Error en servidor");

        // SINCRONIZACIÓN CON ACCOUNTS
        await syncAccountBalance(balance);
        sessionStorage.setItem("account.balance", balance);
        updateAccountInfo();
        // SE LIMPIA LA TALA Y SE RECARGA
        document.querySelector("#tableBody").innerHTML = "";
        await buildMovementsTable();        

        document.getElementById("formLayer").style.display = "none";
        document.getElementById("formAccount").reset();
    } catch (error) {
        console.error("ERROR:", error);
    }
}
// FUNCIÓN PARA SINCRONIZAR CON LA TABLA DE ACCOUNTS (crUd)
async function syncAccountBalance(newBalance) {
    const accId = sessionStorage.getItem("account.id");
    try {
        const res = await fetch(ACCOUNT_URL + accId);
        const accountData = await res.json();
        accountData.balance = newBalance;

        await fetch(ACCOUNT_URL + accId, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(accountData)
        });
    } catch (e) {
        console.error("Error sincronizando balance:", e);
    }
}
// BORRADO DE MOVIMIENTOS (cruD)
// FETCH CON DELETE PARA BOORADO DE MOVIMIENTOS
async function deleteMovement() {
    // OBTENEMOS EL ID DEL ULTIMO MOVIMIENTO
    const movid = movements[movements.length - 1].id;
    const response = await fetch(SERVICE_DEL_URL + `${encodeURIComponent(movid)}`, {
        method: "DELETE"
    });

    if (response.ok) {
        document.querySelector("#tableBody").innerHTML = "";
        await buildMovementsTable();
        updateAccountInfo();
        // SINCRONIZACIÓN TRAS BORRAR
        const recoveredBalance = parseFloat(sessionStorage.getItem("account.balance"));
        await syncAccountBalance(recoveredBalance);
    } else {
        console.error("No se pudo eliminar el movimiento");
    }
}
//====================== FUNCIONES EXTRAS ==================================
// FUNCION PARA ACTUALIZAR EL BALANCE Y EL ID DE LA CUENTA.
function updateAccountInfo() {
    const accountId = sessionStorage.getItem("account.id") || "Unkown";
    const balance = parseFloat(sessionStorage.getItem("account.balance")) || 0;
    document.getElementById("accountIdText").textContent = accountId;
    
    const balanceMov = document.getElementById("accountBalanceText");
    if (balanceMov) {
        balanceMov.textContent = new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR"
        }).format(balance);
    }
}
/* COSAS A CAMBIAR PARA EL CORRECTO FUNCIONAMIENTO:
*/