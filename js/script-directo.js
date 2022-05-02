/*
    Fichero que gestiona la parte del cliente de la retransmision
    y el chat del directo.
*/

// VARIABLES GLOBALES
var ws = null;
var username = null;

function loaded() {
    playVideoFromCamera();
}

function setUsername() {
    username = $("#username").val();
    connect();
}

function enviarMensaje() {
    var mensaje = $("#mensaje").val();
    peticionMensaje(mensaje);
}

function gestionarMensaje(mensaje) {
    switch(mensaje["tipo"]) {
        case "accion":
            if (mensaje["mensaje"] == "conexionEstablecida") {
                peticionUsuario();
            }
            break;
    }
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

function peticionMensaje(mensaje) {
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
        console.log("Conexión terminada");
    };
}
