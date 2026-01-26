/* * To change this license header, choose License Headers in Project Properties
 * To change this template file, choose Tools | Templates
 */
// ======================== CONSTANTES Y VARIABLES GLOBALES ====================
// ARRAY FECHAS CORRECTAS 
const isoRegex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2})/;
// PATH PARAM DEL SERVIDOR PARA OBTENER MOVIMIENTOS POR CUENTA
const SERVICE_URL = "/CRUDBankServerSide/webresources/movement/account/";
// PATH PARAM DEL DELETE DE MOVIMIENTOS (BORRADO POR ID)
const SERVICE_DEL_URL = "/CRUDBankServerSide/webresources/movement/";
// PATH PARAM PARA ACTUALIZACION DE CUENTA (TABLA ACCOUNT)
const ACCOUNT_URL = "/CRUDBankServerSide/webresources/account/";
// ARRAY GLOBAL DONDE SE GUARDAN LOS MOVIMIENTOS RECUPERADOS DEL SERVIDOR
let movements = [];
// ====================== DOM CONTENT LOADED ============================
// EJECUCION CUANDO EL HTML SE EJECUTA POR COMPLETO
document.addEventListener("DOMContentLoaded", () => {
    // GUARDAR EL BALANCE INICIAL DE LA CUENTA
    const initialBalance = parseFloat(sessionStorage.getItem("account.balance")) || 0;
    sessionStorage.setItem("account.initialBalance", initialBalance);
    // ACTUALIZA EL ID Y EL BALANCE AL CARGAR LA PAGINA
    updateAccountInfo();
    // MUESTRA EL ID DE LA CUENTA
    const accountId = sessionStorage.getItem("account.id") || "Unknown";
    document.getElementById("accountIdText").textContent = accountId;
    // MUESTRA EL CREDIT LINE DE LA CUENTA
    const creditLineRaw = sessionStorage.getItem("account.creditLine");
    const creditLine = parseFloat(creditLineRaw);
    // CREAMOS EL NUEVO ARRAY PARA EL CREDITTEXT
    const creditText = document.getElementById("accountCreditText");
    // SI NO TIENE LINEA DE CREDITO (STANDARD)
    if (!creditLineRaw || isNaN(creditLine) || creditLine === 0) {
        creditText.textContent = "This account has no credit line (Standard)";
    } 
    // SI TIENE LINEA DE CREDITO
    else {
        creditText.textContent = new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(creditLine);
    }
    // CONSTRUIR TABLA
    buildMovementsTable();
    // ABRIR FORMULARIO NEW MOVEMENT
    document.getElementById("btnOpen").addEventListener("click", () => {
        document.getElementById("formLayer").style.display = "flex";
    });
    // CERRAR FORMULARIO NEW MOVEMENT
    document.getElementById("btnClose").addEventListener("click", () => {
        document.getElementById("formLayer").style.display = "none";
    });
    // ENVIAR FORMULARIO Y CREA NEW MOVEMENT
    document.getElementById("formAccount").addEventListener("submit", createMovement);
    // BOTON UNDO: CON MENSAJE DE CONFIRMACION
    document.getElementById("btnUndo").addEventListener("click", () => {
        if (movements.length > 0) {
            document.getElementById("confirmLayer").style.display = "flex";
        } else {
            alert("There are no moves to delete");
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
// ========================= FETCH MOVIMIENTOS =======================
// LEER TABLAS EN EL SERVIDOR (cRud)
// FETCH MOVEMENTS IN JSON FORMAT
async function fetchMovements() {
    const response = await fetch(SERVICE_URL + `${sessionStorage.getItem("account.id")}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    return await response.json();
}
// ============= GENERADOR DE FILAS DE TABLA =======================
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
// ====================== TABLA DE MOVIMIENTOS ==================
// FUNCION PARA CREAR TABLAS DE MOVIMIENTOS
async function buildMovementsTable() {
    movements = await fetchMovements();
    const tbody = document.querySelector("#tableBody");
    tbody.innerHTML = ""; 
    // ACTUALIZA EL BALANCE SEGUN EL ULTIMO MOVIMIENTO
    if (movements && movements.length > 0) {
        const lastMovement = movements[movements.length - 1];
        sessionStorage.setItem("account.balance", lastMovement.balance);
    }
    // INSERCION DE FILAS EN LA TABLA
    const rowGenerator = userRowGenerator(movements);
    for (const row of rowGenerator) {
        tbody.appendChild(row);
    }
    // ACTUALIZA LOS DASTOS DE LA CUENTA EN PANTALLA - AL MAS RECIENTE
    updateAccountInfo();
}
// =================== CREACION DE MOVIMIENTOS ====================
// CREACIÓN DE MOVIMIENTOS (Crud)
async function createMovement(evt) {
    evt.preventDefault(); 
    try {
        const tfAmount = document.getElementById("tfAmount");
        const rbDeposit = document.getElementById("rbDeposit");
        //  VARIABLES PARA DEFINIR EL MOVIMIENTO
        let description;
        let balance;
        // BALANCE ACTUAL DE LA CUENTA
        let currentBalance = parseFloat(sessionStorage.getItem("account.balance")) || 0;
        let amountValue = parseFloat(tfAmount.value);
        // VALIDACION: NO PERMITE SIGNOS NI NUMEROS NEGATIVOS
        if (isNaN(amountValue) || amountValue < 0) {
            alert("Please, enter a valid amount, without negative signs or values..");
        return;
        }
        // LINEA PARA COGER CORRECTAMENTE EL CREDITLINE DE CUENTAS
        let creditLine = parseFloat(sessionStorage.getItem("account.creditLine")) || 0;
        // ELECCION DEPENDIENDO DEL RADIOBUTTON
        if (rbDeposit.checked){ 
            description = "Deposit";
            balance = currentBalance + amountValue;
        } else { 
            description = "Payment";
            balance = currentBalance - amountValue;
            
            // VALIDACIÓN DE CRÉDITO
            if (balance < -creditLine) {
                alert(`Transaction denied. Credit limit exceeded. Your limit is -${creditLine}€`);
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
        // EN CASO DE ERROR
        if (!response.ok) throw new Error("Server Failed");
        // SINCRONIZACIÓN CON ACCOUNTS
        await syncAccountBalance(balance);
        // GUARDAMOS EL NUEVO BALANCE EN SESSIONSTORAGE
        sessionStorage.setItem("account.balance", balance);
        updateAccountInfo();
        // SE LIMPIA LA TALA Y SE RECARGA
        document.querySelector("#tableBody").innerHTML = "";
        await buildMovementsTable();        
        // SE CIERRA Y SE LIMPIA EL FORMULARIO
        document.getElementById("formLayer").style.display = "none";
        document.getElementById("formAccount").reset();
    } catch (error) {
        console.error("ERROR:", error);
    }
}
// ============= SINCRONIZACION DE CUENTA ====================
// ACTUALIZA EL BALANCE DE LA CUENTA EN EL SERVIDOR
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
        console.error("Error synchronizing balance:", e);
    }
}
// ===================== BORRADO DE MOVIMIENTOS ====================
// FETCH CON DELETE PARA BOORADO DE MOVIMIENTOS
async function deleteMovement() {
    // OBTENEMOS EL ID DEL ULTIMO MOVIMIENTO
    const movid = movements[movements.length - 1].id;
    const response = await fetch(SERVICE_DEL_URL + `${encodeURIComponent(movid)}`, {
        method: "DELETE"
    });

    if (response.ok) {
        // REMOVER EL ULTIMO MOVIMIENTO DEL ARRAY
        movements.pop();
        
        // DETERMINAR EL NUEVO BALANCE
        let newBalance;
        if (movements.length === 0) {
            // SI NO QUEDAN MOVIMIENTOS, RESTAURAR BALANCE INICIAL
            newBalance = parseFloat(sessionStorage.getItem("account.initialBalance")) || 0;
        } else {
            // SI QUEDAN MOVIMIENTOS, TOMAR EL BALANCE DEL ULTIMO
            newBalance = movements[movements.length - 1].balance;
        }

        // ACTUALIZAR SESSIONSTORAGE Y SERVIDOR
        sessionStorage.setItem("account.balance", newBalance);
        await syncAccountBalance(newBalance);

        // RECONSTRUIR TABLA Y ACTUALIZAR INFO
        document.querySelector("#tableBody").innerHTML = "";
        await buildMovementsTable();
        updateAccountInfo();
    } else {
        console.error("The movement could not be deleted");
    }
}
//====================== FUNCIONES EXTRAS ==================================
// FUNCION PARA ACTUALIZAR EL BALANCE Y EL ID DE LA CUENTA.
function updateAccountInfo() {
    const accountId = sessionStorage.getItem("account.id") || "Unkown";
    const balance = parseFloat(sessionStorage.getItem("account.balance")) || 0;
    document.getElementById("accountIdText").textContent = accountId;
    const formattedBalance = new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR"
    }).format(balance);
    // BALANCE SUPERIOR
    const balanceTop = document.getElementById("accountBalanceText");
    if (balanceTop) {
        balanceTop.textContent = formattedBalance;
    }
    // BALANCE INFERIOR
    const balanceBottom = document.getElementById("accountBalanceBottom");
    if (balanceBottom) {
        balanceBottom.textContent = formattedBalance;
    }
}
/* COSAS A CAMBIAR PARA EL CORRECTO FUNCIONAMIENTO:
 * Seguir mirando pruebas de movimientos y comprobar validaciones
*/
