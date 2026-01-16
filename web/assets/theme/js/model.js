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

// 1. Clase Customer (Manejada principalmente por David en Login/Registro)
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
    constructor(id, description, balance, creditLine, beginBalance, beginBalanceTimestamp, type, customerId) {
        this.id = id;
        this.description = description;
        this.balance = parseFloat(balance) || 0;
        this.creditLine = parseFloat(creditLine) || 0;
        this.beginBalance = parseFloat(beginBalance) || 0;
        this.beginBalanceTimestamp = beginBalanceTimestamp;
        this.type = type; 
        this.customerId = customerId;
    }

    toJSON() {
        return {
            id: this.id,
            description: this.description,
            balance: this.balance,
            creditLine: this.creditLine,
            beginBalance: this.beginBalance,
            beginBalanceTimestamp: this.beginBalanceTimestamp,
            // Forzamos que el type sea siempre un número entero
            type: parseInt(this.type),
            // Estructura para la relación ManyToMany
            customers: [
                { id: parseInt(String(this.customerId).replace(/[,.]/g, "")) }
            ]
        };
    }
}





// 3. Clase Movement (Parte de Alex: WP2)
class Movement {
    constructor(id, amount, description, timestamp, balance, accountId) {
        this.id = id;
        this.amount = parseFloat(amount) || 0;
        this.description = description;
        this.timestamp = timestamp;
        this.balance = parseFloat(balance) || 0;
        this.accountId = accountId;
    }
}