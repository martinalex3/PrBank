
// ====================VARIABLES GLOBALES (ENDPOINTS)===========================

const SERVICE_URL = "/CRUDBankServerSide/webresources/account/customer/";
const ACCOUNT_URL = "/CRUDBankServerSide/webresources/account/";

// ====================INICIALIZACIÓN DE LA INTERFAZ============================

document.addEventListener("DOMContentLoaded", function() {
    displayUserData(); // MOSTRAR USUARIO LOGUEADO
    pageLoadHandler(); // CARGA INICIAL DE LA TABLA DE CUENTAS
    
// =====================CONTROLES FORMULARIO CUENTA=============================
    
    const formLayer = document.getElementById("formLayer");
    const formAccount = document.getElementById("formAccount");
    const typeSelect = document.getElementById("type");
    const creditContainer = document.getElementById("creditLineContainer");
    const creditInput = document.getElementById("creditLineInput");
    
//LÓGICA MOSTRAR/OCULTAR CAMPO "LÍNEA DE CREDITO" SEGÚN TIPO DE CUENTA:

    typeSelect.addEventListener("change", function() {
        if (typeSelect.value === "1000") { // CRÉDITO
            creditContainer.style.display = "block";
            creditInput.required = true;
            creditInput.setAttribute("min", "50");
        } else {
            creditContainer.style.display = "none"; //STANDARD
            creditInput.required = false;
            creditInput.value = "";
        }
    });
// ABRIR CAPA DE CUENTA NUEVA:

    document.getElementById("btnNuevaCuenta").onclick = function() {
        formLayer.style.display = "flex";
    };

// CERRAR CAPA Y RESETEAR CAMPOS:

    document.getElementById("btnClose").onclick = function() {
        formLayer.style.display = "none";
        formAccount.reset();
        creditContainer.style.display = "none";
    };

// ==============CONTROLES VIDEO DE AYUDA (H5P)=================================

    const videoLayer = document.getElementById("videoLayer");
    const btnCloseVideo = document.getElementById("btnCloseVideo");
    const h5pContainer = document.getElementById("h5p-container");
    let h5pInstance = null;

    document.querySelector(".help-link").onclick = function(e) {
        e.preventDefault();
        videoLayer.style.display = "flex";

        if (!h5pInstance) {
            const options = { // INDICAMOS LAS RUTAS PARA QUE LA APLICACION TENGA ACCESO A ASSETS DE H5P
                h5pJsonPath: '/PrBank/assets/h5p-content',
                frameJs: '/PrBank/assets/h5p-player/frame.bundle.js',
                frameCss: '/Prbank/assets/h5p-player/styles/h5p.css',
                librariesPath: '/PrBank/assets/h5p-libraries'
            };
            h5pInstance = new H5PStandalone.H5P(h5pContainer, options);
        }
    };

    btnCloseVideo.onclick = function() {
        videoLayer.style.display = "none";
        h5pContainer.innerHTML = ""; // LIMPIA EL CONTENEDOR AL CERRAR
        h5pInstance = null;
    };

// ENVIO DEL FORMULARIO (POST):

    formAccount.onsubmit = async function(event) {
        event.preventDefault();
        const balance = parseFloat(document.getElementById("balance").value);
        let creditLineValue = 0;

// VALIDACIÓN DE LA CUENTA DE CRÉDITO:

        if (typeSelect.value === "1000") {
            creditLineValue = parseFloat(creditInput.value);
            if (isNaN(creditLineValue) || creditLineValue <= 0) {
                alert("The credit line must be greater than 0.");
                return;
            }
        }

// OBTENCIÓN DEL ID Y LIMPIEZA DEL ID DEL CLIENTE DESDE LA SESIÓN:

        const custIdRaw = sessionStorage.getItem("customer.id");
        if (!custIdRaw) {
            alert("Session expired. Please log in again.");
            window.location.href = "index.html";
            return;
        }
// ELIMINACIÓN DE CARACTERES PROBLEMÁTICOS COMO PUNTOS Y COMAS:

        const idLimpio = parseInt(custIdRaw.replace(/[,.]/g, ""));

// CREACIÓN DEL OBJETO CUENTA PARA EL SERVIDOR:

        const nuevaCuenta = {
            id: Math.floor(Math.random() * 100000000), // ID ALEATORIO TEMPORAL
            description: document.getElementById("description").value,
            balance: balance,
            creditLine: creditLineValue,
            beginBalance: balance,
            beginBalanceTimestamp: new Date().toISOString().split('.')[0] + "Z", // FORMATO DE FECHA ISO SEGÚN LAS REGLAS DEL BACKEND
            "customers": [{ "id": idLimpio }]
        };

        try {
            const response = await fetch(ACCOUNT_URL, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "Accept": "application/json" 
                },
                body: JSON.stringify(nuevaCuenta) // CONVERTIMOS A CADENA JSON
            });

            if (response.ok) {
                formLayer.style.display = "none";
                formAccount.reset();
                creditContainer.style.display = "none";
                pageLoadHandler(); // LLAMAMOS ALA FUNCION DE REFRESCO.
            } else {
                alert("Error creating account.");
            }
        } catch (error) {
            console.error("Error en POST:", error);
        }
    };
});


// ============FUNCIONES ASÍNCRONAS:=======================================================


// FUNCION ASÍNCRONA QUE OBTIENE TODOS LOS DATOS DE CUESNTAS DEL USUARIO ACTUAL (GET):

async function fetchAccounts() {
    const customerId = sessionStorage.getItem("customer.id").replace(/[,.]/g, "");
    const response = await fetch(`${SERVICE_URL}${customerId}?t=${new Date().getTime()}`, {
        method: "GET",
        headers: { "Accept": "application/json" } // UTILIZAMOS JSON
    });
    return await response.json();
}

//FUNCIÓN GENERADORA DE LA FILAS Y CELDAS DE LA TABLA SEGUN LOS DATOS DEL SERVIDOR:

function* userRowGenerator(accounts) {
    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const tr = document.createElement("tr");
        const fields = ["id", "description", "type", "creditLine", "beginBalanceTimestamp", "beginBalance", "balance"];
        
        for (let j = 0; j < fields.length; j++) {
            const field = fields[j];
            const td = document.createElement("td");
            let value = account[field];

// VALIDACIÓN POR TIPO DE CUENTA:

            if (field === "type") {
                td.textContent = account.creditLine > 0 ? "CREDIT" : "STANDARD";
            } 
            else if (field === "beginBalanceTimestamp" && value) {
                const date = new Date(value);
                td.textContent = new Intl.DateTimeFormat("es-ES", { 
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit", hour12: false
                }).format(date);
            }
            else if (["creditLine", "beginBalance", "balance"].includes(field)) {
                const number = parseFloat(value || 0);
                td.textContent = new Intl.NumberFormat("es-ES", { 
                    style: "currency", currency: "EUR" 
                }).format(number);
            }
            else {
                td.textContent = value !== undefined ? value : "";
            }
            tr.appendChild(td);
        }

// COLUMNA DE ACCIONES (BOTÓN DE MOVIMIENTOS Y BORRAR):

        const tdAction = document.createElement("td");

// BOTÓN MOVEMENTS: GUARDA ID, BALANCE, CREDIT LINE Y REDIRIGE:
        
        const btnVer = document.createElement("button");
        btnVer.classList.add('movbutton');
        btnVer.textContent = "Movements";
        btnVer.onclick = function() {
            sessionStorage.setItem("account.id", account.id);
            sessionStorage.setItem("account.balance", account.balance);
            sessionStorage.setItem("account.creditLine", account.creditLine);
            window.location.href = "mymovements.html";
        };
        
// BOTÓN BORRAR: LLAMA A LA FUNCIÓN DE ELIMINACIÓN:

        const btnBorrar = document.createElement("button");
        btnBorrar.classList.add('borbutton');
        btnBorrar.textContent = "Delete";
        btnBorrar.onclick = function() {
            deleteAccount(account.id);
        };
        
        tdAction.appendChild(btnVer);
        tdAction.appendChild(btnBorrar);
        tr.appendChild(tdAction);
        yield tr; // RETORNA LA FILA Y PAUSA EJECUCIÓN
    }
}


// FUNCIÓN ASÍNCRONA DE CARGA DE LA PÁGINA:

async function pageLoadHandler() {
    try {
        const accounts = await fetchAccounts();
        totalBalanceAccounts(accounts); // ACTUALIZA EL SUMATORIO TOTAL
        const tbody = document.querySelector("#tableBody");
        tbody.innerHTML = ""; // LIMPIEZA DE DATOS PREVIOS DE LA TABLA
        const rowGenerator = userRowGenerator(accounts);
        for (const row of rowGenerator) {
            tbody.appendChild(row);
        }
    } catch (e) {
        console.error("Loading error:", e);
    }
}

// FUNCIÓN ASÍNCRONA DE BORRADO DE CUENTAS:

async function deleteAccount(id) {
    if (confirm("Are you sure you want to delete account " + id + "?")) {
        try {
            const res = await fetch(ACCOUNT_URL + id, { method: "DELETE" });
            if (res.ok) {
                pageLoadHandler();
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    }
}

//===================OTRAS  FUNCIONES=======================================

// FUNCIÓN DE CALCULO DE BALANCE DE TODAS LAS CUENTAS DEL USUARIO:

function totalBalanceAccounts(accounts) {
    let totalBalance = 0;
    for (let i = 0; i < accounts.length; i++) {
        totalBalance += (parseFloat(accounts[i].balance) || 0);
    }

// FORMATEO DE DIVISA E IMPORTES DEL BALANCE:

    const formateador = new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR"
    }).format(totalBalance);
    
    const txtTop = document.getElementById("totalBalanceTop");
    const txtBottom = document.getElementById("totalBalanceBottom");
    
    if (txtTop) txtTop.textContent = formateador;
    if (txtBottom) txtBottom.textContent = formateador;
}

// FUNCIÓN DE OBTENCIÓN DEL NOMBRE Y APELLIDO DE USUARIO (BIENVENIDA):

function displayUserData() {
    const firstName = sessionStorage.getItem("customer.firstName");
    const lastName = sessionStorage.getItem("customer.lastName");
    const displayElement = document.getElementById("userNameDisplay");

    if (displayElement && firstName && lastName) {
        displayElement.textContent = firstName + " " + lastName;
    }
}

  /**
 * //FUNCIÓN PARA PARSEAR DATOS EN XML (NO NECESARIA YA UTILIZAMOS JSON)
 */
/*function parseUsersXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");
    const users = [];
    const userNodes = xmlDoc.getElementsByTagName("user");
    for (const userNode of userNodes) {
        users.push({
            id: userNode.getElementsByTagName("id")[0].textContent,
            name: userNode.getElementsByTagName("descripcion")[0].textContent,
            email: userNode.getElementsByTagName("e")[0].textContent
            });
    }
    return users;
}


//**Resumen del Flujo DELETE
/*Carga página → Fetch datos (JSON) → 
Limpiar tabla → 
Generador crea filas con data-id → 
Usuario presiona borrar → 
target detecta el ID → 
Petición DELETE → 
Refresco automático.
*/   
