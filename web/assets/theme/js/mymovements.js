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
//document.addEventListener("DOMContentLoaded", () => {
document.addEventListener("DOMContentLoaded", function(){
    buildMovementsTable();
    updateAccountInfo();
    //syncAccountBalance();
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
    document.getElementById("btnOpen").addEventListener("click", function() {
    document.getElementById("formLayer").style.display = "flex";
    });
    // CERRAR FORMULARIO NEW MOVEMENT
    document.getElementById("btnClose").addEventListener("click", function() {
    document.getElementById("formLayer").style.display = "none";
    });
    // ENVIAR FORMULARIO Y CREAR NEW MOVEMENT
    document.getElementById("formAccount").addEventListener("submit", createMovement);
    // BOTÓN UNDO: CON MENSAJE DE CONFIRMACIÓN
    document.getElementById("btnUndo").addEventListener("click", function() {
    if (movements.length > 0) {
        document.getElementById("confirmLayer").style.display = "flex";
    } else {
        alert("There are no moves to delete");
    }
    });
    // BOTÓN SI, BORRAR (Dentro del confirmLayer)
    document.getElementById("btnConfirmYes").addEventListener("click", function() {
    deleteMovement(); // Llamamos a la función de borrar
    document.getElementById("confirmLayer").style.display = "none"; // Cerramos tras borrar
    });
    // BOTÓN NO, CANCELAR (Dentro del confirmLayer)
    document.getElementById("btnConfirmNo").addEventListener("click", function() {
    document.getElementById("confirmLayer").style.display = "none"; // Cerramos sin borrar
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
    //AÑADIDO EL USO DEL MODELO DE DATOS
    const data = await fetchMovements();
    movements = data.map(m =>
    new Movement(
        m.id,
        m.amount,
        m.description,
        m.timestamp,
        m.balance
    )
    );
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
    // ACTUALIZA LOS DASTOS DE LA CUENTA EN PANTALLA AL MAS RECIENTE
    updateAccountInfo();
    updateMovementsSummary();
}
// =================== CREACION DE MOVIMIENTOS ====================
// CREACIÓN DE MOVIMIENTOS (Crud)
async function createMovement(evt) {
    evt.preventDefault();

    try {
        const tfAmount = document.getElementById("tfAmount");
        const rbDeposit = document.getElementById("rbDeposit");

        let amountValue = parseFloat(tfAmount.value);
        if (isNaN(amountValue) || amountValue <= 0) {
            alert("Please enter a valid positive amount.");
            return;
        }

        const account = getAccountFromStorage();
        let newBalance;
        let description;

        if (rbDeposit.checked) {
            description = "Deposit";
            newBalance = account.balance + amountValue;
        } else {
            description = "Payment";
            newBalance = account.balance - amountValue;

            if (newBalance < -account.creditLine) {
                alert("Transaction denied. Credit limit exceeded.");
                return;
            }
        }
        // AÑADIDO EL USO DEL MODELO DE DATOS
        const newMovement = new Movement(
            null,
            amountValue,
            description,
            new Date().toISOString(),
            newBalance
        );
        const response = await fetch(
            SERVICE_DEL_URL + sessionStorage.getItem("account.id"),
            {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newMovement)
            }
        );

        if (!response.ok) {
            throw new Error("Error creating movement");
        }

        account.balance = newBalance;
        await syncAccountBalance(account.id, newBalance);

        await buildMovementsTable();
        updateAccountInfo();

        document.getElementById("formLayer").style.display = "none";
        document.getElementById("formAccount").reset();

    } catch (error) {
        console.error("Create movement failed:", error);
    }
}
// ============= SINCRONIZACION DE CUENTA ====================
// ACTUALIZA EL BALANCE DE LA CUENTA EN EL SERVIDOR
// SE REALIZA UN GET PREVIO PARA OBTENER LA CUENTA COMPLETA
// EVITA QUE EL PUT BORRE CAMPOS COMO description, beginBalance, customers, etc.
async function syncAccountBalance(accountId, newBalance) {
    try {
        // SE RECUPERA LA CUENTA COMPLETA
        const account = await fetchAccountById(accountId);

        // MODIFICAMOS SOLO EL BALANCE
        account.balance = newBalance;

        // ENVIAMOS EL OBJETO COMPLETO MEDIANTE PUT
        const response = await fetch(ACCOUNT_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(account)
        });

        if (!response.ok) {
            throw new Error("Error updating account");
        }

        // ACTUALIZAMOS EL BALANCE EN SESSIONSTORAGE
        sessionStorage.setItem("account.balance", newBalance);

    } catch (error) {
        console.error("Account sync failed:", error);
    }
}

// ===================== BORRADO DE MOVIMIENTOS ====================
// FETCH CON DELETE PARA BORRADO DE MOVIMIENTOS
// BORRADO DEL ULTIMO MOVIMIENTO Y RECALCULO DEL BALANCE
// NO SE ELIMINA LA CUENTA, SOLO SE ACTUALIZA SU BALANCE
async function deleteMovement() {
    if (movements.length === 0) return;

    const lastMovement = movements[movements.length - 1];
    const movid = lastMovement.id;
    const accountId = sessionStorage.getItem("account.id");

    try {
        // PETICION DELETE AL SERVIDOR PARA ELIMINAR EL MOVIMIENTO
        const response = await fetch(
            SERVICE_DEL_URL + encodeURIComponent(movid),
            { method: "DELETE", headers: { "Accept": "application/json" } }
        );

        if (!response.ok) {
            throw new Error("Error deleting movement");
        }
        // ELIMINAMOS EL MOVIMIENTO DEL ARRAY LOCAL
        movements.pop();
        // RECALCULAMOS EL BALANCE SEGUN EL TIPO DE MOVIMIENTO
        let currentBalance = parseFloat(sessionStorage.getItem("account.balance"));

        if (lastMovement.description === "Deposit") {
            currentBalance -= lastMovement.amount;
        } else {
            currentBalance += lastMovement.amount;
        }
        // SINCRONIZAMOS EL NUEVO BALANCE CON EL SERVIDOR
        await syncAccountBalance(accountId, currentBalance);
        // REFRESCAMOS TABLA E INFORMACION DE CUENTA
        await buildMovementsTable();
        updateAccountInfo();

    } catch (error) {
        console.error("Delete movement failed:", error);
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

// ========================== INFO OPERACION AGREGADA ======================
function updateMovementsSummary() {
    let depositCount = 0;
    let paymentCount = 0;

    movements.forEach(movement => {
        if (movement.description === "Deposit") {
            depositCount++;
        } else if (movement.description === "Payment") {
            paymentCount++;
        }
    });

    document.querySelector(".deposit-count").textContent = depositCount;
    document.querySelector(".payment-count").textContent = paymentCount;
}

// ====================== H5P ===============================================
document.addEventListener("DOMContentLoaded", () => {
    const videoLayer = document.getElementById("videoLayer");
    const btnCloseVideo = document.getElementById("btnCloseVideo");
    const h5pContainer = document.getElementById("h5p-container");
    let h5pInstance = null;

    document.querySelector(".help-link").onclick = (e) => {
        e.preventDefault();
        videoLayer.style.display = "flex";

        if (!h5pInstance) {
            const options = {
                h5pJsonPath: '/PrBank/assets/h5p-content',
                frameJs: '/PrBank/assets/h5p-player/frame.bundle.js',
                frameCss: '/PrBank/assets/h5p-player/styles/h5p.css',
                librariesPath: '/PrBank/assets/h5p-libraries'
            };
            h5pInstance = new H5PStandalone.H5P(h5pContainer, options);
        }
    };

    btnCloseVideo.onclick = () => {
        videoLayer.style.display = "none";
        h5pContainer.innerHTML = "";
        h5pInstance = null;
    };
});
// ======================== ASYNC DE CUENTAS ===============================
// FUNCION PARA OBTENER LOS DATOS BASICOS DE LA CUENTA DESDE SESSIONSTORAGE

function getAccountFromStorage() {
    return {
        id: sessionStorage.getItem("account.id"),
        balance: parseFloat(sessionStorage.getItem("account.balance")) || 0,
        creditLine: parseFloat(sessionStorage.getItem("account.creditLine")) || 0
    };
}
// FUNCION ASINCRONA PARA OBTENER UNA CUENTA COMPLETA DESDE EL SERVIDOR
// SE USA ANTES DE HACER UN PUT PARA EVITAR BORRAR CAMPOS IMPORTANTES
async function fetchAccountById(accountId) {
    const response = await fetch(ACCOUNT_URL + accountId, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
        throw new Error("Error fetching account");
    }

    return await response.json();
}

// ======================== SCRIPTS DE NAVEGACION ============================
function goToAccounts() {
        window.location.href = "myaccounts.html";
    }
function logout() {
        window.location.href = "index.html";
    }


/*Usar modelo de datos
 * Usar formateo de numeros, validacion de numeros , positivo, negativo*/