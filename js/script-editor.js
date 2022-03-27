/*
    Fichero que gestiona la introduccion, modificacion y eliminacion
    de metadatos en videos de animales y su posterior actualizacion
    en el servidor.
*/
// https://www.w3schools.com/php/php_file_upload.asp (file uploads php)
// https://developer.mozilla.org/en-US/docs/Web/API/TextTrack/cues (add cues)

// VARIABLES GLOBALES
var video; // objeto de video
var cueActual; // VTTCue actual
var cueProximo; // VTTCue siguiente, para gestionar el solapamiento
var pathMetadata;
// Si los datos se cargan del fichero y no se han modificado no se tienen que poder guardar de nuevo
var datosYaGuardados = false; // hace referencia a cada cue
// Para saber si activar/desactivar el boton "Subir al servidor"
var datosModificados = false; // hace referencia a todo el text track
var inicioPulsado = false; // para controlar la superposicion de datos
var solapamiento = false; // para controlar la superposicion de datos
var password; // contraseña para operaciones con el servidor

// Funcion que se ejecuta al cargarse la pagina
function loaded() {
    // Inicializacion variable global
    video = document.getElementById("miVideo");

    // Inicializacion del media player "plyr"
    const player = new Plyr('#miVideo', {
        invertTime: false,
        toggleInvert: false
    });

    // Inicializacion "iniciar sesion"
    $("#username").val("");
    $("#password").val("");

    // Inicializacion del boton "Examinar"
    var input = document.createElement("input");
    setAttributes(input, { class: "max-w-files", type: "file", id: "file-input", accept: "video/mp4" });
    input.addEventListener('input', peticionSubirVideo);
    document.getElementById("file-input-div").appendChild(input);
    $("#file-input").prop("disabled", true);

    // Inicializacion del dropdown "Video Existente"
    peticionObtenerVideos();
    $("#file-selector").prop("disabled", true);

    // Desmarcar botones
    $("#bt-inicio").prop("disabled", true);
    $("#bt-fin").prop("disabled", true);
    $("#bt-guardar").prop("disabled", true);
    $("#bt-eliminar").prop("disabled", true);
    $("#bt-subir").prop("disabled", true);
    habilitarInputs(false);

    //cargarVideo("assets/animales.mp4");
}

// Funcion que carga un video dado su path
function cargarVideo(path) {
    // Quitar aviso
    $(".myAlert-top").hide();
    const boxes = document.querySelectorAll('.myAlert-top');
    boxes.forEach(box => {
        box.remove();
    });

    // Mostrar aviso
    var descr = "El vídeo se ha cargado correctamente. También se ha ";
    descr += "detectado y cargado un fichero de metadatos.";
    if ($("#file-selector").val() == null) {
        descr = "El vídeo se ha subido al servidor. También se ha creado un fichero ";
        descr += "de metadatos vacío porque no se han detectado metadatos para este vídeo."
    }
    crearAviso("alert-success", "Éxito:", descr, 5500);

    // Si es un objeto se ha elegido un video existente
    if ((typeof path) == "object") {
        path = path.value;
        console.log(path);
    }

    // Crear elemento "source"
    var src = document.createElement("source");
    setAttributes(src, { id: "video-src", src: path, type: "video/mp4" });
    video.appendChild(src);
    if (document.getElementById("alerta-no-video") != null) {
        document.getElementById("alerta-no-video").remove();
    }

    // Deshabilitar la seleccion de nuevos videos
    document.getElementById("file-input").disabled = true;
    document.getElementById("file-selector").disabled = true;

    // Cargar fichero de metadatos
    pathMetadata = path.replace(".mp4", "-metadata.vtt");
    var track = document.createElement("track");
    setAttributes(track, { id: "track", kind: "metadata", label: "Metadatos" });
    track.setAttribute("src", pathMetadata);
    track.default = true;
    track.addEventListener("load", loadedMetadatos);
    video.appendChild(track);

    // Configurar los listeners del video
    video.addEventListener('play', playPulsado);
    video.addEventListener('pause', pausePulsado);
    video.addEventListener('timeupdate', (event) => {
        // Actualizar botones
        if (($("#md-inicio").val() != "") && ($("#md-fin").val() != "")) {
            habilitarInputs(true);
        }
        else {
            habilitarInputs(false);
        }
    });
}

// Funcion que deja todos los campos de inputs (metadatos) en blanco
function borrarCampos() {
    $("#md-inicio").val('');
    $("#md-fin").val('');
    $('#md-nombreComun').val('');
    $("#md-nombreCientifico").val('');
    $("#md-descripcion").val('');
    $("#md-geoLat").val('');
    $("#md-geoLong").val('');
    $("#md-foto").val('');

    $('#md-continente').find('option:selected').removeAttr('selected');
    $('#md-medio').find('option:selected').removeAttr('selected');
    $('#md-alimentacion').find('option:selected').removeAttr('selected');
    $('#md-esqueleto').find('option:selected').removeAttr('selected');
    $('#md-continente').val("default");
    $('#md-medio').val("default");
    $('#md-alimentacion').val("default");
    $('#md-esqueleto').val("default");

    // Botones
    cueActual = null;
    $("#bt-eliminar").prop("disabled", true);
}

// Funcion que crea una VTTCue con los datos de los inputs y la añade al text track
function crearCue() {
    // Crear JSON
    var contenidoJSON = {
        nombreComun: $('#md-nombreComun').val(),
        nombreCientifico: $("#md-nombreCientifico").val(),
        descripcion: $("#md-descripcion").val(),
        geoLat: $("#md-geoLat").val(),
        geoLong: $("#md-geoLong").val(),
        continente: $('#md-continente').find('option:selected').html(),
        foto: $("#md-foto").val(),
        medio: $('#md-medio').find('option:selected').html(),
        alimentacion: $('#md-alimentacion').find('option:selected').html(),
        esqueleto: $('#md-esqueleto').find('option:selected').html()
    }

    // Crear y añadir cue al text track
    var startTime = $("#md-inicio").attr("name");
    var endTime = $("#md-fin").attr("name");
    var cue = new VTTCue(startTime, endTime, JSON.stringify(contenidoJSON));
    cue.id = $('#md-nombreComun').val().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    video.textTracks[0].addCue(cue);
    console.log(video.textTracks[0].cues);

    // Añadir listeners a la nueva cue
    cue.addEventListener('enter', event => {
        updateDatos(event.target);
    });
    cue.addEventListener('exit', event => {
        var activeCue = video.textTracks[0].activeCues[0];
        // Si justo empieza otra cue
        if (activeCue != null) {
            updateDatos(activeCue);
        }
        else {
            updateDatos(null);
        }
    });

    // Actualizar los campos de input
    borrarCampos();
    updateDatos(cue);
    $("#bt-eliminar").prop("disabled", false);
}

// Funcion que habilita/deshabilita los inputs segun el parametro
function habilitarInputs(enable) {
    $("#md-nombreComun").prop("disabled", !enable);
    $("#md-nombreCientifico").prop("disabled", !enable);
    $("#md-descripcion").prop("disabled", !enable);
    $("#md-geoLat").prop("disabled", !enable);
    $("#md-geoLong").prop("disabled", !enable);
    $("#md-continente").prop("disabled", !enable);
    $("#md-medio").prop("disabled", !enable);
    $("#md-alimentacion").prop("disabled", !enable);
    $("#md-esqueleto").prop("disabled", !enable);
    $("#md-foto").prop("disabled", !enable);
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES REFERENTES A BOTONES (set inicio, final, eliminar, guardar y subir al servidor)

// Funcion que marca el startTime (en los inputs) de una posible nueva cue
function botonInicio() {
    // Actualizar variable global
    inicioPulsado = true;

    // Actualizar campo startTime (input)
    $("#md-inicio").val(formatSeconds(video.currentTime));
    $("#md-inicio").attr("name", video.currentTime);

    // Borrar campo endTime (por si hubiese)
    $("#md-fin").val("");
    $("#md-fin").attr("name", "");
}

// Funcion que marca el endTime (en los inputs) de una posible nueva cue
function botonFin() {
    var endTime = video.currentTime - 0.1;

    // Revisar si hay solapamiento y ajustar el tiempo exacto
    var activeCue = video.textTracks[0].activeCues[0];
    if (activeCue != null) {
        endTime = activeCue.startTime;
    }

    // Actualizar campo endTime (input)
    $("#md-fin").val(formatSeconds(endTime));
    $("#md-fin").attr("name", endTime);

    habilitarInputs(true);
}

// Funcion que elimina la cue actual del text track
function botonEliminar() {
    // Actualizar variable global
    inicioPulsado = false;

    // Obtener cue actual
    var activeCues = video.textTracks[0].activeCues;

    // Borrar cue del text track
    video.textTracks[0].removeCue(activeCues[0]);

    // Dejar los campos en blanco
    borrarCampos();
}

// Funcion que guarda los metadatos actuales en el text track (no en el servidor)
function botonGuardar() {
    // Actualizar variables globales y activar boton "Subir al servidor"
    datosModificados = true; // referente a todo el text track
    datosYaGuardados = true; // referente a la cue actual
    inicioPulsado = false;
    $("#bt-subir").prop("disabled", false);
    $("#bt-guardar").prop("disabled", true);

    var eliminado = false;
    // No ha habido solapamiento
    if (cueProximo == null) {
        // Eliminar cue actual (si existe)
        var activeCues = video.textTracks[0].activeCues;
        if (activeCues.length > 0) {
            eliminado = true;
            video.textTracks[0].removeCue(activeCues[0]);
        }
    }


    // Crear nueva cue
    crearCue();
    // Mostrar cue siguiente
    if (cueProximo != null) {
        // Quitar aviso
        $(".myAlert-top").hide();
        const boxes = document.querySelectorAll('.myAlert-top');
        boxes.forEach(box => {
            box.remove();
        });

        video.play();
        cueActual = cueProximo;
        updateDatos(cueActual);
        cueProximo = null;
    }
    // Si se ha creado de 0, borrar los inputs porque ya se ha salido de la cue
    else if (!eliminado) {
        updateDatos(null);
    }

    // Deshabilitar inputs si no hay contenido
    if ($("#md-inicio").val() == "") {
        habilitarInputs(false);
    }
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES QUE MANEJAN EVENTOS

// Funcion que se ejecuta al cargarse los metadatos y configura los listeners
function loadedMetadatos() {
    // Dejar todos los campos en blanco
    borrarCampos();

    // Configurar los eventos de los metadatos
    var cues = video.textTracks[0].cues;
    for (var i = 0; i < cues.length; i++) {
        cues[i].addEventListener('enter', event => {
            updateDatos(event.target);
        });
        cues[i].addEventListener('exit', event => {
            var activeCue = video.textTracks[0].activeCues[0];
            // Si justo empieza otra cue
            if (activeCue != null) {
                updateDatos(activeCue);
            }
            else {
                updateDatos(null);
            }
        });
    }
}

// Funcion que se ejecuta al activarse/desactivarse una cue y actualiza los datos (parte derecha)
function updateDatos(cue) {
    // Si es null significa que la cue ya ha emitido "exit"
    if (cue == null) {
        cueActual = null;
        borrarCampos();
        return;
    }
    cueActual = cue;

    // Si se van a sobreescribir datos
    if (inicioPulsado) {
        cueActual = null;
        cueProximo = cue;
        video.pause();
        solapamiento = true;
        var descr = "Se ha pausado el vídeo porque tienes cambios sin guardar y se han detectado metadatos";
        descr = descr + " que empiezan en este mismo instante.<br>Rellena todos los campos y guarda los metadatos";
        descr = descr + " antes de volver a reproducir el vídeo. De lo contrario, los datos actuales se perderán.";
        crearAviso("alert-danger", "Aviso:", descr, 0);
        if ($("#md-fin").val() == "") {
            botonFin();
        }
        return;
    }

    // Actualizar campos con la cue actual
    $("#md-inicio").val(formatSeconds(cueActual.startTime));
    $("#md-inicio").attr("name", cueActual.startTime);
    $("#md-fin").val(formatSeconds(cueActual.endTime));
    $("#md-fin").attr("name", cueActual.endTime);

    var info = JSON.parse(cueActual.text);
    $("#md-nombreComun").val(info.nombreComun);
    $("#md-nombreCientifico").val(info.nombreCientifico);
    $("#md-descripcion").val(info.descripcion);
    $("#md-geoLat").val(info.geoLat);
    $("#md-geoLong").val(info.geoLong);
    $("#md-foto").val(info.foto);

    var continente = info.continente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var medio = info.medio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var alimentacion = info.alimentacion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var esqueleto = info.esqueleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    $('#md-continente option[value=default]').removeAttr('selected');
    $('#md-medio option[value=default]').removeAttr('selected');
    $('#md-alimentacion option[value=default]').removeAttr('selected');
    $('#md-esqueleto option[value=default]').removeAttr('selected');
    $('#md-continente').val(continente);
    $('#md-medio').val(medio);
    $('#md-alimentacion').val(alimentacion);
    $('#md-esqueleto').val(esqueleto);

    // Variable para que se desactive el boton "Guardar" pq los datos ya estan guardados
    datosYaGuardados = true;
}

// Funcion que se ejecuta al reproducir el video y que desactiva los botones y gestiona el solapamiento
function playPulsado() {
    // Desmarcar botones
    $("#bt-inicio").prop("disabled", true);
    $("#bt-fin").prop("disabled", true);
    $("#bt-guardar").prop("disabled", true);
    $("#bt-eliminar").prop("disabled", true);
    $("#bt-subir").prop("disabled", true);
    habilitarInputs(false);

    // Mirar si hay solapamiento actualmente
    if (solapamiento) {
        // Quitar aviso
        $(".myAlert-top").hide();
        const boxes = document.querySelectorAll('.myAlert-top');
        boxes.forEach(box => {
            box.remove();
        });

        solapamiento = false;
        inicioPulsado = false;
        updateDatos(cueActual);
    }
}

// Funcion que se ejecuta al pausar el video y que activa/desactiva los botones
function pausePulsado() {
    // Actualizar botones
    if (($("#md-inicio").val() != "") && ($("#md-fin").val() != "")) {
        habilitarInputs(true);
    }
    else {
        habilitarInputs(false);
    }

    // Si no hay metadatos en este punto
    if (cueActual == null) {
        // Se ha pulsado "Set Inicio"
        if ($("#md-inicio").val() != "") {
            $("#bt-fin").prop("disabled", false);
        }
        $("#bt-inicio").prop("disabled", false);
        $("#bt-guardar").prop("disabled", true);
        // Desactivar botones si ha habido solapamiento
        if (solapamiento) {
            $("#bt-inicio").prop("disabled", true);
            $("#bt-fin").prop("disabled", true);
        }
    }
    // Hay metadatos por tanto no se puede modificar ni el inicio ni el final
    else {
        // Si los datos son los mismos que los del fichero (sin modificar)
        if (datosYaGuardados) {
            $("#bt-guardar").prop("disabled", true);
        }
        // Si los datos ya se han modificado respecto del fichero
        else {
            $("#bt-guardar").prop("disabled", false);
        }
        if (!solapamiento) {
            $("#bt-eliminar").prop("disabled", false);
        }
    }

    // Si alguna de las cues se ha modificado permitir subir al servidor
    if (datosModificados) {
        $("#bt-subir").prop("disabled", false);
    }
}

// Funcion que se ejecuta al modificar un campo y que activa el boton "Guardar"
// cuando todos los campos estan llenos
function revisarCamposVacios() {
    // Actualizar variable global porque ya se ha modificado los datos respecto del fichero
    datosYaGuardados = false;

    // Revisar si hay algun campo vacio
    var vacios = false;
    if ($("#md-inicio").val() == "" && !vacios) vacios = true;
    if ($("#md-fin").val() == "" && !vacios) vacios = true;
    if ($("#md-nombreComun").val() == "" && !vacios) vacios = true;
    if ($("#md-nombreCientifico").val() == "" && !vacios) vacios = true;
    if ($("#md-descripcion").val() == "" && !vacios) vacios = true;
    if ($("#md-geoLat").val() == "" && !vacios) vacios = true;
    if ($("#md-geoLong").val() == "" && !vacios) vacios = true;
    if ($("#md-foto").val() == "" && !vacios) vacios = true;
    if ($('#md-continente').find(":selected").val() == "default" && !vacios) vacios = true;
    if ($('#md-medio').find(":selected").val() == "default" && !vacios) vacios = true;
    if ($('#md-alimentacion').find(":selected").val() == "default" && !vacios) vacios = true;
    if ($('#md-esqueleto').find(":selected").val() == "default" && !vacios) vacios = true;

    // Activar o desactivar el boton "Guardar"
    if (vacios || !video.paused) {
        $("#bt-guardar").prop("disabled", true);
    }
    else {
        $("#bt-guardar").prop("disabled", false);
        console.log("Todo lleno");
    }
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES POST Y GET

// Funcion que solicita al servidor los paths de los videos existentes
function peticionObtenerVideos() {
    $.get("php/consultVideos.php", {})
        .done(function (data) {
            var paths = JSON.parse(data);
            var select = document.getElementById("file-selector");
            for (var i = 0; i < paths.length; i++) {
                var option = document.createElement("option");
                option.setAttribute("value", paths[i]);
                option.innerHTML = paths[i].replace("assets/videos/", "");
                select.appendChild(option);
            }
            $('#file-selector').val("default");
            //console.log(JSON.parse(data));
        });
}

// Funcion que sube un video al servidor
function peticionSubirVideo() {
    // Mostrar aviso de cargando
    crearAviso("alert-info", "Info:", "Se está subiendo el archivo. Espera por favor.", 0);

    var file = document.getElementById("file-input").files[0];
    if (file == null) return;
    //console.log(document.getElementById("file-input").files[0]);

    // Pasar el archivo a formData
    var formData = new FormData();
    formData.append("file", file);
    formData.append("password", password);

    // Peticion POST al servidor para subir el archivo (si no existe)
    $.ajax({
        url: "php/uploadVideo.php",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (data) {
            // Contraseña incorrecta
            if (data == "false") {
                var descr = "Usuario o contraseña incorrectos. Inténtalo de nuevo."
                crearAviso("alert-danger", "Error:", descr, 4000);
                return;
            }
            // Quitar aviso
            $(".myAlert-top").hide();
            const boxes = document.querySelectorAll('.myAlert-top');
            boxes.forEach(box => {
                box.remove();
            });

            // Si ya existe un video con el mismo nombre mostrar aviso
            if (data == "existe") {
                var descr = "El vídeo seleccionado ya existe en el servidor. ";
                descr = descr + "Selecciona otro vídeo o modifícale el nombre.";
                crearAviso("alert-danger", "Aviso:", descr, 4000);
            }
            else {
                var path = data.replace("../", "");
                cargarVideo(path);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //if fails
        }
    });
}

// Funcion que sube un fichero de metadatos al servidor
function peticionSubirMetadatos() {
    var cues = video.textTracks[0].cues;
    var contenido = "WEBVTT FILE\n\n";
    for (var i = 0; i < cues.length; i++) {
        var info = JSON.parse(cues[i].text);
        var json = {
            nombreComun: info.nombreComun,
            nombreCientifico: info.nombreCientifico,
            descripcion: info.descripcion,
            geoLat: info.geoLat,
            geoLong: info.geoLong,
            continente: info.continente,
            foto: info.foto,
            medio: info.medio,
            alimentacion: info.alimentacion,
            esqueleto: info.esqueleto
        }
        var start = formatSeconds(cues[i].startTime);
        var end = formatSeconds(cues[i].endTime);
        contenido += cues[i].id + "\n" + start + " --> " + end + " \n";
        contenido += JSON.stringify(json, null, 2) + "\n\n";
    }
    //console.log(contenido);

    // Peticion POST al servidor para subir los metadatos (o sobreescribirlos)
    $.post("php/uploadMetadata.php", {
        path: "../" + pathMetadata,
        texto: contenido,
        password: password
    })
        .done(function (data) {
            // Contraseña incorrecta
            if (data == "false") {
                var descr = "Usuario o contraseña incorrectos. Inténtalo de nuevo."
                crearAviso("alert-danger", "Error:", descr, 4000);
            }
            else {
                // Crear aviso
                var descr = "Los metadatos se han guardado en el servidor."
                crearAviso("alert-success", "Éxito:", descr, 4000);

                // Actualizar botones
                $("#bt-subir").prop("disabled", true);
            }
        });
}

// Funcion que revisa si las credenciales coinciden con las del servidor
function peticionLogin() {
    password = $("#password").val();

    // Peticion POST al servidor para comprobar la contraseña
    $.post("php/login.php", {
        password: password
    })
        .done(function (data) {
            // Contraseña incorrecta
            if (data == "false") {
                var descr = "Usuario o contraseña incorrectos. Inténtalo de nuevo."
                crearAviso("alert-danger", "Error:", descr, 4000);
            }
            // Contraseña correcta
            else {
                document.getElementById("parent").remove();
                var descr = "Credenciales aceptadas. Ya puedes empezar a editar!"
                crearAviso("alert-success", "Éxito:", descr, 4000);
                $("#file-input").prop("disabled", false);
                $("#file-selector").prop("disabled", false);
            }

            // // Crear aviso
            // var descr = "Los metadatos se han guardado en el servidor."
            // crearAviso("alert-success", "Éxito:", descr, 4000);

            // // Actualizar botones
            // $("#bt-subir").prop("disabled", true);
        });
}
function enterKey(e) {
    if (e.keyCode == 13) peticionLogin();
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES AUXILIARES

// Funcion para añadir mas de 1 atributo a la vez (a un mismo elemento)
// https://stackoverflow.com/questions/12274748/setting-multiple-attributes-for-an-element-at-once-with-javascript
function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

// Funcion que cambia todas las ocurrencias de una expresion en un string
// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

// Funcion para formatear el tiempo en minutos y segundos
// https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds
function formatSeconds(time) {
    //1:43.000
    // console.log(Math.floor(time % 60))
    var minutes = ("0" + Math.floor(time / 60)).slice(-2);
    var seconds = ('0' + Math.floor(time % 60)).slice(-2);
    var milis = ("00" + (parseInt((time % 1) * 1000))).slice(-3);
    return minutes + ':' + seconds + "." + milis;
}

// Funcion que crea un aviso de bootstrap dado el tipo, titulo y descripcion
// tipo: alert-danger, alert-warning, alert-success. (Clases de Bootstrap)
function crearAviso(tipo, titulo, descr, tiempo) {
    // Crear aviso
    var aviso = document.createElement("div");
    aviso.classList.add("myAlert-top", "alert", "alert-dismissible", "fade", "show", tipo);
    aviso.innerHTML = "<strong>" + titulo + " </strong>" + descr;
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