// URL base para acceder a los servicios REST del servidor
var API_URL = '/CRUDBankServerSide/webresources/customer';

// Función para analizar una cadena XML en un objeto DOM
function parseXml(xmlString) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlString, "application/xml");
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        console.error('Error al parsear XML:', xmlString);
        throw new Error('Error de lectura XML: XML inválido.');
    }
    return xmlDoc;
}

// Función para extraer el texto de una etiqueta XML específica
function getXmlValue(xmlDoc, tagName) {
    var elements = xmlDoc.getElementsByTagName(tagName);
    if (elements && elements.length > 0 && elements[0].textContent) {
        return elements[0].textContent;
    }
    return '';
}

// Función para obtener el ID del usuario logueado desde sessionStorage
function getUserId() {
    return sessionStorage.getItem('customer.id');
}

// Validación de requisitos de la nueva contraseña
function validarRequisitosPassword(password) {
    var errores = [];
    if (password.length < 8) errores.push('La contraseña debe tener al menos 8 caracteres');
    if (password.length > 255) errores.push('La contraseña no puede exceder 255 caracteres');
    if (!/[A-Z]/.test(password)) errores.push('Debe contener al menos una mayúscula');
    if (!/[a-z]/.test(password)) errores.push('Debe contener al menos una minúscula');
    if (!/[0-9]/.test(password)) errores.push('Debe contener al menos un número');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errores.push('Debe contener al menos un carácter especial');
    return errores;
}

// Mostrar mensaje de error debajo del campo correspondiente
function mostrarError(campoId, mensaje) {
    var errorSpan = document.getElementById('error-' + campoId);
    if (errorSpan) {
        errorSpan.textContent = mensaje;
        errorSpan.style.display = 'block';
    }
}

// Ocultar mensaje de error
function ocultarError(campoId) {
    var errorSpan = document.getElementById('error-' + campoId);
    if (errorSpan) {
        errorSpan.textContent = '';
        errorSpan.style.display = 'none';
    }
}

// Verificar con el servidor si la contraseña actual es correcta
function verificarPasswordActual(password) {
    var email = sessionStorage.getItem('customer.email');
    if (!email) return Promise.resolve(false);

    return fetch(API_URL + '/sigin/' + encodeURIComponent(email) + '/' + encodeURIComponent(password), {
        method: 'GET',
        headers: { 'Accept': 'application/xml' }
    }).then(function(response) {
        if (response.status === 401) return false; // contraseña incorrecta
        if (!response.ok) return false;
        return true; // contraseña correcta
    }).catch(function() {
        return false;
    });
}

// Inicializar campos y eventos al cargar la página
window.onload = function() {
    var campoActual = document.getElementById('campoactual');
    var campoNueva = document.getElementById('camponueva');
    var campoRepetir = document.getElementById('camporepetir');

    // Validación al salir del campo "Contraseña actual"
    if (campoActual) {
        campoActual.onblur = function () {
            var password = this.value.trim();
            if (password === '') {
                mostrarError('actual', 'Este campo es obligatorio');
                return;
            }
            verificarPasswordActual(password).then(function(esValida) {
                if (!esValida) mostrarError('actual', 'La contraseña actual es incorrecta');
                else ocultarError('actual');
            });
        };
    }

    // Validación al salir del campo "Contraseña nueva"
    if (campoNueva) {
        campoNueva.onblur = function () {
            var password = this.value.trim();
            var confirmar = campoRepetir.value.trim();
            if (password === '') { mostrarError('nueva', 'Este campo es obligatorio'); return; }
            var errores = validarRequisitosPassword(password);
            if (errores.length > 0) { mostrarError('nueva', errores.join('. ')); return; }
            ocultarError('nueva');
            if (confirmar !== '' && password !== confirmar) mostrarError('confirmar', 'Las contraseñas no coinciden');
            else ocultarError('confirmar');
        };
    }

    // Validación al salir del campo "Confirmar contraseña"
    if (campoRepetir) {
        campoRepetir.onblur = function () {
            var confirmar = this.value.trim();
            var nueva = campoNueva.value.trim();
            if (confirmar === '') mostrarError('confirmar', 'Este campo es obligatorio');
            else if (confirmar !== nueva) mostrarError('confirmar', 'Las contraseñas no coinciden');
            else ocultarError('confirmar');
        };
    }

    // Botones para mostrar/ocultar contraseña
    var botonesMostrar = document.getElementsByClassName('toggle-password');
    for (var i = 0; i < botonesMostrar.length; i++) {
        botonesMostrar[i].onclick = function () {
            var targetId = this.getAttribute('data-target');
            var input = document.getElementById(targetId);
            if (input.type === 'password') { input.type = 'text'; this.textContent = '🙈'; }
            else { input.type = 'password'; this.textContent = '👁️'; }
        };
    }

    // Botón limpiar campos
    var btnLimpiar = document.getElementById('btn-limpiar-campos');
    if (btnLimpiar) {
        btnLimpiar.onclick = function () {
            campoActual.value = '';
            campoNueva.value = '';
            campoRepetir.value = '';
            ocultarError('actual'); ocultarError('nueva'); ocultarError('confirmar');
            campoActual.focus();
        };
    }

    // Botón cancelar
    var btnCancelar = document.getElementById('btn-cancelar-cambio');
    if (btnCancelar) btnCancelar.onclick = function () { window.location.href = 'principalpr.html'; };

    // Envío del formulario
    var formCambio = document.getElementById('form-cambio');
    if (formCambio) {
        formCambio.onsubmit = function(e) {
            e.preventDefault();
            var actual = campoActual.value.trim();
            var nueva = campoNueva.value.trim();
            var confirmar = campoRepetir.value.trim();

            var hayErrores = false;
            if (actual === '') { mostrarError('actual', 'Este campo es obligatorio'); hayErrores=true; }
            if (nueva === '') { mostrarError('nueva', 'Este campo es obligatorio'); hayErrores=true; }
            if (confirmar === '') { mostrarError('confirmar', 'Este campo es obligatorio'); hayErrores=true; }
            if (hayErrores) return;

            var errores = validarRequisitosPassword(nueva);
            if (errores.length>0) { mostrarError('nueva', errores.join('. ')); return; }
            if (nueva !== confirmar) { mostrarError('confirmar', 'Las contraseñas no coinciden'); return; }

            verificarPasswordActual(actual).then(function(valida){
                if(!valida) { mostrarError('actual','La contraseña actual es incorrecta'); return; }
                cambiarPasswordEnServidor(nueva);
            });
        };
    }
};

// Función para cambiar la contraseña sin tocar los demás campos
function cambiarPasswordEnServidor(passwordNueva) {
    var userId = getUserId();
    if (!userId) { alert('Error: No se encontró usuario logueado.'); return; }

    // Recuperar todos los campos actuales desde sessionStorage
    var customer = {
        id: sessionStorage.getItem("customer.id"),
        firstName: sessionStorage.getItem("customer.firstName"),
        lastName: sessionStorage.getItem("customer.lastName"),
        middleInitial: sessionStorage.getItem("customer.middleInitial"),
        street: sessionStorage.getItem("customer.street"),
        city: sessionStorage.getItem("customer.city"),
        state: sessionStorage.getItem("customer.state"),
        zip: sessionStorage.getItem("customer.zip"),
        phone: sessionStorage.getItem("customer.phone"),
        email: sessionStorage.getItem("customer.email"),
        password: passwordNueva
    };

    // Crear el XML con todos los datos
    var xmlBody = `<customer>
        <id>${customer.id}</id>
        <firstName>${escapeXml(customer.firstName)}</firstName>
        <lastName>${escapeXml(customer.lastName)}</lastName>
        <middleInitial>${escapeXml(customer.middleInitial)}</middleInitial>
        <street>${escapeXml(customer.street)}</street>
        <city>${escapeXml(customer.city)}</city>
        <state>${escapeXml(customer.state)}</state>
        <zip>${escapeXml(customer.zip)}</zip>
        <phone>${escapeXml(customer.phone)}</phone>
        <email>${escapeXml(customer.email)}</email>
        <password>${escapeXml(customer.password)}</password>
    </customer>`;

    console.log('XML que se enviará:', xmlBody);

    fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlBody
    }).then(function(response){
        if(!response.ok){
            return response.text().then(text => { console.error('Error PUT:', text); throw new Error('Error al actualizar: ' + response.status); });
        }
        sessionStorage.setItem('customer.password', passwordNueva);
        alert('Contraseña cambiada con éxito.');
        window.location.href='principalpr.html';
    }).catch(function(error){
        console.error('Error general:', error);
        alert('Ocurrió un error al intentar cambiar la contraseña: ' + error.message);
    });
}

// Función para escapar caracteres especiales en XML
function escapeXml(unsafe){
    if(!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g,function(c){
        switch(c){
            case '<':return '&lt;';
            case '>':return '&gt;';
            case '&':return '&amp;';
            case "'":return '&apos;';
            case '"':return '&quot;';
        }
    });
}
