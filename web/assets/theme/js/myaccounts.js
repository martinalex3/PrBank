const SERVICE_URL = "/CRUDBankServerSide/webresources/account/customer/";
const ACCOUNT_URL = "/CRUDBankServerSide/webresources/account/";

document.addEventListener("DOMContentLoaded", pageLoadHandler);

// 0. Obtener cuentas del servidor
async function fetchAccounts() {
    const customerId = sessionStorage.getItem("customer.id").replace(/[,.]/g, "");
    const response = await fetch(SERVICE_URL + customerId, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error("Error al obtener cuentas");
    return await response.json();
}

// 1. Generador de filas para la tabla
function* userRowGenerator(accounts) {
    for (const account of accounts) {
        const tr = document.createElement("tr");

        ["id", "description", "balance", "creditLine", "beginBalanceTimestamp"].forEach(field => {
            const td = document.createElement("td");
            if (field === "creditLine") {
                td.textContent = account[field] > 0 ? "CREDIT" : "STANDARD";
            } else {
                td.textContent = account[field] !== undefined ? account[field] : "";
            }
            tr.appendChild(td);
        });

        const tdAction = document.createElement("td");

        const btnVer = document.createElement("button");
        btnVer.textContent = "Movimientos";
        btnVer.onclick = () => {
            sessionStorage.setItem("account.id", account.id);
            window.location.href = "mymovements.html";
        };
        tdAction.appendChild(btnVer);

        const btnBorrar = document.createElement("button");
        btnBorrar.textContent = "Borrar";
        btnBorrar.classList.add("btn-borrar");
        btnBorrar.setAttribute("data-id", account.id);
        btnBorrar.style.backgroundColor = "red";
        btnBorrar.style.color = "white";
        btnBorrar.style.marginLeft = "10px";
        tdAction.appendChild(btnBorrar);

        tr.appendChild(tdAction);
        yield tr;
    }
}

// 2. Función Principal
async function pageLoadHandler() {
    try {
        const accounts = await fetchAccounts();
        const tbody = document.querySelector("#tableBody");
        tbody.innerHTML = "";

        // --- DELEGACIÓN DE EVENTOS (BORRAR) CON VALIDACIÓN ---
        tbody.onclick = async (event) => {
            if (event.target.classList.contains("btn-borrar")) {
                const id = event.target.getAttribute("data-id");
                
                // BUSCAR LA CUENTA PARA VALIDAR MOVIMIENTOS
                const account = accounts.find(acc => acc.id == id);
                if (account && account.movements && account.movements.length > 0) {
                    alert("No se puede borrar una cuenta que tenga movimientos.");
                    return;
                }

                if (confirm(`¿Eliminar cuenta ${id}?`)) {
                    const res = await fetch(ACCOUNT_URL + id, { method: "DELETE" });
                    if (res.ok) {
                        pageLoadHandler();
                    } else {
                        alert("Error: No se puede borrar una cuenta con movimientos.");
                    }
                }
            }
        };

        function generateRandomAccountId () { 
            return Math.floor(Math.random() * 100000000); 
        }

        const capa = document.querySelector(".crear-cuenta-container");
        document.getElementById("btn-nueva-cuenta").onclick = () => capa.style.display = "flex";
        document.querySelector(".btn-cancel").onclick = () => {
            capa.style.display = "none";
            document.getElementById("formAccount").reset();
        };

        // BOTÓN GUARDAR (POST) CON VALIDACIÓN DE SALDO
        document.querySelector(".btn-save").onclick = async () => {
            const balance = parseFloat(document.getElementById("balance").value);
            const creditLine = parseFloat(document.getElementById("type").value);

            // VALIDACIÓN: NO PERMITIR SALDO NEGATIVO SI ES CUENTA CRÉDITO
            if (creditLine > 0 && balance < 0) {
                alert("Una cuenta de crédito no puede tener saldo negativo.");
                return;
            }

            const custIdRaw = sessionStorage.getItem("customer.id");
            const idLimpio = parseInt(custIdRaw.replace(/[,.]/g, ""));
            
            const nuevaCuenta = {
                id: generateRandomAccountId(),
                description: document.getElementById("description").value,
                balance: balance,
                creditLine: creditLine,
                beginBalance: balance,
                beginBalanceTimestamp: new Date().toISOString().split('.')[0] + "Z",
                "customers": [
                    { "id": idLimpio }
                ]
            };          

            const response = await fetch(ACCOUNT_URL, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(nuevaCuenta)
            });

            if (response.ok) {
                capa.style.display = "none";
                document.getElementById("formAccount").reset();
                setTimeout(pageLoadHandler, 300); 
            } else {
                alert("Error al crear. Contacte al administrador.");
            }
        };

        const rowGenerator = userRowGenerator(accounts);
        for (const row of rowGenerator) {
            tbody.appendChild(row);
        }

    } catch (e) {
        console.error("Error en la carga:", e);
    }
}


/**
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


       

