/**
 * Constructor del objeto Customer, que define la estructura esperada por el servidor
 * y utilizada para la deserialización XML. 
 */
function Customer( id,
                    firstName,
                    lastName,
                    middleInitial,
                    street,
                    city,
                    state,
                    zip,
                    phone,
                    email,
                    password) {
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
// ------------------------------------------

// --- DEFINICIÓN DE ERROR PERSONALIZADO ---

/**
 * Crea un objeto de error para el caso específico de un código 500 que
 * en realidad es un registro exitoso (mala práctica del servidor).
 */
function ServerSuccess500Error(message) {
    const error = new Error(message);
    error.name = 'ServerSuccess500Error';
    return error;
}

// ------------------------------------------

// --- FUNCIÓN PRINCIPAL DE PETICIÓN ---

/**
 * Crea una solicitud POST con datos en formato XML y procesa las respuestas HTTP.
 * @returns {undefined}
 */
function sendRequestAndProcessResponse() {
    const signUpForm = document.getElementById("signUpForm");
    
    // 1. Recolección de datos y creación del objeto Customer
    // (Utilizando el constructor 'new Customer' siguiendo la rúbrica)
    const customer = new Customer(
        0, // El ID se deja en 0/null para el registro, el servidor lo asigna sólo.
        document.getElementById("tfName").value.trim(),
        document.getElementById("tfLastname").value.trim(),
        document.getElementById("tfMiddlelinitial").value.trim(),
        document.getElementById("tfStreet").value.trim(),
        document.getElementById("tfCity").value.trim(),
        document.getElementById("tfState").value.trim(),
        document.getElementById("tfZip").value.trim(),
        document.getElementById("tfPhone").value.trim(),
        document.getElementById("tfEmail").value.trim(),
        document.getElementById("tfPassword").value.trim()
    );
    
    // 2. Construcción XML (Usando las propiedades del objeto Customer)
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

    // 3. Realizamos la petición POST
    fetch(signUpForm.action, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/xml'
        },
        body: xmlBody
    })
    
    .then(response => {
        // Manejo de códigos de estado HTTP
        if (response.status >= 200 && response.status < 300) {
            return response.text(); 
        } else if (response.status === 500){
            throw ServerSuccess500Error('500 - Registro completado, pero el servidor devolvió un error.');
        } else if (response.status === 403){
            throw new Error('403 - El usuario introducido ya existe.');
        } else {
            throw new Error('Ha ocurrido un error inesperado (Código: ' + response.status + '). Contacte al administrador.');
        }
    })
    .then(data => {
        handleSuccessfulRegistration(data);
    })
    .catch(error => {
        // Manejo de error 500 simulado como éxito
        if (error.name === 'ServerSuccess500Error') {
            console.warn("Manejo Especial: Error 500 detectado como registro exitoso.");
            handleSuccessfulRegistration("Respuesta 500 asumida como éxito.");
        } else {
            console.error("Fallo final en la promesa:", error); 
            const msgBox = document.getElementById("responseMsg");
            msgBox.className = 'error';
            msgBox.textContent = 'Error: ' + error.message;
            msgBox.style.display = 'block';
        }
    });
}

// --- FUNCIONES AUXILIARES ---

/**
 * Lógica común de manejo de registro exitoso (mensaje y redirección).
 * @param {string} data - El cuerpo de la respuesta o un mensaje.
 */
function handleSuccessfulRegistration(data = "Datos no disponibles") {
    console.log("¡Éxito de Registro! Datos de respuesta:", data);

    const msgBox = document.getElementById("responseMsg");
    msgBox.className = 'success';
    msgBox.textContent = 'Usuario registrado con éxito.';
    msgBox.style.display = 'block';

    setTimeout(() => {
        console.log("Redirigiendo a page2.html...");
        window.location.href = 'page2.html'; 
    }, 1500);

    document.getElementById("signUpForm").reset(); 
}

/**
 * Función para mostrar un error en la caja de mensajes
 * @param {string} message - El mensaje de error
 */
function displayError(message) {
    const msgBox = document.getElementById("responseMsg");
    msgBox.className = 'error';
    msgBox.textContent = 'Error: ' + message;
    msgBox.style.display = 'block';
}

/**
 * Funcion para limpiar la caja de mensajes
 */
function clearMessage() {
    const msgBox = document.getElementById("responseMsg");
    if (msgBox) {
        msgBox.style.display = 'none';
        msgBox.className = '';
        msgBox.textContent = '';
    }
}

// --- VALIDACIONES POR PÉRDIDA DE FOCO (ONBLUR) ---
// Funciones de validación para ser llamadas desde el HTML y desde handleSignUpClick.

function handleNameOnBlur(event) {
    try {
        const tfName = document.getElementById("tfName"); 
        const nombreRegExp = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,255}$/;
        event.preventDefault(); event.stopPropagation();
        clearMessage();
        if (tfName.value.trim() === "")
            throw new Error("El campo **Nombre** debe estar informado.");
        if (!nombreRegExp.test(tfName.value.trim()))
            throw new Error("El campo **Nombre** no tiene un formato válido (solo letras y espacios, 2-255 caracteres).");
        return true; 
    } catch (error) { 
        displayError(error.message); 
        return false; 
    }
}
function handleLastnameOnBlur(event) {
    try {
        const tfSurname = document.getElementById("tfLastname"); 
        const apellidoRegExp = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,255}$/;
        event.preventDefault(); event.stopPropagation();
        clearMessage();
        if (tfSurname.value.trim() === "")
            throw new Error("El campo **Apellido** debe estar informado.");
        if (!apellidoRegExp.test(tfSurname.value.trim()))
            throw new Error("El campo **Apellido** no tiene un formato válido (solo letras y espacios, 2-255 caracteres).");
        return true; 
    } catch (error) { 
        displayError(error.message); 
        return false; 
    }
}
function handleInitialOnBlur(event) {
    try {
        const tfInicial = document.getElementById("tfMiddlelinitial"); 
        const inicialRegExp = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.]{1,2}$/;
        event.preventDefault(); event.stopPropagation();
        clearMessage();
        if (tfInicial.value.trim() === "")
            throw new Error("El campo **Inicial Primer Apellido** debe estar informado.");
        if (!inicialRegExp.test(tfInicial.value.trim()))
            throw new Error("La **inicial** debe ser una o dos letras/puntos.");
        return true; 
    } catch (error) { 
        displayError(error.message); 
        return false; 
    }
}
function handleStreetOnBlur(event) {
    try {
        const tfCalle = document.getElementById("tfStreet"); 
        const calleRegExp = /^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s.,'\-]{2,255}$/; 
        event.preventDefault(); event.stopPropagation();
        clearMessage();
        if (tfCalle.value.trim() === "")
            throw new Error("El campo **Calle** debe estar informado.");
        if (!calleRegExp.test(tfCalle.value.trim()))
            throw new Error("El campo **Calle** no tiene un formato válido (2-255 caracteres).");
        return true; 
    } catch (error) { 
        displayError(error.message); 
        return false; 
    }
}
function handleCityOnBlur(event) {
    try {
        const tfCiudad = document.getElementById("tfCity"); 
        const ciudadRegExp = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,255}$/; 
        event.preventDefault(); event.stopPropagation();
        clearMessage();
        if (tfCiudad.value.trim() === "")
            throw new Error("El campo **Ciudad** debe estar informado.");
        if (!ciudadRegExp.test(tfCiudad.value.trim()))
            throw new Error("El campo **Ciudad** no tiene un formato válido (solo letras y espacios, 2-255 caracteres).");
        return true; 
    } catch (error) { 
        displayError(error.message); 
        return false; 
    }
}
function handleStateOnBlur(event) {
    try {
        const tfPais = document.getElementById("tfState"); 
        const paisRegExp = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,255}$/; 
        event.preventDefault(); event.stopPropagation();
        clearMessage();
        if (tfPais.value.trim() === "")
            throw new Error("El campo **País** debe estar informado.");
        if (!paisRegExp.test(tfPais.value.trim()))
            throw new Error("El campo **País** no tiene un formato válido (solo letras y espacios, 2-255 caracteres).");
        return true; 
    } catch (error) { 
        displayError(error.message); 
        return false; 
    }
}
function handleZipOnBlur(event) {
    try {
        const tfCodpostal = document.getElementById("tfZip"); 
        const codpostalRegExp = /^\d{5}$/; 
        event.preventDefault(); event.stopPropagation();
        clearMessage();
        if (tfCodpostal.value.trim() === "")
            throw new Error("El campo **Código Postal** debe estar informado.");
        if (!codpostalRegExp.test(tfCodpostal.value.trim()))
            throw new Error("El campo **Código Postal** no tiene un formato válido (mínimo 3 caracteres, sólo números).");
        return true; 
    } catch (error) { 
        displayError(error.message); 
        return false; 
    }
}
function handlePhoneOnBlur(event) {
    try {
        const tfTelf = document.getElementById("tfPhone"); 
        const telfRegExp = /^\d{9}$/; 
        event.preventDefault(); event.stopPropagation();
        clearMessage();
        if (tfTelf.value.trim() === "")
            throw new Error("El campo **Teléfono** debe estar informado.");
        if (!telfRegExp.test(tfTelf.value.trim()))
            throw new Error("El **Teléfono** debe ser de exactamente 9 dígitos.");
        return true; 
    } catch (error) { 
        displayError(error.message); 
        return false; 
    }
}
function handleEmailOnBlur(event) {
    try {
        const tfEmail = document.getElementById("tfEmail"); 
        const emailRegExp = /^[a-zA-Z0-9._%+-áéíóúÁÉÍÓÚñÑ]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; 
        event.preventDefault(); event.stopPropagation();
        clearMessage();
        if (tfEmail.value.trim() === "")
            throw new Error("El campo **Correo Electrónico** debe estar informado.");
        if (!emailRegExp.test(tfEmail.value.trim()))
            throw new Error("El **Correo Electrónico** no tiene un formato válido.");
        return true; 
    } catch (error) { 
        displayError(error.message); 
        return false; 
    }
}
function handlePasswordOnBlur(event) {
    try {
        const tfPassword = document.getElementById("tfPassword"); 
        const passwordRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,255}$/;
        event.preventDefault(); event.stopPropagation();
        clearMessage();
        if (tfPassword.value === "")
            throw new Error("El campo **Contraseña** debe estar informado.");
        if (!passwordRegExp.test(tfPassword.value))
            throw new Error("La **Contraseña** no es válida: min. 8 caracteres, 1 mayús, 1 minús, 1 número, 1 car. especial.");
        // Validamos la repetición para actualizar el mensaje de error si aplica.
        handleRepeatPasswordOnBlur({ preventDefault: () => {}, stopPropagation: () => {} });
        return true; 
    } catch (error) { 
        displayError(error.message); 
        return false; 
    }
}
function handleRepeatPasswordOnBlur(event) {
    try {
        const tfPassword = document.getElementById("tfPassword"); 
        const tfRPassword = document.getElementById("rpassword");
        event.preventDefault(); event.stopPropagation();
        clearMessage();
        if (tfRPassword.value === "")
            throw new Error("Debe **repetir la contraseña**.");
        if (tfPassword.value !== tfRPassword.value)
            throw new Error("Las **contraseñas no coinciden**.");
        return true; 
    } catch (error) { 
        displayError(error.message); 
        return false; 
    }
}

// --- VALIDACIÓN Y ENVÍO DEL FORMULARIO ---

/**
 * Ejecuta todas las validaciones y, si todas son correctas, realiza la petición.
 * @param {Event} event - El evento de clic. 
 */
function handleSignUpClick(event) {
    event.preventDefault();
    event.stopPropagation();
    clearMessage(); 
    
    try {
        // Ejecutamos TODAS las validaciones encadenadas
        if (!handleNameOnBlur(event)) throw new Error("Error en el campo Nombre.");
        if (!handleLastnameOnBlur(event)) throw new Error("Error en el campo Apellido.");
        if (!handleInitialOnBlur(event)) throw new Error("Error en el campo Inicial.");
        if (!handleStreetOnBlur(event)) throw new Error("Error en el campo Calle.");
        if (!handleCityOnBlur(event)) throw new Error("Error en el campo Ciudad.");
        if (!handleStateOnBlur(event)) throw new Error("Error en el campo País.");
        if (!handleZipOnBlur(event)) throw new Error("Error en el campo Código Postal.");
        if (!handlePhoneOnBlur(event)) throw new Error("Error en el campo Teléfono.");
        if (!handleEmailOnBlur(event)) throw new Error("Error en el campo Correo Electrónico.");
        if (!handlePasswordOnBlur(event)) throw new Error("Error en la Contraseña."); 
        // Se llama explícitamente de nuevo por si solo se pulsó el botón de registro
        if (!handleRepeatPasswordOnBlur(event)) throw new Error("Error en la repetición de Contraseña.");

        // Si todas las validaciones pasan, se procede al envío
        sendRequestAndProcessResponse();

    } catch (validationError) {
        // El mensaje específico del campo ya fue mostrado por la última función de validación que falló.
        displayError("Por favor, revise y corrija todos los campos del formulario antes de continuar.");
    }
}

/* Redirige al index*/
function redirectToIndex(event) {
    window.location.href = 'index.html';
}

/* Asignamos la lógica de estilos al cargar la página.*/
window.onload = function(){
    
    // Solo necesitamos llamar a loadSavedStyle al cargar la página para que aplique el estilo guardado.
    loadSavedStyle(); 

};

/* --- CAMBIO DE ESTILOS ---

/**
 * Carga el estilo guardado en localStorage o activa el Estilo Claro por defecto.
 */
function loadSavedStyle() {
    const savedStyleTitle = localStorage.getItem('activeStyle') || "Estilo Claro";
    const allStyles = document.getElementsByTagName('link'); 
    const switcherButton = document.getElementById("styleSwitcherBtn");
    
    let isStyleSet = false;

    // Recorre todos los elementos <link>
    for (let i = 0; i < allStyles.length; i++) {
        const link = allStyles[i];

        // Solo procesa los que tienen atributo 'title'
        if (link.getAttribute('title')) {
            if (link.title === savedStyleTitle) {
                link.disabled = false; // Habilitar el estilo guardado
                if (switcherButton) {
                    switcherButton.textContent = "Cambiar Estilo: " + savedStyleTitle;
                    isStyleSet = true;
                }
            } else {
                link.disabled = true; // Deshabilitar otros estilos
            }
        }
    }
    
    // Si el botón está en el estado inicial nos aseuramos de que muestre el estilo por defecto
    if (!isStyleSet && switcherButton && switcherButton.textContent === 'Cargando tu Estilo...') {
        switcherButton.textContent = "Cambiar Estilo: Estilo Claro";
    }
}

/**
 * Cambia al siguiente estilo de la lista y lo guarda en localStorage.
 */
function switchStyle() {
    const allStyles = document.getElementsByTagName('link');
    const switcherButton = document.getElementById("styleSwitcherBtn");
    
    let styleLinks = [];
    let activeIndex = -1;

    // 1. Crear una lista de solo los links con título y encontrar el índice activo
    for (let i = 0; i < allStyles.length; i++) {
        const link = allStyles[i];
        if (link.getAttribute('title')) {
            styleLinks.push(link);
            if (!link.disabled) {
                activeIndex = styleLinks.length - 1;
            }
        }
    }

    if (styleLinks.length === 0) {
        console.warn("No se encontraron estilos alternativos con atributo 'title'.");
        return;
    }

    // 2. Calcular el siguiente índice
    const nextIndex = (activeIndex + 1) % styleLinks.length;
    const nextStyle = styleLinks[nextIndex];

    // 3. Deshabilitar todos los estilos y habilitar el siguiente (usando bucle for)
    for (let i = 0; i < styleLinks.length; i++) {
        styleLinks[i].disabled = true;
    }

    if (nextStyle) {
        nextStyle.disabled = false;
        const nextTitle = nextStyle.title;
        if (switcherButton) {
             switcherButton.textContent = "Cambiar Estilo: " + nextTitle;
        }
        localStorage.setItem('activeStyle', nextTitle);
    }
};

