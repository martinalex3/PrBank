/**
 * Lógica de validación y envío de registro - PrBank
 * @author David Aranda
 */

/**
 * Representa a un cliente del banco.
 * @constructor
 */
function Customer(id, firstName, lastName, middleInitial, street, city, state, zip, phone, email, password) {
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

/**
 * Gestiona la visualización de errores en los campos del formulario.
 * @param {string} fieldId - ID del elemento input.
 * @param {string|null} message - Mensaje de error o null para limpiar.
 */
function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById("error-" + fieldId);
    if (message) {
        input.setAttribute("aria-invalid", "true");
        input.style.borderColor = "#d32f2f";
        errorSpan.textContent = message;
    } else {
        input.setAttribute("aria-invalid", "false");
        input.style.borderColor = "";
        errorSpan.textContent = "";
    }
}

/**
 * Ejecuta reglas de validación sobre un campo específico.
 * @param {string} id - ID del campo a validar.
 * @returns {boolean} True si es válido, False en caso contrario.
 */
function validateField(id) {
    const value = document.getElementById(id).value.trim();
    
    // Validación de Email
    if (id === "tfEmail") {
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(value)) {
            showFieldError(id, "Please enter a valid email.");
            return false;
        }
    } 
    // Validación de Teléfono
    else if (id === "tfPhone") {
        const regexPhone = /^[0-9]{9,11}$/; // Acepta entre 9 y 11 dígitos numéricos
        if (!regexPhone.test(value)) {
            showFieldError(id, "Phone must be between 9 and 11 numbers.");
            return false;
        }
    }
    // Validación de repetir contraseña
    else if (id === "rpassword") {
        const pass = document.getElementById("tfPassword").value;
        if (value !== pass) {
            showFieldError(id, "Passwords do not match.");
            return false;
        }
    } 
    // Validación de Código Postal
    else if (id === "tfZip") {
        if (value.length < 5) {
            showFieldError(id, "Zip code is too short.");
            return false;
        }
    } 
    // Validación de campos obligatorios generales
    else {
        if (value === "" && id !== "tfMiddlelinitial") {
            showFieldError(id, "This field is required.");
            return false;
        }
    }
    
    showFieldError(id, null);
    return true;
}

/**
 * Procesa el registro del usuario, validando y enviando XML al servidor.
 * @param {Event} event - Evento de click.
 */
function handleSignUpClick(event) {
    event.preventDefault();

    const ids = ["tfName", "tfLastname", "tfStreet", "tfCity", "tfState", "tfZip", "tfPhone", "tfEmail", "tfPassword", "rpassword"];
    let isFormValid = true;

    ids.forEach(function(id) {
        if (!validateField(id)) {
            isFormValid = false;
        }
    });

    if (!isFormValid) {
        alert("Please correct the errors before submitting.");
        return;
    }

    const customer = new Customer(
        0,
        document.getElementById("tfName").value,
        document.getElementById("tfLastname").value,
        document.getElementById("tfMiddlelinitial").value,
        document.getElementById("tfStreet").value,
        document.getElementById("tfCity").value,
        document.getElementById("tfState").value,
        document.getElementById("tfZip").value,
        document.getElementById("tfPhone").value,
        document.getElementById("tfEmail").value,
        document.getElementById("tfPassword").value
    );

    const xmlBody = `
        <customer>
            <id>0</id>
            <firstName>${customer.firstName}</firstName>
            <lastName>${customer.lastName}</lastName>
            <middleInitial>${customer.middleInitial}</middleInitial>
            <street>${customer.street}</street>
            <city>${customer.city}</city>
            <state>${customer.state}</state>
            <zip>${customer.zip}</zip>
            <phone>${customer.phone}</phone>
            <email>${customer.email}</email>
            <password>${customer.password}</password>
        </customer>`.trim();

    const url = document.getElementById("signUpForm").action;
    
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlBody
    })
    .then(function(response) {
        if (response.ok) {
            alert("Registration successful!");
            window.location.href = 'signin.html';
        } else {
            throw new Error("Registration failed.");
        }
    })
    .catch(function(error) {
        document.getElementById("responseMsg").textContent = error.message;
    });
}

/**
 * Limpia todos los estados de error del formulario.
 */
function clearAllErrors() {
    const allIds = ["tfName", "tfLastname", "tfMiddlelinitial", "tfStreet", "tfCity", "tfState", "tfZip", "tfPhone", "tfEmail", "tfPassword", "rpassword"];
    allIds.forEach(function(id) {
        showFieldError(id, null);
    });
}

/**
 * Redirige a la página principal.
 */
function redirectToIndex() {
    window.location.href = "index.html";
}