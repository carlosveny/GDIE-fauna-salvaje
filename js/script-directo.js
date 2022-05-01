/*
    Fichero que gestiona la parte del cliente de la retransmision
    y el chat del directo.
*/

// VARIABLES GLOBALES
var ws = new WebSocket("wss://alumnes-ltim.uib.es/gdie2208b/"); //open a web socket from javascript
var username = null;

function loaded() {
    playVideoFromCamera();
}

function setUsername() {
    username = $("#username").val();
    peticionUsuario(username);
}

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

function peticionUsuario(user) {
    var datos = {
        "nombre": user,
        "fecha": Date.now(),
        "tipo": "usuario"
    };
    ws.send(JSON.stringify(datos));
    console.log("Mensaje enviado al servidor");
}


/* ---------------------------------------------------------------------------- */

// FUNCIONES QUE GESTIONAN LA CONEXION CON EL SIGNALING SERVER

ws.onopen = function () {

    // Web Socket is connected, send data to server
    // ws.send("Message from user");
    console.log("Conexión establecida");
};

ws.onmessage = function (evt) {

    // handle messages from server
    var received_msg = evt.data;
    console.log("SERVIDOR: " + received_msg);
};

ws.onclose = function () {

    // websocket is closed
    console.log("Websocket Connection is closed...");
};
