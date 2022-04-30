/*
    Fichero que gestiona la parte del cliente de la retransmision
    y el chat del directo.
*/

// VARIABLES GLOBALES
var ws = new WebSocket("ws://localhost:8095"); //open a web socket from javascript

function loaded() {
    playVideoFromCamera();
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
    } catch(error) {
        console.error('Error opening video camera.', error);
    }
}

ws.onopen = function() {
                  
    // Web Socket is connected, send datas to server
    ws.send("Message from user");
    console.log("Message send to server");
 };

 ws.onmessage = function (evt) { 

     // handle messages from server
    var received_msg = evt.data;
    alert("Mesage from server = "+received_msg);
 };

 ws.onclose = function() { 
                  
    // websocket is closed
    console.log("Websocket Connection is closed...");
 };
