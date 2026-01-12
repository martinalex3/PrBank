/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
const SERVICE_URL = "/CRUDBankServerSide/webresources/movement/account/";
/**LINEA PROVISIONAL**/
sessionStorage.setItem("account.id", 2654785441);
//Linea DOM
document.addEventListener("DOMContentLoaded", buildMovementsTable);
/*Fetch Users in JSON format*/
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
// Generador de funciones que recoge lineas de tabla
function* userRowGenerator(movements) {
    for (const movement of movements) {
        const tr = document.createElement("tr");
        
        ["id", "timestamp", "amount", "balance", "description"].forEach(field => {
            const td = document.createElement("td");
            td.textContent = movement[field];
            tr.appendChild(td);
        });
        
        yield tr;
    }
}

async function buildMovementsTable (){
    const movements = await fetchMovements();
    const tbody = document.querySelector("#tableBody");
    const rowGenerator = userRowGenerator(movements);
    for (const row of rowGenerator) {
        tbody.appendChild(row);
    }
}
