/* * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
//ARRAY FECHAS CORRECTAS
const isoRegex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2})/;
//PATH PARAM DEL SERVIDOR
const SERVICE_URL = "/CRUDBankServerSide/webresources/movement/account/";
//PATH PARAM del DELETE de MOVIMIENTOS.
const SERVICE_DEL_URL = "/CRUDBankServerSide/webresources/movement/";
//ARRAY GLOBAL MOVEMENTS
let movements = [];
/**LINEA PROVISIONAL PARA HACER PRUEBAS DE MOVIMIENTOS**/
sessionStorage.setItem("account.id", 3252214522);
//LINEA DOM
document.addEventListener("DOMContentLoaded", () => {
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
//LEER TABLAS EN EL SERVIDOR (cRud)
/*FETCH MOVEMENTS IN JSON FORMAT*/
async function fetchMovements() {
    const response = await fetch(SERVICE_URL + `${sessionStorage.getItem("account.id")}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    return await response.json();
}
// GENERADOR DE FILAS CON FECHA FORMATEADA (Día-Mes-Año)
// GENERADOR DE FUNCIONES QUE RECOGEN LA INFORMACION PARA LA TABLA
function* userRowGenerator(movements) {
    for (const movement of movements) {
        const tr = document.createElement("tr");        
        ["timestamp", "description", "amount", "balance"].forEach(field => {
            const td = document.createElement("td");
            let value = movement[field];
            // SI ES LA FECHA Y TIENE CONTENIDO
            if (field === "timestamp" && value) {
                value = value.substring(0, 16);
                value = value.replace("T", " ");
            }
            td.textContent = value;
            tr.appendChild(td);
        });
        yield tr;
    }
}
//FUNCION DE CREAR TABLA DE MOVIMIENTOS
async function buildMovementsTable() {
    movements = await fetchMovements();
    const tbody = document.querySelector("#tableBody");
    tbody.innerHTML = ""; 
    // CREACION DE TABLAS DE MOVIMIENTO EN BASE A LOS MOVIMIENTOS DE LAS CUENTAS
    if (movements && movements.length > 0) {
        const lastMovement = movements[movements.length - 1];
        sessionStorage.setItem("account.balance", lastMovement.balance);
    }
    // GENERAR LAS FILAS DE LA TABLA
    const rowGenerator = userRowGenerator(movements);
    for (const row of rowGenerator) {
        tbody.appendChild(row);
    }
}
//CREACIÓN DE MOVIMIENTOS (Crud)
/*async function createMovement() {
    try {
        // Mirar que tipo de movimiento ha sido seleccionado.
        let description;
        let balance;
        document.getElementById("tfAmount.value");
        if (rbDeposit.checked){ 
            description="Deposit";
            balance = parseInt(sessionStorage.getItem("account.balance")) + tfAmount.value;
        } else { 
            description="Payment";
            balance = sessionStorage.getItem("account.balance") - tfAmount.value;
        }
        
        //Calcular el saldo de la cuenta actualizado.
        
        const newMovement = new Movement (
                0,
                tfAmount.value,
                description,
                new Date().toISOString(),
                balance
                )
        const response = await fetch(SERVICE_DEL_URL + `${sessionStorage.getItem("account.id")}`, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newMovement)
        });
        if (!response.ok) {
            throw new Error("Error al crear el movimiento");
        }
        // SE LIMPIA LA TABLA Y SE RECARGA
        document.querySelector("#tableBody").innerHTML = "";
        await buildMovementsTable();
    } catch (error) {
        console.error("ERROR AL CREAR MOVIMIENTO:", error);
    }
}*/
async function createMovement(evt) {
    evt.preventDefault(); 
    try {
        // MIRAR QUE TIPO DE MOVIMIENTO HA SIDO SELECCIONADO
        const tfAmount = document.getElementById("tfAmount");
        const rbDeposit = document.getElementById("rbDeposit");
        // CREAMOS ARRAYS PARA LA DESCRIPCION (DEPOSIT/PAYMENT) Y BALANCE (SALDO)
        let description;
        let balance;
        // GUARDAMOS EN EL ALMACENAMIENTO DE SESION EL BALANCE DE LA CUENTA
        let currentBalance = parseFloat(sessionStorage.getItem("account.balance")) || 0;
        let amountValue = parseFloat(tfAmount.value);
        // IF PARA DETERMINAR SI SE SUMA O SE RESTA EL BALANCE CON EL MOVIMIENTO
        if (rbDeposit.checked){ 
            description = "Deposit";
            balance = currentBalance + amountValue;
        } else { 
            description = "Payment";
            balance = currentBalance - amountValue;
        }        
        // CALCULAR EL SALDO DE LA CUENTA ACTUALIZADO.
        const newMovement = new Movement (
            null, 
            amountValue,
            description,
            new Date().toISOString(), 
            balance
        );
        // FETCH DE CREACION DE MOVIMIENTO CON POST
        const response = await fetch(SERVICE_DEL_URL + sessionStorage.getItem("account.id"), {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newMovement)
        });
        if (!response.ok) throw new Error("Error en servidor");
        // SE LIMPIA LA TABLA Y SE RECARGA
        sessionStorage.setItem("account.balance", balance);
        document.querySelector("#tableBody").innerHTML = "";
        await buildMovementsTable();        

        document.getElementById("formLayer").style.display = "none";
        document.getElementById("formAccount").reset();
    } catch (error) {
        console.error("ERROR:", error);
    }
}
//BORRADO DE MOVIMIENTOS (cruD)
async function deleteMovement() {
    // OBTENEMOS EL ID DEL ULTIMO MOVIMIENTO (EL MAS RECIENTE)
    const movid = movements[movements.length - 1].id;
    // FETCH DE ELIMINAR MOVIMIENTO CON DELETE
    const response = await fetch(SERVICE_DEL_URL + `${encodeURIComponent(movid)}`, {
        method: "DELETE"
    });
    // CONFIRMACION O NEGACION DE BORRADO
    if (response.ok) {
        document.querySelector("#tableBody").innerHTML = "";
        await buildMovementsTable();
    } else {
        console.error("No se pudo eliminar el movimiento");
    }
}
//ACTUALIZACION DE DATOS EN CUENTAS (crUd)
