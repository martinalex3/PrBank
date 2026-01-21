/**FUNCIONES:
fetchAccounts (); // Función para obtener las cuentas bancarias del servidor.
userRowgenerator (); // Función para crear las filas en la tabla con los datos obetenidos del servidor.(actualizada cpon el formato de fecha y moneda)
pageLoadHandler (); // Función que refresca la pagina y pinta la tabla con los datos actualizados.
generateRandomAccountId (); // Función que genera un id aleatorio de cuenta.
*/

const SERVICE_URL = "/CRUDBankServerSide/webresources/account/customer/";
const ACCOUNT_URL = "/CRUDBankServerSide/webresources/account/";

document.addEventListener("DOMContentLoaded", () => {
    pageLoadHandler();

    const formLayer = document.getElementById("formLayer");
    const formAccount = document.getElementById("formAccount");
    const typeSelect = document.getElementById("type");
    const creditContainer = document.getElementById("creditLineContainer");
    const creditInput = document.getElementById("creditLineInput");

    // Lógica para mostrar/ocultar y validar el campo Credit Line dinámicamente
    typeSelect.addEventListener("change", () => {
        if (typeSelect.value === "1000") {
            creditContainer.style.display = "block";
            creditInput.required = true;
            creditInput.setAttribute("min", "50");
        } else {
            creditContainer.style.display = "none";
            creditInput.required = false;
            creditInput.value = "";
        }
    });

    // Abrir modal
    document.getElementById("btnNuevaCuenta").onclick = () => {
        formLayer.style.display = "flex";
    };

    // Cerrar modal
    document.getElementById("btnClose").onclick = () => {
        formLayer.style.display = "none";
        formAccount.reset();
        creditContainer.style.display = "none";
    };

    // Envío del formulario con validaciones
    formAccount.onsubmit = async (event) => {
        event.preventDefault();

        const balance = parseFloat(document.getElementById("balance").value);
        let creditLineValue = 0;

        // Validación estricta de Línea de Crédito
        if (typeSelect.value === "1000") {
            creditLineValue = parseFloat(creditInput.value);
            if (isNaN(creditLineValue) || creditLineValue <= 0) {
                alert("The credit line must be greater than 0.");
                return;
            }
        }

        const custIdRaw = sessionStorage.getItem("customer.id");
        if (!custIdRaw) {
            alert("Session expired. Please log in again.");
            window.location.href = "index.html";
            return;
        }

        const idLimpio = parseInt(custIdRaw.replace(/[,.]/g, ""));

        const nuevaCuenta = {
            id: Math.floor(Math.random() * 100000000),
            description: document.getElementById("description").value,
            balance: balance,
            creditLine: creditLineValue,
            beginBalance: balance,
            beginBalanceTimestamp: new Date().toISOString().split('.')[0] + "Z",
            "customers": [{ "id": idLimpio }]
        };

        try {
            const response = await fetch(ACCOUNT_URL, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "Accept": "application/json" 
                },
                body: JSON.stringify(nuevaCuenta)
            });

            if (response.ok) {
                formLayer.style.display = "none";
                formAccount.reset();
                creditContainer.style.display = "none";
                pageLoadHandler(); // Recargar tabla
            } else {
                alert("Error creating account. Please try again.");
            }
        } catch (error) {
            console.error("Error en POST:", error);
        }
    };
});

// Función para obtener cuentas del servidor
async function fetchAccounts() {
    const customerId = sessionStorage.getItem("customer.id").replace(/[,.]/g, "");
    const response = await fetch(`${SERVICE_URL}${customerId}?t=${new Date().getTime()}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    return await response.json();
}

// Generador de filas para la tabla
function* userRowGenerator(accounts) {
    for (const account of accounts) {
        const tr = document.createElement("tr");
        
        // Campos a mostrar en orden
        const fields = ["id", "description", "type", "creditLine", "beginBalanceTimestamp", "beginBalance", "balance"];
        
        fields.forEach(field => {
            const td = document.createElement("td");
            let value = account[field];

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
        });

        // Columna de Acciones
        const tdAction = document.createElement("td");
        
        const btnVer = document.createElement("button");
        btnVer.classList.add('movbutton');
        btnVer.textContent = "Movements";
        btnVer.onclick = () => {
            sessionStorage.setItem("account.id", account.id);
            sessionStorage.setItem("account.balance", account.balance);
            sessionStorage.setItem("account.creditLine", account.creditLine);
            window.location.href = "mymovements.html";
        };

        const btnBorrar = document.createElement("button");
        btnBorrar.classList.add('borbutton');
        btnBorrar.textContent = "Delete";
        btnBorrar.onclick = () => deleteAccount(account.id);
        
        tdAction.appendChild(btnVer);
        tdAction.appendChild(btnBorrar);
        tr.appendChild(tdAction);
        
        yield tr;
    }
}

// Manejador de carga de página y actualización de tabla
async function pageLoadHandler() {
    try {
        const accounts = await fetchAccounts();
        const tbody = document.querySelector("#tableBody");
        tbody.innerHTML = "";
        
        const rowGenerator = userRowGenerator(accounts);
        for (const row of rowGenerator) {
            tbody.appendChild(row);
        }
    } catch (e) {
        console.error("Loading error:", e);
    }
}

// Función para borrar cuenta
async function deleteAccount(id) {
    if (confirm(`Are you sure you want to delete account ${id}?`)) {
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
/**
 * //Función para parsear datos en XML (NO NECESARIA YA UTILIZAMOS JSON)
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
*/

//**Resumen del Flujo DELETE
/*Carga página → Fetch datos (JSON) → 
Limpiar tabla → 
Generador crea filas con data-id → 
Usuario presiona borrar → 
target detecta el ID → 
Petición DELETE → 
Refresco automático.
*/


       

