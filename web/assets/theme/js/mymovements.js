/* * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// REGEX PARA VALIDACIÓN DE FECHAS
const isoRegex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2})/;

// PATH PARAM DEL SERVIDOR
const SERVICE_URL = "/CRUDBankServerSide/webresources/movement/account/";
const SERVICE_DEL_URL = "/CRUDBankServerSide/webresources/movement/";
const ACCOUNT_URL = "/CRUDBankServerSide/webresources/account/";

// ARRAY GLOBAL MOVEMENTS
let movements = [];

// LINEA DOM
document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar info de cuenta
    updateAccountInfo();
    
    const accountId = sessionStorage.getItem("account.id") || "Unknown";
    document.getElementById("accountIdText").textContent = accountId;
    
    // EVITAR SIGNOS EN CANTIDAD
    const tfAmount = document.getElementById("tfAmount");
    tfAmount.addEventListener("keypress", (e) => {
        if (e.key === "+" || e.key === "-") {
            e.preventDefault();
        }
    });
    // 2. Construir tabla
    buildMovementsTable();

    // 3. Eventos de UI
    document.getElementById("btnOpen").addEventListener("click", () => {
        document.getElementById("formLayer").style.display = "flex";
    });

    document.getElementById("btnClose").addEventListener("click", () => {
        document.getElementById("formLayer").style.display = "none";
        document.getElementById("formAccount").reset();
    });

    document.getElementById("formAccount").addEventListener("submit", createMovement);

    document.getElementById("btnUndo").addEventListener("click", () => {
        if (movements.length > 0) {
            document.getElementById("confirmLayer").style.display = "flex";
        } else {
            alert("No hay movimientos para borrar");
        }
    });

    document.getElementById("btnConfirmYes").addEventListener("click", () => {
        deleteMovement();
        document.getElementById("confirmLayer").style.display = "none";
    });

    document.getElementById("btnConfirmNo").addEventListener("click", () => {
        document.getElementById("confirmLayer").style.display = "none";
    });
});

// OBTENER MOVIMIENTOS
async function fetchMovements() {
    const accId = sessionStorage.getItem("account.id");
    const response = await fetch(SERVICE_URL + accId, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    return await response.json();
}

// GENERADOR DE FILAS
function* userRowGenerator(movements) {
    for (const movement of movements) {
        const tr = document.createElement("tr");
        ["timestamp", "description", "amount", "balance"].forEach(field => {
            const td = document.createElement("td");
            let value = movement[field];

            if (field === "timestamp" && value) {
                const date = new Date(value);
                value = new Intl.DateTimeFormat("es-ES", { 
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit", hour12: false
                }).format(date);
            }
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

// CONSTRUIR TABLA
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

// CREAR MOVIMIENTO (Lógica corregida)
async function createMovement(evt) {
    evt.preventDefault(); 
    try {
        const tfAmount = document.getElementById("tfAmount");
        const rbDeposit = document.getElementById("rbDeposit"); // ID correcto en tu HTML
        const accountId = sessionStorage.getItem("account.id");
        
        // RECUPERACIÓN SEGURA DE DATOS
        let currentBalance = parseFloat(sessionStorage.getItem("account.balance")) || 0;
        let amountValue = parseFloat(tfAmount.value);
        let creditLine = parseFloat(sessionStorage.getItem("account.creditLine")) || 0;

        let description;
        let balance;

        // LÓGICA DE DEPÓSITO O PAGO
        // Nota: En tu HTML el radio de pago tiene id="rbPayment"
        if (rbDeposit.checked) { 
            description = "Deposit";
            balance = currentBalance + amountValue;
        } else { 
            description = "Payment";
            balance = currentBalance - amountValue;
            
            // VALIDACIÓN DE CRÉDITO: Saldo disponible = propio + crédito
            if (balance < -creditLine) {
                const disponibleTotal = currentBalance + creditLine;
                alert(`Operación denegada. Límite de crédito excedido.\n` +
                      `Su disponible total es de ${disponibleTotal.toFixed(2)}€`);
                return;
            }
        }

        const newMovement = {
            id: null,
            amount: amountValue,
            description: description,
            timestamp: new Date().toISOString(),
            balance: balance
        };

        // POST AL SERVIDOR
        const response = await fetch(SERVICE_DEL_URL + accountId, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newMovement)
        });

        if (!response.ok) throw new Error("Error en servidor al crear movimiento");

        // Actualizar datos locales y sincronizar cuenta padre
        await syncAccountBalance(balance);
        sessionStorage.setItem("account.balance", balance);
        
        // UI reset
        document.getElementById("formLayer").style.display = "none";
        document.getElementById("formAccount").reset();
        await buildMovementsTable();        

    } catch (error) {
        console.error("ERROR:", error);
        alert("No se pudo realizar el movimiento.");
    }
}

// SINCRONIZAR BALANCE CON LA CUENTA (PUT)
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

// BORRADO (UNDO)
async function deleteMovement() {
    if (movements.length === 0) return;
    
    const movid = movements[movements.length - 1].id;
    const response = await fetch(SERVICE_DEL_URL + `${encodeURIComponent(movid)}`, {
        method: "DELETE"
    });

    if (response.ok) {
        await buildMovementsTable();
        // El balance de sesión se actualiza dentro de buildMovementsTable al detectar el nuevo "último"
        const recoveredBalance = parseFloat(sessionStorage.getItem("account.balance"));
        await syncAccountBalance(recoveredBalance);
    } else {
        console.error("No se pudo eliminar el movimiento");
    }
}

// ACTUALIZAR TEXTOS DE INTERFAZ
function updateAccountInfo() {
    const accountId = sessionStorage.getItem("account.id") || "---";
    const balance = parseFloat(sessionStorage.getItem("account.balance")) || 0;

    document.getElementById("accountIdText").textContent = accountId;
    
    // Verificamos si existe el elemento del balance (en tu HTML es accountBalanceText)
    const balanceElem = document.getElementById("accountBalanceText");
    if (balanceElem) {
        balanceElem.textContent = new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR"
        }).format(balance);
    }
}