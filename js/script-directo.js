/*
    Fichero que gestiona la parte del cliente de la retransmision
    y el chat del directo.
*/

// VARIABLES GLOBALES
var ws = null;
var username = null;

function loaded() {
    // Configuracion inicial
    $("#username").val("");
    $("#mensaje").val("");
    $("#username").prop("disabled", false);
    $("#bt-username").prop("disabled", true);
    $("#mensaje").prop("disabled", true);
    $("#bt-mensaje").prop("disabled", true);

    //playVideoFromCamera();
}

// Funcion que guarda el nombre de usuario y establece la conexion
function setUsername() {
    username = $("#username").val();
    connect();
}

// Funcion que cierra la sesion
function cerrarSesion() {
    ws.close(); // Cerrar la conexion
    crearAviso("alert-success", "Éxito", "Se ha cerrado la sesión correctamente.", 3000);
}

// Funcion que gestiona los mensajes que llegan del servidor
function gestionarMensaje(mensaje) {
    switch(mensaje["tipo"]) {
        // Acciones de control
        case "accion":
            if (mensaje["mensaje"] == "conexionEstablecida") {
                peticionUsuario();
            }
            else if (mensaje["mensaje"] == "usuarioAceptado") {
                var descr = "Acabas de conectarte al chat. Ahora puedes escribir mensajes.";
                crearAviso("alert-success", "Éxito", descr, 3000);
                $("#bt-username").html("Salir");
                $("#bt-username").attr("onclick", "cerrarSesion()");
                $("#username").prop("disabled", true);
                $("#mensaje").prop("disabled", false);
                $("#bt-mensaje").prop("disabled", true);
                $("#comentarios").empty();
            }
            else if (mensaje["mensaje"] == "usuarioExiste") {
                $("#username").val("");
                revisarCamposVacios("username");
                var descr = "El nombre de usuario ya existe. Prueba con otro nombre.";
                crearAviso("alert-danger", "Error", descr, 3000);
            }
            break;
        
        // Mensajes de usuarios (o propios)
        case "mensaje":
            var comment = document.createElement("div");
            comment.setAttribute("class", "mt-1 ms-1 comentario");
            var tiempo = "[" + formatTime(mensaje["fecha"]) + "]&nbsp";
            var nombre = " <strong>" + mensaje["usuario"] + ": </strong>";
            comment.innerHTML = tiempo + nombre + mensaje["mensaje"];
            var caja = document.getElementById("comentarios");
            caja.appendChild(comment);
            caja.scrollTop = caja.scrollHeight;
    }
}

function enterKey(e) {
    if (e.keyCode == 13) {
        if (document.getElementById("mensaje").disabled && $("#username").val() != "") {
            setUsername();
        }
        else if ($("#mensaje").val() != "") peticionMensaje();
    }
}

function revisarCamposVacios(campo) {
    console.log($("#" + campo).val() == "");
    if ($("#" + campo).val() == "") $("#bt-" + campo).prop("disabled", true);
    else $("#bt-" + campo).prop("disabled", false);
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES DE USERMEDIA

async function playVideoFromCamera() {
    try {
        const constraints = {
            video: {
                width: { ideal: 4096 },
                height: { ideal: 2160 }
            },
            'audio': true
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoElement = document.querySelector('#localVideo');
        videoElement.srcObject = stream;
    } catch (error) {
        console.error('Error opening video camera.', error);
    }
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES DE PETICIONES AL SIGNALING SERVER

function peticionUsuario() {
    var datos = {
        "tipo": "usuario",
        "usuario": username,
        "fecha": Date.now()
    };
    ws.send(JSON.stringify(datos));
    console.log("Mensaje enviado al servidor");
}

function peticionMensaje() {
    var mensaje = $("#mensaje").val();
    $("#mensaje").val("");
    revisarCamposVacios("mensaje");
    var datos = {
        "tipo": "mensaje",
        "usuario": username,
        "mensaje": mensaje,
        "fecha": Date.now()
    };
    ws.send(JSON.stringify(datos));
    console.log("Mensaje enviado al servidor");
}


/* ---------------------------------------------------------------------------- */

// FUNCIONES QUE GESTIONAN LA CONEXION CON EL SIGNALING SERVER

function connect() {
    ws = new WebSocket("wss://alumnes-ltim.uib.es/gdie2208b/"); //open a web socket from javascript

    // Funcion que se ejecuta al abrirse la conexion
    ws.onopen = function () {
        console.log("Conexión establecida");
    };

    // Funcion que se ejecuta al recibir un mensaje del servidor
    ws.onmessage = function (evt) {
        var mensaje = evt.data;
        console.log("SERVIDOR: " + mensaje);
        mensaje = JSON.parse(mensaje);
        gestionarMensaje(mensaje);
    };

    // Funcion que se ejecuta al cerrarse la conexion
    ws.onclose = function () {
        $("#username").val("");
        $("#mensaje").val("");
        $("#username").prop("disabled", false);
        $("#bt-username").prop("disabled", true);
        $("#mensaje").prop("disabled", true);
        $("#bt-mensaje").prop("disabled", true);
        $("#bt-username").html("Entrar");
        $("#bt-username").attr("onclick", "setUsername()");
        $('#bt-username').blur(); // Quitar focus para evitar fallos
    
        $("#comentarios").empty(); // Eliminar los comentarios
        var comment = document.createElement("div");
        comment.setAttribute("class", "mt-1 ms-1");
        comment.innerHTML = "Introduce un nombre de usuario para entrar al chat.";
        document.getElementById("comentarios").appendChild(comment);
        
        console.log("Conexión terminada");
    };
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES AUXILIARES

// Funcion para formatear el tiempo en horas minutos y segundos
function formatTime(ms) {
    var d = new Date(ms);
    return d.toLocaleTimeString();
}

// Funcion que crea un aviso de bootstrap dado el tipo, titulo y descripcion
// tipo: alert-danger, alert-warning, alert-success. (Clases de Bootstrap)
function crearAviso(tipo, titulo, descr, tiempo) {
    // Crear aviso
    var aviso = document.createElement("div");
    aviso.classList.add("myAlert-top", "alert", "alert-dismissible", "fade", "show", tipo);
    aviso.innerHTML = "<strong>" + titulo + ": </strong>" + descr;
    var cerrar = document.createElement("button");
    cerrar.setAttribute("type", "button");
    cerrar.classList.add("btn-close");
    cerrar.setAttribute("data-bs-dismiss", "alert");
    cerrar.setAttribute("aria-label", "Close");

    // Append
    aviso.appendChild(cerrar);
    document.getElementById("cuerpo").appendChild(aviso);

    // Mostrar y ocultar tras X segundos
    $(".myAlert-top").show();
    if (tiempo > 0) {
        setTimeout(function () {
            // Quitar aviso
            $(".myAlert-top").hide();
            const boxes = document.querySelectorAll('.myAlert-top');
            boxes.forEach(box => {
                box.remove();
            });
        }, tiempo);
    }
}