const SERVICE_URL = "/CRUDBankServerSide/webresources/account/customer/";
const ACCOUNT_URL = "/CRUDBankServerSide/webresources/account/";

document.addEventListener("DOMContentLoaded", pageLoadHandler);

// 0. Obtener cuentas del servidor
async function fetchAccounts() {
    const customerId = sessionStorage.getItem("customer.id");
    const response = await fetch(SERVICE_URL + customerId, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
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

        // Botón Ver Movimientos
        const btnVer = document.createElement("button");
        btnVer.textContent = "Movimientos";
        btnVer.onclick = () => {
            sessionStorage.setItem("account.id", account.id);
            window.location.href = "mymovements.html";
        };
        tdAction.appendChild(btnVer);

        // Botón Borrar
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

        // --- DELEGACIÓN DE EVENTOS (BORRAR) ---
        tbody.onclick = async (event) => {
            if (event.target.classList.contains("btn-borrar")) {
                const id = event.target.getAttribute("data-id");
                if (confirm(`¿Eliminar cuenta ${id}?`)) {
                    const res = await fetch(ACCOUNT_URL + id, { method: "DELETE" });
                    if (res.ok) {
                        pageLoadHandler();
                    } else {
                        alert("Error: No se puede borrar una cuenta con movimientos (Integridad Referencial).");
                    }
                }
            }
        };

        // --- LÓGICA DEL FORMULARIO (CREAR) ---
        const capa = document.querySelector(".crear-cuenta-container");
        document.getElementById("btn-nueva-cuenta").onclick = () => capa.style.display = "flex";
        document.querySelector(".btn-cancel").onclick = () => {
            capa.style.display = "none";
            document.getElementById("formAccount").reset();
        };

        // BOTÓN GUARDAR (POST)
        document.querySelector(".btn-save").onclick = async () => {
            const custId = sessionStorage.getItem("customer.id");
            
            // Construimos el objeto exacto para Java JPA
            const nuevaCuenta = {
                description: document.getElementById("description").value,
                balance: parseFloat(document.getElementById("balance").value),
                creditLine: parseFloat(document.getElementById("type").value),
                beginBalanceTimestamp: new Date().toISOString(),
                customer: {
                    id: parseInt(custId) // Forzamos a que sea un número entero
                }
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
                pageLoadHandler(); // Recargamos la tabla
            } else {
                const errorTexto = await response.text();
                console.error("Detalle del error 500:", errorTexto);
                alert("Error 500 del servidor. Revisa que el ID del cliente sea correcto.");
            }
        };

        // Pintar la tabla
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


       

