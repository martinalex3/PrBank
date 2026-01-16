/*
 * MODELO DE DATOS COMÚN (WP1, WP2, WP3)
 * Archivo: model.js
 */
/**

 */

/*
 * Archivo: model.js
 * Descripción: Clases de datos comunes para la aplicación bancaria.
 */

// 1. Clase Customer (Kenneth: WP3)
class Customer {
    constructor(id, firstName, lastName, middleInitial, street, city, state, zip, phone, email, password) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.middleInitial = middleInitial;
        this.street = street;
        this.city = city;
        this.state = state;
        this.zip = zip;
        this.phone = phone;
        this.email = email;
        this.password = password;
    }
}

// 2. Clase Account (David: WP1)
class Account {
    /**
     * @param {string|number} type - Puede venir como "STANDARD"/"CREDIT" o 0/1
     */
    constructor(id, description, balance, creditLine, beginBalance, beginBalanceTimestamp, type, customerId) {
        this.id = id;
        this.description = description;
        
        // Forzamos que los números sean números para que .toFixed(2) no falle
        this.balance = parseFloat(balance) || 0;
        this.creditLine = parseFloat(creditLine) || 0;
        this.beginBalance = parseFloat(beginBalance) || 0;
        
        this.beginBalanceTimestamp = beginBalanceTimestamp;
        
        // Guardamos el tipo tal cual viene del servidor para procesarlo en la tabla
        this.type = type; 
        this.customerId = customerId;
    }
}

// 3. Clase Movement (Parte de Alex: WP2)
class Movement {
    id;
    amount;
    description;
    timestamp;
    balance;
            
    constructor(id, amount, description, timestamp, balance) {
        this.id = id;
        this.amount = parseFloat(amount) || 0;
        this.description = description;
        this.timestamp = timestamp;
        this.balance = parseFloat(balance) || 0;
    }
    toJSON(){
        return {
            id: this.id,
            amount: this.amount,
            description: this.description,
            timestamp: this.timestamp,
            balance: this.balance
        };
    }
}