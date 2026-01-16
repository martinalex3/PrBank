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
/**LINEA PROVISIONAL**/
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
        document.getElementById("confirmLayer").style.display = "none"; // Cerramos
    });
    // BOTON NO, CANCELAR (Dentro del confirmLayer)
    document.getElementById("btnConfirmNo").addEventListener("click", () => {
        document.getElementById("confirmLayer").style.display = "none"; // Cerramos sin hacer nada
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

            // Si es la fecha y tiene contenido
            if (field === "timestamp" && value) {
                // Si el valor es "16-01-2026 12:00:50+01:00"
                // .substring(0, 16) corta justo después de los minutos
                // Resultado: "16-01-2026 12:00"
                value = value.substring(0, 16);
                
                // Por si acaso el servidor enviara una 'T' en lugar de espacio
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

    if (movements && movements.length > 0) {
        const lastMovement = movements[movements.length - 1];
        sessionStorage.setItem("account.balance", lastMovement.balance);
    }

    const rowGenerator = userRowGenerator(movements);
    for (const row of rowGenerator) {
        tbody.appendChild(row);
    }
}
//CREACIÓN DE MOVIMIENTOS (Crud)
/*Para crear un movimiento deberemos añadir un boton (ya puesto, en el que nos permita añadir movimientos de las cuentas, con una cuantia, en el que se
 * aumentará o se reducirá el balance dependiendo de si es un ingreso o una retirada, en la parte del html deberá aparecer una pantalla mostrando la
 * opcion de ingresar o retirar para despues sumar o restar el saldo que haya en dicha cuenta*/
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
        const tfAmount = document.getElementById("tfAmount");
        const rbDeposit = document.getElementById("rbDeposit");

        let description;
        let balance;
        
        let currentBalance = parseFloat(sessionStorage.getItem("account.balance")) || 0;
        let amountValue = parseFloat(tfAmount.value);

        if (rbDeposit.checked){ 
            description = "Deposit";
            balance = currentBalance + amountValue;
        } else { 
            description = "Payment";
            balance = currentBalance - amountValue;
        }        

        const newMovement = new Movement (
            null, 
            amountValue,
            description,
            new Date().toISOString(), 
            balance
        );

        const response = await fetch(SERVICE_DEL_URL + sessionStorage.getItem("account.id"), {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newMovement)
        });

        if (!response.ok) throw new Error("Error en servidor");

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
//Falta por añadir boton de confirmacion de borrado.
async function deleteMovement() {
    // Obtenemos el ID del último movimiento
    const movid = movements[movements.length - 1].id;

    const response = await fetch(SERVICE_DEL_URL + `${encodeURIComponent(movid)}`, {
        method: "DELETE"
    });

    if (response.ok) {
        document.querySelector("#tableBody").innerHTML = "";
        await buildMovementsTable();
    } else {
        console.error("No se pudo eliminar el movimiento");
    }
}
//ACTUALIZACION DE DATOS EN CUENTAS (crUd)