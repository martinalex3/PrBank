function Customer(
    id,
    firstName,
    lastName,
    middleInitial,
    street,
    city,
    state,
    zip,
    phone,
    email,
    password
) {
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
// Función principal de sign in
function handleSignInOnClick(event) {
    try {
        const tfEmail = document.getElementById("tfEmail");
        const tfPassword = document.getElementById("tfPassword");
        const signInForm = document.getElementById("signInForm");

        const emailRegExp = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

        event.preventDefault();
        event.stopPropagation();

        if (tfEmail.value.trim() === "" || tfPassword.value.trim() === "")
            throw new Error("The email and password fields must be filled.");
        if (tfEmail.value.length > 255)
            throw new Error("Email cannot have more than 255 characters.");
        if (tfPassword.value.length > 255)
            throw new Error("password cannot have more than 255 characters.");

        if (!emailRegExp.exec(tfEmail.value.trim()))
            throw new Error("Email does not have a coorect format, please try again.");

        sendSignInRequestAndProcessResponse();
    } catch (error) {
        const msgBox = document.getElementById("responseMsg");
        msgBox.className = 'error';
        msgBox.textContent = 'Error: ' + error.message;
        msgBox.style.display = 'block';
    }
}
// Petición al servidor y procesamiento de respuesta XML
function sendSignInRequestAndProcessResponse() {
    const signInForm = document.getElementById("signInForm");
    const msgBox = document.getElementById("responseMsg");
    const tfEmail = document.getElementById("tfEmail");
    const tfPassword = document.getElementById("tfPassword");

    const valueTfEmail = tfEmail.value.trim();
    const valueTfPassword = tfPassword.value.trim();

    fetch(signInForm.action + `${encodeURIComponent(valueTfEmail)}/${encodeURIComponent(valueTfPassword)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/xml', 'Accept': 'application/xml' }
    })
    //Procesamiento de errores
    .then(response => {
        if (response.status === 401) {
            return response.text().then(() => {
                throw new Error('Wrong credentials, please, try again.');
            });
        } else if (response.status === 500) {
            return response.text().then(() => {
                throw new Error('Server fail! Please try again.');
            });
        } else if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || 'Unexpected error occured!');
            });
        }
        return response.text(); // Se devuleve el XML como string
    })
    //Procesamiento de inicio de sesion OK(200)
    .then(xmlString => {
        msgBox.className = 'success';
        msgBox.textContent = 'User signed in succesfully! Redirecting...';
        msgBox.style.display = 'block';

        // Guardar datos en sessionStorage
        storeResponseXMLData(xmlString);
        // Redirigir automáticamente a la pagina sguiente en caso de todo OK
        setTimeout(() => {
            window.location.href = 'mymain.html';
        }, 1000);
    })
    //Recogida de errores
    .catch(error => {
        msgBox.className = 'error';
        msgBox.textContent = 'Error: ' + error.message;
        msgBox.style.display = 'block';
    });
}

// --- LÓGICA DE CARGA EN principalpr.html ---
function handleCancelOnClick() {
    window.location.href = 'index.html';
}
window.addEventListener('load', function() {
    if (document.getElementById('userNameDisplay')) {
        loadUserName();
    }
});
//--Funcion Volver al SignUp Boton
function handleBackOnClick() {
    window.location.href = 'signup.html';
}

//GetElementsByTagName
const body = document.getElementsByTagName('body');
for (let i = 0; i < body.length; i++) {
  body[i].style.fontSize = '1.5rem';
}

// Guardamos los datos en XML Session storage
function storeResponseXMLData(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    const get = (tag) => {
        const el = xmlDoc.getElementsByTagName(tag)[0];
        return el ? el.textContent : "";
    };

    const customer = new Customer(
        get("id"),
        get("firstName"),
        get("lastName"),
        get("middleInitial"),
        get("street"),
        get("city"),
        get("state"),
        get("zip"),
        get("phone"),
        get("email"),
        get("password")
    );

    // Se guardan los datos del customer
    sessionStorage.setItem("customer.id", customer.id);
    sessionStorage.setItem("customer.firstName", customer.firstName);
    sessionStorage.setItem("customer.lastName", customer.lastName);
    sessionStorage.setItem("customer.middleInitial", customer.middleInitial);
    sessionStorage.setItem("customer.street", customer.street);
    sessionStorage.setItem("customer.city", customer.city);
    sessionStorage.setItem("customer.state", customer.state);
    sessionStorage.setItem("customer.zip", customer.zip);
    sessionStorage.setItem("customer.phone", customer.phone);
    sessionStorage.setItem("customer.email", customer.email);
    sessionStorage.setItem("customer.password", customer.password); 
}
