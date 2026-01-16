const SERVICE_URL = "/CRUDBankServerSide/webresources/account/customer/";
const ACCOUNT_URL = "/CRUDBankServerSide/webresources/account/";

document.addEventListener("DOMContentLoaded", pageLoadHandler);

// 0. Obtener cuentas del servidor
async function fetchAccounts() {
    // IMPORTANTE: Limpiar el ID de comas (ej: "102,263" -> "102263")
    const customerId = sessionStorage.getItem("customer.id").replace(/[,.]/g, "");
    const response = await fetch(SERVICE_URL + customerId, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error("Error al obtener cuentas");
    return await response.json();
}

// 1. Generador de filas para la tabla (Sin cambios)
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

        tbody.onclick = async (event) => {
            if (event.target.classList.contains("btn-borrar")) {
                const id = event.target.getAttribute("data-id");
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
            // Generamos un ID más corto para evitar problemas con el Long de Java
            return Math.floor(Math.random() * 100000000); 
        }

        const capa = document.querySelector(".crear-cuenta-container");
        document.getElementById("btn-nueva-cuenta").onclick = () => capa.style.display = "flex";
        document.querySelector(".btn-cancel").onclick = () => {
            capa.style.display = "none";
            document.getElementById("formAccount").reset();
        };

        // BOTÓN GUARDAR (POST) - CORREGIDO
        document.querySelector(".btn-save").onclick = async () => {
            // Limpiar comas del ID del cliente
            const custIdRaw = sessionStorage.getItem("customer.id");
            const idLimpio = parseInt(custIdRaw.replace(/[,.]/g, ""));
            
            // Construimos el objeto exacto para la relación ManyToMany de Account.java
            const nuevaCuenta = {
                id: generateRandomAccountId(),
                description: document.getElementById("description").value,
                balance: parseFloat(document.getElementById("balance").value),
                creditLine: parseFloat(document.getElementById("type").value),
                beginBalance: parseFloat(document.getElementById("balance").value),
                beginBalanceTimestamp: new Date().toISOString().split('.')[0] + "Z",
                
                // CAMBIO CLAVE: "customers" en plural y dentro de una LISTA []
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
                // Esperamos un poquito para que a la base de datos le de tiempo
                setTimeout(pageLoadHandler, 300); 
            } else {
                alert("Error al crear. Revisa la consola de GlassFish.");
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


       

