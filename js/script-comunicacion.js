/*
    Fichero que gestiona la parte del cliente del chat y las llamadas
    P2P con usuarios.
*/

// VARIABLES GLOBALES
var ws = null;
var username = null;
var targetUser = null;
var llamadaEstablecida = false;
var localStream = null;
var videoTrack = null;
var screenTrack = null;
var audioTrack = null;
var sender = null;
var channel = null;
var timeoutEscribiendo = null;
var timeoutRechazar = null;
var rtcPeerConnection; // Connection between the local device and the remote peer
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: 'turn:openrelay.metered.ca:443',
            credential: 'openrelayproject',
            username: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:80?transport=tcp',
            credential: 'openrelayproject',
            username: 'openrelayproject'
        },
        {
            urls: 'turn:numb.viagenie.ca',
            credential: 'carlosveny@yahoo.es',
            username: 'miperritosalvaje69'
        }
    ]
};

// Funcion que se ejecuta al cargarse la pagina
function loaded() {
    // Configuracion inicial
    $("#username").val("");
    $("#mensaje").val("");
    $("#username").prop("disabled", false);
    $("#bt-username").prop("disabled", true);
    $("#mensaje").prop("disabled", true);
    $("#bt-mensaje").prop("disabled", true);
    $('#select-usuarios').find('option:selected').removeAttr('selected');
    $('#select-usuarios').val("default");
    $('#select-usuarios').prop("disabled", true);
    $("#chat-p2p").css("display", "none");

    playVideoFromCamera();

    // Asignar listeners asincronos a botones "aceptar" y "rechazar"
    document.getElementById("bt-aceptar").onclick = async () => {
        document.getElementById("localVideo").srcObject = localStream;
        llamadaEstablecida = true;
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        addLocalTracks(rtcPeerConnection);
        rtcPeerConnection.ontrack = setRemoteStream;
        rtcPeerConnection.onicecandidate = sendIceCandidate;
        // Data channel
        channel = rtcPeerConnection.createDataChannel("channel");
        channel.onopen = channelAbierto;
        channel.onclose = channelCerrado;
        channel.onmessage = channelMensaje;
        await createOffer(rtcPeerConnection);
    };
    document.getElementById("bt-rechazar").onclick = () => {
        rechazarLlamada(true);
    };
}

// Funcion que guarda el nombre de usuario y establece la conexion
function setUsername() {
    username = $("#username").val();
    if (username == "default") {
        var descr = "Este nombre de usuario no está permitido. Prueba con otro nombre.";
        crearAviso("alert-danger", "Error", descr, 3000);
        $("#username").val("");
        return;
    }
    connect();
}

// Funcion que cierra la sesion
function cerrarSesion() {
    ws.close(); // Cerrar la conexion
    crearAviso("alert-success", "Éxito", "Se ha cerrado la sesión correctamente.", 3000);
}

// Funcion que gestiona los mensajes que llegan del servidor
async function gestionarMensaje(mensaje) {
    switch (mensaje["tipo"]) {
        // Acciones de control
        case "accion":
            if (mensaje["mensaje"] == "conexionEstablecida") {
                peticionUsuario();
            }
            else if (mensaje["mensaje"] == "usuarioAceptado") {
                var descr = "Acabas de conectarte al chat. Ahora puedes escribir ";
                descr += "mensajes y realizar llamadas.";
                crearAviso("alert-success", "Éxito", descr, 3000);
                $("#bt-username").html("Salir");
                $("#bt-username").attr("onclick", "cerrarSesion()");
                $("#username").prop("disabled", true);
                $("#mensaje").prop("disabled", false);
                $("#bt-mensaje").prop("disabled", true);
                $('#select-usuarios').prop("disabled", false);
                $("#comentarios").empty();

                // Crear aviso bienvenida
                var comment = document.createElement("div");
                comment.setAttribute("class", "mt-1 ms-1 comentario cm-control");
                comment.innerHTML = "<strong>Bienvenido a la sala de chat.</strong>";
                document.getElementById("comentarios").appendChild(comment);

                cargarUsuariosConectados(mensaje["usuarios"]);
            }
            else if (mensaje["mensaje"] == "usuarioExiste") {
                $("#username").val("");
                username = null;
                revisarCamposVacios("username");
                var descr = "El nombre de usuario ya existe. Prueba con otro nombre.";
                crearAviso("alert-danger", "Error", descr, 3000);
            }
            else if (mensaje["mensaje"] == "entraUsuario" || "saleUsuario") {
                if (mensaje["usuario"] == username) break;
                if (mensaje["usuario"] == undefined) break;
                if (mensaje["usuario"] == targetUser) {
                    colgar();
                }
                // Crear aviso de entrada/salida
                var accion = "salido de";
                if (mensaje["mensaje"] == "entraUsuario") accion = "entrado a";
                var comment = document.createElement("div");
                comment.setAttribute("class", "mt-1 ms-1 comentario");
                if (mensaje["mensaje"] == "entraUsuario") comment.classList.add("cm-verde");
                else comment.classList.add("cm-rojo");
                var txt = "[" + formatTime(mensaje["fecha"]) + "]&nbsp";
                txt += "<strong>" + mensaje["usuario"] + "</strong> ha " + accion + " la sala de chat.";
                comment.innerHTML = txt;
                document.getElementById("comentarios").appendChild(comment);

                cargarUsuariosConectados(mensaje["usuarios"]);
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

            break;

        // Iniciar una llamada
        case "start_call":
            llamadaEstablecida = false;
            console.log("Recibida peticion de 'start_call'");
            targetUser = mensaje["sender"];
            // No permitir llamadas si no hay permiso de camara
            if (localStream == null) {
                var txt = "Tienes una llamada entrante pero no la puedes contestar ";
                txt += "porque no has aceptado los permisos de la cámara. Recarga ";
                txt += "la página y acepta los permisos.";
                crearAviso("alert-danger", "Error", txt, 4000);
                rechazarLlamada(true);
                return;
            }
            // No permitir llamadas si ya hay una en curso
            if (document.getElementById("remoteVideo").srcObject != null) {
                var txt = "Tienes una llamada entrante de " + targetUser + " pero";
                txt += " no la puedes contestar porque ya tienes una llamada en ";
                txt += " curso. Cuelga esta llamada para poder aceptar llamadas entrantes.";
                crearAviso("alert-warning", "Error", txt, 4000);
                rechazarLlamada(false);
                return;
            }

            $("#usuario-entrante").html(targetUser);
            $("#llamada-entrante").css("display", "");
            $('#select-usuarios').prop("disabled", true);

            // Establecer delay para rechazar la llamada (10 segundos)
            if (timeoutRechazar != null) {
                window.clearTimeout(timeoutRechazar);
            }
            timeoutRechazar = window.setTimeout(function () {
                if (!llamadaEstablecida) {
                    rechazarLlamada(true);
                }
            }, 10000);
            break;

        case "webrtc_ice_candidate":
            console.log("Recibida peticion de 'webrtc_ice_candidate'");
            var candidate = new RTCIceCandidate({
                sdpMLineIndex: mensaje["label"],
                candidate: mensaje["candidate"],
            });
            rtcPeerConnection.addIceCandidate(candidate);
            break;

        case "webrtc_offer":
            console.log("Recibida peticion de 'webrtc_offer'");
            rtcPeerConnection = new RTCPeerConnection(iceServers);
            rtcPeerConnection.ondatachannel = receiveChannelCallback;
            addLocalTracks(rtcPeerConnection);
            rtcPeerConnection.ontrack = setRemoteStream;
            rtcPeerConnection.onicecandidate = sendIceCandidate;
            rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(mensaje["sdp"]));
            await createAnswer(rtcPeerConnection);
            break;

        case "webrtc_answer":
            console.log("Recibida peticion de 'webrtc_answer'");
            rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(mensaje["sdp"]));

            // Actualizar pantalla
            $("#llamada-entrante").css("display", "none");
            break;

        case "rechazar":
            console.log("Llamada rechazada");
            // Actualizar pantalla
            $('#select-usuarios').prop("disabled", false);
            $("#estado-llamada").empty();
            var estado = document.createElement("h5");
            estado.innerHTML = "Llamada finalizada";
            estado.innerHTML += "<i class='fa-solid fa-phone-slash text-danger ms-2'></i>";
            document.getElementById("estado-llamada").appendChild(estado);
            $("#bt-colgar").css("display", "none");
            $("#chat-p2p").css("display", "none");
            break;

    }
}

// Funcion para habilitar la tecla intro para los inputs
function enterKey(e) {
    if (e.keyCode == 13) {
        if (document.getElementById("mensaje").disabled && $("#username").val() != "") {
            setUsername();
        }
        else if ($("#mensaje").val() != "") peticionMensaje();
        else if (document.activeElement == document.getElementById("mensaje2")) {
            if ($("#mensaje2").val() != "") peticionMensajeChannel();
        }
    }
}

// Funcion que revisa si hay campos vacios en el usuario o en el mensaje
function revisarCamposVacios(campo) {
    if ($("#" + campo).val() == "") $("#bt-" + campo).prop("disabled", true);
    else $("#bt-" + campo).prop("disabled", false);
}

// Funcion que se ejecuta cuando se selecciona un usuario del dropdown
function usuarioSeleccionado(user) {
    if (user == "default") return;
    // Desmarcar
    $('#select-usuarios').find('option:selected').removeAttr('selected');
    $('#select-usuarios').val("default");

    // No permitir llamadas a si mismo
    if (username == user) {
        var txt = "No puedes realizar una llamada contigo mismo.";
        crearAviso("alert-danger", "Error", txt, 3000);
        return;
    }
    // No permitir llamadas si no hay permiso de camara
    if (localStream == null) {
        var txt = "No se pueden iniciar llamadas porque no has permitido el acceso ";
        txt += "a la cámara. Recarga la página y acepta los permisos.";
        crearAviso("alert-danger", "Error", txt, 4000);
        return;
    }

    // Realizar la peticion de llamada
    $('#select-usuarios').prop("disabled", true);
    $("#estado-llamada").empty();
    var estado = document.createElement("h5");
    estado.innerHTML = "Llamando a <strong>" + user + "</strong> ";
    estado.innerHTML += "<img class='loading' src='assets/icons/bars.gif' />";
    document.getElementById("estado-llamada").appendChild(estado);
    document.getElementById("localVideo").srcObject = localStream;
    console.log("Setting up connection to invite user: " + user);
    targetUser = user;
    var datos = {
        "tipo": "start_call",
        "destination": user
    };
    ws.send(JSON.stringify(datos));
}

// Funcion que actualiza el dropdown de usuarios conectados
function cargarUsuariosConectados(usuarios) {
    $("#select-usuarios").empty(); // Eliminar todos los options de usuarios
    // Crear default
    var def = document.createElement("option");
    def.setAttribute("value", "default");
    def.setAttribute("selected", "");
    def.setAttribute("disabled", "");
    def.setAttribute("hidden", "");
    def.innerHTML = "Usuarios conectados";
    document.getElementById("select-usuarios").appendChild(def);
    // Añadir todos los usuarios
    for (var i = 0; i < usuarios.length; i++) {
        var opt = document.createElement("option");
        opt.setAttribute("value", usuarios[i]);
        opt.innerHTML = usuarios[i];
        if (username == usuarios[i]) opt.innerHTML += " (yo)";
        document.getElementById("select-usuarios").appendChild(opt);
    }
}

// Funcion que invierte la camara (flip en el eje X)
function flipScreen() {
    let vLocal = document.getElementById("localVideo");
    vLocal.classList.toggle("video-flip");
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES DE USERMEDIA

async function playVideoFromCamera() {
    try {
        const constraints = {
            video: {
                width: { max: 1920 },
                height: { max: 1080 }
            },
            'audio': true
        };
        await navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                localStream = stream;
                document.getElementById("localVideo").srcObject = localStream;
                const tracks = stream.getTracks();
                if (tracks[0].kind == "audio") {
                    audioTrack = tracks[0];
                    videoTrack = tracks[1];
                }
                else {
                    audioTrack = tracks[1];
                    videoTrack = tracks[0];
                }
            });

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

function rechazarLlamada(actualizarPantalla) {
    // Actualizar pantalla
    if (actualizarPantalla) {
        $('#select-usuarios').prop("disabled", false);
        $("#llamada-entrante").css("display", "none");
        $("#estado-llamada").empty();
        var estado = document.createElement("h5");
        estado.innerHTML = "Llamada finalizada";
        estado.innerHTML += "<i class='fa-solid fa-phone-slash text-danger ms-2'></i>";
        document.getElementById("estado-llamada").appendChild(estado);
        $("#bt-colgar").css("display", "none");
        $("#chat-p2p").css("display", "none");
    }

    // Enviar al servidor el rechazo
    llamadaEstablecida = true;
    var respuesta = {
        "tipo": "rechazar",
        "destination": targetUser
    };
    ws.send(JSON.stringify(respuesta));
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
        $('#select-usuarios').prop("disabled", true);
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

// FUNCIONES P2P

function addLocalTracks(rtcPeerConnection) {
    rtcPeerConnection.addTrack(audioTrack, localStream);
    sender = rtcPeerConnection.addTrack(videoTrack, localStream);
}

function setRemoteStream(event) {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
    // Actualizar pantalla
    $("#estado-llamada").empty();
    var estado = document.createElement("h5");
    estado.innerHTML = "Llamada P2P establecida con <strong>" + targetUser + "</strong>";
    estado.innerHTML += "<i class='fa-solid fa-phone text-success ms-2'></i>";
    document.getElementById("estado-llamada").appendChild(estado);
    $("#bt-colgar").css("display", "");

    // Mostrar chat P2P
    $("#chat-p2p").css("display", "");
    $("#banner-usuario").html(targetUser);
    $("#banner-estado").html("en línea");
    $("#comentarios2").empty();
    $("#mensaje2").val("");
    $("#bt-mensaje2").prop("disabled", true);
}

function sendIceCandidate(event) {
    console.log(event.candidate);
    if (event.candidate) {
        var datos = {
            "tipo": "webrtc_ice_candidate",
            "destination": targetUser,
            "label": event.candidate.sdpMLineIndex,
            "candidate": event.candidate.candidate
        };
        ws.send(JSON.stringify(datos));
    }
}

async function createOffer(rtcPeerConnection) {
    let sessionDescription;
    try {
        sessionDescription = await rtcPeerConnection.createOffer();
        rtcPeerConnection.setLocalDescription(sessionDescription);
    } catch (error) {
        console.error(error);
    }

    var offer = {
        "tipo": "webrtc_offer",
        "sdp": sessionDescription,
        "destination": targetUser
    }
    ws.send(JSON.stringify(offer));
}

async function createAnswer(rtcPeerConnection) {
    let sessionDescription;
    try {
        sessionDescription = await rtcPeerConnection.createAnswer();
        rtcPeerConnection.setLocalDescription(sessionDescription);
    } catch (error) {
        console.error(error);
    }

    var answer = {
        "tipo": "webrtc_answer",
        "sdp": sessionDescription,
        "destination": targetUser
    }
    ws.send(JSON.stringify(answer));
}

function receiveChannelCallback(event) {
    channel = event.channel;
    channel.onopen = channelAbierto;
    channel.onclose = channelCerrado;
    channel.onmessage = channelMensaje;
}

function channelAbierto(event) {
    console.log("Canal abierto");
}

function channelCerrado(event) {
    console.log("Canal cerrado");
    targetUser = null;

    // Actualizar pantalla
    $("#estado-llamada").empty();
    var estado = document.createElement("h5");
    estado.innerHTML = "Llamada finalizada";
    estado.innerHTML += "<i class='fa-solid fa-phone-slash text-danger ms-2'></i>";
    document.getElementById("estado-llamada").appendChild(estado);
    document.getElementById("remoteVideo").srcObject = null;
    $("#bt-colgar").css("display", "none");
    $('#select-usuarios').prop("disabled", false);
    $("#chat-p2p").css("display", "none");
}

function channelMensaje(event) {
    var datos = JSON.parse(event.data);
    if (datos["tipo"] == "mensaje") {
        // Mostrar comentario en el chat
        var comment = document.createElement("div");
        comment.setAttribute("class", "mt-1 ms-1 comentario");
        var tiempo = "[" + formatTime(datos["fecha"]) + "]&nbsp";
        var nombre = " <strong>" + targetUser + ": </strong>";
        comment.innerHTML = tiempo + nombre + datos["mensaje"];
        var caja = document.getElementById("comentarios2");
        caja.appendChild(comment);
        caja.scrollTop = caja.scrollHeight;
    }
    else {
        // Cambiar estado escribiendo
        if (timeoutEscribiendo != null) {
            window.clearTimeout(timeoutEscribiendo);
        }
        $("#banner-estado").html("escribiendo...");
        timeoutEscribiendo = window.setTimeout(function () {
            $("#banner-estado").html("en línea");
        }, 500);
    }
}

// Funcion que cuelga la llamada y cierra la conexion
function colgar() {
    console.log("Llamada finalizada");
    rtcPeerConnection.close();
    // Actualizar pantalla
    $("#estado-llamada").empty();
    var estado = document.createElement("h5");
    estado.innerHTML = "Llamada finalizada";
    estado.innerHTML += "<i class='fa-solid fa-phone-slash text-danger ms-2'></i>";
    document.getElementById("estado-llamada").appendChild(estado);
    document.getElementById("remoteVideo").srcObject = null;
    $("#bt-colgar").css("display", "none");
    $('#select-usuarios').prop("disabled", false);
    $("#chat-p2p").css("display", "none");
}

// Funcion que envia un mensaje por el data channel
function peticionMensajeChannel() {
    var mensaje = $("#mensaje2").val();
    $("#mensaje2").val("");
    revisarCamposVacios("mensaje2");
    var datos = {
        "tipo": "mensaje",
        "mensaje": mensaje,
        "fecha": Date.now()
    };
    channel.send(JSON.stringify(datos));

    // Mostrar comentario en el chat
    var comment = document.createElement("div");
    comment.setAttribute("class", "mt-1 ms-1 comentario");
    var tiempo = "[" + formatTime(datos["fecha"]) + "]&nbsp";
    var nombre = " <strong>" + username + ": </strong>";
    comment.innerHTML = tiempo + nombre + mensaje;
    var caja = document.getElementById("comentarios2");
    caja.appendChild(comment);
    caja.scrollTop = caja.scrollHeight;
}

// Funcion que envia el estado "escribiendo" al otro usuario
function peticionStatus() {
    var datos = {
        "tipo": "estado"
    };
    channel.send(JSON.stringify(datos));
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