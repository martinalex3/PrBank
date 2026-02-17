/**
 * Lógica de Gestión de Cuentas - PrBank
 * Autores: David Aranda
 */
const SERVICE_URL = "/CRUDBankServerSide/webresources/account/customer/";
const ACCOUNT_URL = "/CRUDBankServerSide/webresources/account/";

var editMode = false;
var currentAccountData = null;

document.addEventListener("DOMContentLoaded", function() {
    displayUserData();
    pageLoadHandler();

    const formLayer = document.getElementById("formLayer");
    const formAccount = document.getElementById("formAccount");
    const typeSelect = document.getElementById("type");
    const creditContainer = document.getElementById("creditLineContainer");
    const creditInput = document.getElementById("creditLineInput");
    const balanceInput = document.getElementById("balance");

    // --- SECCIÓN: AYUDA (H5P) ---
    const helpBtn = document.querySelector(".help-link");
    const videoLayer = document.getElementById("videoLayer");
    const h5pContainer = document.getElementById("h5p-container");
    const btnCloseVideo = document.getElementById("btnCloseVideo");
    let h5pInstance = null;

    if (helpBtn) {
        helpBtn.onclick = function(e) {
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
    }

    if (btnCloseVideo) {
        btnCloseVideo.onclick = function() {
            videoLayer.style.display = "none";
            h5pContainer.innerHTML = ""; 
            h5pInstance = null;
        };
    }

    typeSelect.addEventListener("change", function() {
        if (typeSelect.value === "1000") {
            creditContainer.style.display = "block";
            creditInput.required = true;
        } else {
            creditContainer.style.display = "none";
            creditInput.required = false;
            creditInput.value = "";
        }
    });

    document.getElementById("btnNuevaCuenta").onclick = function() {
        editMode = false;
        currentAccountData = null;
        formAccount.reset();
        document.getElementById("newaccountTitle").textContent = "Create new account";
        typeSelect.disabled = false;
        balanceInput.disabled = false;
        creditContainer.style.display = "none";
        formLayer.style.display = "flex";
    };

    document.getElementById("btnClose").onclick = function() {
        formLayer.style.display = "none";
        formAccount.reset();
    };

    // ====================== ENVÍO (POST / PUT) =====================
    formAccount.onsubmit = async function(event) {
        event.preventDefault();

        const desc = document.getElementById("description").value;
        const esAmountRegex = /^(?:\d{1,15}|\d{1,3}(?:\.\d{3}){1,4})(?:,\d{1,2})?$/;

        if (!esAmountRegex.test(balanceInput.value)) {
            alert("Error: El balance inicial debe ser un número positivo.");
            return;
        }
        
        if (typeSelect.value === "1000" && !esAmountRegex.test(creditInput.value)) {
            alert("Error: La línea de crédito debe ser un número positivo.");
            return;
        }

        const bal = parseFloat(balanceInput.value.replace(',', '.')) || 0;
        let cLine = parseFloat(creditInput.value.replace(',', '.')) || 0;
        
        const rawCustId = sessionStorage.getItem("customer.id") || "0";
        const cleanCustId = rawCustId.toString().replace(/[^0-9]/g, "");

        let accountObj;

        if (editMode && currentAccountData) {
            let tipoActual = (currentAccountData.type == 1 || currentAccountData.type === "CREDIT") ? 1 : 0;
            
            accountObj = new Account(
                currentAccountData.id,
                desc,
                currentAccountData.balance,
                (tipoActual === 1) ? cLine : 0,
                currentAccountData.beginBalance,
                currentAccountData.beginBalanceTimestamp,
                tipoActual,
                cleanCustId
            );
        } else {
            let tValue = (typeSelect.value === "1000") ? 1 : 0;
            accountObj = new Account(
                Math.floor(Math.random() * 899999) + 100000,
                desc,
                bal,
                (tValue === 1) ? cLine : 0,
                bal,
                new Date().toISOString().split('.')[0] + "Z",
                tValue,
                cleanCustId
            );
        }

        let payload = accountObj.toJSON();
        payload.type = (accountObj.type == 1) ? "CREDIT" : "STANDARD";
        
        payload.customers = [{
            id: cleanCustId,
            firstName: sessionStorage.getItem("customer.firstName"),
            lastName: sessionStorage.getItem("customer.lastName"),
            middleInitial: sessionStorage.getItem("customer.middleInitial") || "",
            street: sessionStorage.getItem("customer.street") || "",
            city: sessionStorage.getItem("customer.city") || "",
            state: sessionStorage.getItem("customer.state") || "",
            zip: sessionStorage.getItem("customer.zip") || "",
            phone: sessionStorage.getItem("customer.phone") || "",
            email: sessionStorage.getItem("customer.email") || "",
            password: sessionStorage.getItem("customer.password") || ""
        }];

        try {
            const response = await fetch(ACCOUNT_URL, {
                method: editMode ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                formLayer.style.display = "none";
                pageLoadHandler();
            } else {
                alert("Error saving account");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        }
    };
});

// ==================== LÓGICA DE TABLA ========================

async function fetchAccounts() {
    const rawId = sessionStorage.getItem("customer.id") || "0";
    const customerId = rawId.toString().replace(/[^0-9]/g, "");
    const response = await fetch(SERVICE_URL + customerId + "?t=" + new Date().getTime(), {
        headers: { "Accept": "application/json" }
    });
    const data = await response.json();
    if (data && data.account) return Array.isArray(data.account) ? data.account : [data.account];
    return Array.isArray(data) ? data : [];
}

function* userRowGenerator(accounts) {
    for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i];
        const tr = document.createElement("tr");
        const esCredito = (acc.type === "CREDIT" || acc.type == 1);
        
        let numMovs = 0;
        if (acc.movement) {
            numMovs = Array.isArray(acc.movement) ? acc.movement.length : 1;
        } else if (acc.movements) { 
            numMovs = Array.isArray(acc.movements) ? acc.movements.length : 1;
        }

        tr.innerHTML = "<td>" + acc.id + "</td>" +
                       "<td>" + (acc.description || "") + "</td>" +
                       "<td>" + (esCredito ? "CREDIT" : "STANDARD") + "</td>" +
                       "<td>" + fmt(acc.creditLine) + "</td>" +
                       "<td>" + (acc.beginBalanceTimestamp ? new Date(acc.beginBalanceTimestamp).toLocaleDateString() : "---") + "</td>" +
                       "<td>" + fmt(acc.beginBalance) + "</td>" +
                       "<td>" + fmt(acc.balance) + "</td>" +
                       "<td class='acciones-celda' style='display:flex; gap:5px;'></td>";

        const tdAction = tr.querySelector(".acciones-celda");

        const btnMov = document.createElement("button");
        btnMov.className = 'movbutton';
        btnMov.textContent = "Movements";
        btnMov.onclick = function() {
            sessionStorage.setItem("account.id", acc.id);
            sessionStorage.setItem("account.balance", acc.balance);
            sessionStorage.setItem("account.creditLine", acc.creditLine || 0);
            window.location.href = "mymovements.html";
        };

        const btnEdit = document.createElement("button");
        btnEdit.className = 'movbutton';
        btnEdit.textContent = "Edit";
        btnEdit.onclick = function() {
            editMode = true;
            currentAccountData = acc;
            document.getElementById("newaccountTitle").textContent = "Edit Account " + acc.id;
            document.getElementById("description").value = acc.description;
            document.getElementById("balance").value = acc.balance;
            document.getElementById("balance").disabled = true;
            document.getElementById("type").value = esCredito ? "1000" : "0";
            document.getElementById("type").disabled = true;
            
            if (esCredito) {
                document.getElementById("creditLineContainer").style.display = "block";
                document.getElementById("creditLineInput").value = acc.creditLine;
            } else {
                document.getElementById("creditLineContainer").style.display = "none";
            }
            document.getElementById("formLayer").style.display = "flex";
        };

        const btnDel = document.createElement("button");
        btnDel.className = 'borbutton';
        btnDel.textContent = "Delete";
        // Pasamos el conteo real a la función de borrado
        btnDel.onclick = function() { deleteAccount(acc.id, numMovs); };

        tdAction.appendChild(btnMov);
        tdAction.appendChild(btnEdit);
        tdAction.appendChild(btnDel);
        yield tr;
    }
}

async function pageLoadHandler() {
    try {
        const accounts = await fetchAccounts();
        totalBalanceAccounts(accounts);
        const tbody = document.getElementById("tableBody");
        if (!tbody) return;
        tbody.innerHTML = "";
        const rowGen = userRowGenerator(accounts);
        
        let res = rowGen.next();
        while (!res.done) {
            tbody.appendChild(res.value);
            res = rowGen.next();
        }
    } catch (e) { console.error(e); }
}

/**
 * FIX: 
 * Función de borrado:
 * 1. Si hay movimientos (numMovs > 0), bloquea inmediatamente CON UN ALERT.
 * 2. NO llega al servidor si hay movimientos.
 * 3. Si no hay movimientos, pide confirmación antes del fetch.
 */
async function deleteAccount(id, numMovs) {
  // BLOQUEO 1: Si detectamos movimientos, cortamos en seco.
  if (numMovs > 0) {
    alert("No se puede enviar la solicitud: La cuenta " + id + " tiene movimientos.");
    return; // BLOQUEAMOS AQUI
  }

  // BLOQUEO 2: Confirmación del usuario (Llegamos aquí solo si numMovs == 0)
  if (confirm("La cuenta " + id + " está vacía. ¿Realmente quieres eliminarla?")) {
    try {
      const res = await fetch(ACCOUNT_URL + id, {
        method: "DELETE",
        headers: { "Accept": "application/json" }
      });

      if (res.ok) {
        pageLoadHandler();
      } else {
        // Si el servidor da error por otra razón ERROR 404
        alert("Error al eliminar: El servidor respondió con estado " + res.status);
      }
    } catch (err) {
      console.error("Error de red:", err);
      alert("Error de conexión con el servidor.");
    }
  }
}

// ==================== UTILIDADES ========================

function totalBalanceAccounts(accounts) {
    let total = 0;
    for (let i = 0; i < accounts.length; i++) {
        total += (parseFloat(accounts[i].balance) || 0);
    }
    const f = fmt(total);
    if (document.getElementById("totalBalanceTop")) document.getElementById("totalBalanceTop").textContent = f;
    if (document.getElementById("totalBalanceBottom")) document.getElementById("totalBalanceBottom").textContent = f;
}

function displayUserData() {
    const fn = sessionStorage.getItem("customer.firstName");
    const ln = sessionStorage.getItem("customer.lastName");
    const d = document.getElementById("userNameDisplay");
    if (d && fn) d.textContent = fn + " " + ln;
}

function fmt(v) { 
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v || 0); 
}