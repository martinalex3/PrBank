/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
const regexBasica = /^(\d{2})\/(\d{2})\/(\d{4})$/;

//LEER TABLAS EN EL SERVIDOR (cRud)
//PATH PARAM DEL SERVIDOR
const SERVICE_URL = "/CRUDBankServerSide/webresources/movement/account/";
/**LINEA PROVISIONAL**/
sessionStorage.setItem("account.id", 2654785441);
//LINEA DOM
document.addEventListener("DOMContentLoaded", buildMovementsTable);
/*FETCH MOVEMENTS IN JSON FORMAT*/
async function fetchMovements() {
    const response = await fetch(SERVICE_URL + `${sessionStorage.getItem("account.id")}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });
    const jsonText = await response.json();
    return jsonText;
}
// GENERADOR DE FUNCIONES QUE RECOGEN LA INFORMACION PARA LA TABLA
function* userRowGenerator(movements) {
    for (const movement of movements) {
        const tr = document.createElement("tr");
        
        ["timestamp", "description", "amount", "balance"].forEach(field => {
            const td = document.createElement("td");
            td.textContent = movement[field];
            tr.appendChild(td);
        });
        
        yield tr;
    }
}
//FUNCION DE CREAR TABLA DE MOVIMIENTOS
async function buildMovementsTable (){
    const movements = await fetchMovements();
    const tbody = document.querySelector("#tableBody");
    const rowGenerator = userRowGenerator(movements);
    for (const row of rowGenerator) {
        tbody.appendChild(row);
    }
}
//CREACIÓN DE MOVIMIENTOS (Crud)
/*Para crear un movimiento deberemos añadir un boton (ya puesto, en el que nos permita añadir movimientos de las cuentas, con una cuantia, en el que se
 * aumentará o se reducirá el balance dependiendo de si es un ingreso o una retirada, en la parte del html deberá aparecer una pantalla mostrando la
 * opcion de ingresar o retirar para despues sumar o restar el saldo que haya en dicha cuenta*/
function createMovement() {
    
}
//ELIMINACION DE MOVIMIENTOS (cruD)
/*Para la eliminacion de los datos, es muy importante crear un boton fuera de la tabla, para que sea mas facil para el usuario, y solo se podrá
 * borrar/deshacer el ultimo movimiento. Para ello podemos meter un metodo manejador en el cual debemos  poner el array fuera de la funcion y podremos
 * eliminarlo con un delete, pero solo el ultimo movimeinto, que se cogera mediante el ID mas largo, o la fecha mas reciente.*/
function deleteMovement() {
    
}
//ACTUALIZACION DE DATOS EN CUENTAS (crUd)
