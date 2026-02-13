/**
 * ARCHIVO: SignUP.js
 * AUTOR: David Aranda 
 * DESCRIPCIÓN: Lógica de validación y envío de registro con accesibilidad.
 */

/**
 * CONSTRUCTOR: Define cómo es un "Customer" (Cliente). 
 * Es como una plantilla para crear objetos con todos sus datos.
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
 * FUNCIÓN DE APOYO: showFieldError
 * Sirve para avisar al usuario (y a Orca) si algo está mal.
 * @param {string} fieldId - El ID del input (ej: "tfName")
 * @param {string} message - El texto que queremos que lea el usuario.
 */
function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById("error-" + fieldId);
    
    if (message) {
        // SI HAY ERROR:
        // 1. Marcamos el campo como inválido para que Orca lo diga en voz alta.
        input.setAttribute("aria-invalid", "true");
        // 2. Pintamos el borde de rojo para que se vea a simple vista.
        input.style.borderColor = "#d32f2f";
        // 3. Escribimos el mensaje en el <span> correspondiente.
        if (errorSpan) errorSpan.textContent = message;
    } else {
        // SI NO HAY ERROR:
        // Limpiamos todo para que el campo vuelva a su estado normal.
        input.setAttribute("aria-invalid", "false");
        input.style.borderColor = ""; 
        if (errorSpan) errorSpan.textContent = "";
    }
}

/**
 * FUNCIÓN DE VALIDACIÓN: validateField
 * Se ejecuta cada vez que el usuario "sale" de un campo (onblur).
 * @param {string} id - El ID del campo que queremos revisar.
 */
function validateField(id) {
    const input = document.getElementById(id);
    const val = input.value.trim(); // Cogemos el texto sin espacios vacíos.

    // Primero miramos si el campo está vacío (excepto la inicial que puede ser opcional a veces)
    if (val === "" && id !== "tfMiddlelinitial") {
        showFieldError(id, "This field is required.");
        return false;
    }

    // Ahora aplicamos reglas especiales según el ID del campo
    switch(id) {
        case "tfZip":
            // Comprobamos que sean exactamente 5 números
            if (!/^\d{5}$/.test(val)) {
                showFieldError(id, "Zip Code must be 5 digits.");
                return false;
            }
            break;
        case "tfPhone":
            // Comprobamos que sean 9 números
            if (!/^\d{9}$/.test(val)) {
                showFieldError(id, "Phone must be 9 digits.");
                return false;
            }
            break;
        case "tfEmail":
            // Comprobamos que tenga un formato de correo real
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(val)) {
                showFieldError(id, "Please enter a valid email.");
                return false;
            }
            break;
        case "tfPassword":
            // La contraseña debe tener al menos 8 letras
            if (val.length < 8) {
                showFieldError(id, "Min. 8 characters.");
                return false;
            }
            break;
        case "rpassword":
            // Comparamos la segunda contraseña con la primera
            const passOriginal = document.getElementById("tfPassword").value;
            if (val !== passOriginal) {
                showFieldError(id, "Passwords do not match.");
                return false;
            }
            break;
        case "tfMiddlelinitial":
            // Solo dejamos escribir una letra en la inicial
            if (val.length > 1) {
                showFieldError(id, "Only 1 character allowed.");
                return false;
            }
            break;
    }

    // Si ha pasado por aquí sin retornar "false", es que todo está OK.
    showFieldError(id, null);
    return true;
}

/**
 * BOTÓN "Sign me Up!": handleSignUpClick
 * Repasa todo antes de enviar los datos al servidor.
 */
function handleSignUpClick(event) {
    event.preventDefault(); // Detenemos el envío automático del formulario.

    // Metemos todos los IDs en una lista para revisarlos todos a la vez.
    const allIds = [
        "tfName", "tfLastname", "tfMiddlelinitial", "tfStreet", 
        "tfCity", "tfState", "tfZip", "tfPhone", "tfEmail", 
        "tfPassword", "rpassword"
    ];
    
    let isAllOk = true;

    // Usamos un bucle para validar cada ID de la lista.
    allIds.forEach(id => {
        if (!validateField(id)) {
            isAllOk = false; // Si uno falla, el formulario no se envía.
        }
    });

    if (isAllOk) {
        // Si todo está correcto, disparamos la petición XML.
        sendRequestAndProcessResponse();
    } else {
        // Si hay errores, avisamos al usuario al final del formulario.
        const responseMsg = document.getElementById("responseMsg");
        responseMsg.textContent = "Please fix the red fields before submitting.";
        responseMsg.style.color = "red";
    }
}

/**
 * FUNCIÓN DE ENVÍO: sendRequestAndProcessResponse
 * Empaqueta los datos en XML y los manda al servidor (Backend).
 */
function sendRequestAndProcessResponse() {
    // Creamos el objeto Customer con lo que hay escrito en los inputs
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

    // Creamos el cuerpo del mensaje en formato XML
    const xmlBody = `
        <customer>
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

    // Hacemos la llamada al servidor
    const url = document.getElementById("signUpForm").action;
    
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlBody
    })
    .then(response => {
        if (response.ok) {
            alert("Registration successful!");
            window.location.href = 'signin.html';
        } else {
            throw new Error("Registration failed. Please try again.");
        }
    })
    .catch(error => {
        document.getElementById("responseMsg").textContent = error.message;
    });
}

/**
 * RESET: clearAllErrors
 * Limpia los bordes rojos si el usuario pulsa el botón de borrar.
 */
function clearAllErrors() {
    const allIds = ["tfName", "tfLastname", "tfMiddlelinitial", "tfStreet", "tfCity", "tfState", "tfZip", "tfPhone", "tfEmail", "tfPassword", "rpassword"];
    allIds.forEach(id => showFieldError(id, null));
}

/**
 * NAVEGACIÓN: redirectToIndex
 * Vuelve a la página principal.
 */
function redirectToIndex() {
    window.location.href = 'index.html';
}