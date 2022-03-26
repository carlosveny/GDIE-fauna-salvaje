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
// Si los datos se cargan del fichero y no se han modificado no se tienen que poder guardar de nuevo
var datosYaGuardados = false;

// Funcion que se ejecuta al cargarse la pagina
function loaded() {
    // Inicializacion variable global
    video = document.getElementById("miVideo");

    // Inicializacion del media player "plyr"
    const player = new Plyr('#miVideo', {
        invertTime: false,
        toggleInvert: false
    });

    // Inicializacion del boton "Examinar"
    const input = document.querySelector('#file-input');
    input.addEventListener('input', peticionSubirVideo);

    // Inicializacion del dropdown "Video Existente"
    peticionObtenerVideos();

    cargarVideo("assets/animales.mp4");
}

// Funcion que carga un video dado su path
function cargarVideo(path) {
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
    var track = document.createElement("track");
    setAttributes(track, { id: "track", kind: "metadata", label: "Metadatos" });
    track.setAttribute("src", "assets/videos/animales-metadata.vtt");
    track.default = true;
    //track.addEventListener("load", readDatos);
    video.appendChild(track);

    // Configurar los eventos
    video.addEventListener('play', (event) => {
        $("#bt-inicio").prop("disabled", true);
        $("#bt-fin").prop("disabled", true);
        $("#bt-guardar").prop("disabled", true);
        $("#bt-eliminar").prop("disabled", true);
        $("#bt-subir").prop("disabled", true);
    });
    video.addEventListener('pause', pausePulsado);
}

// Funcion que lee los metadatos de un video y los rellena en la parte derecha
function updateDatos() {
    var textTracks = video.textTracks;
    var cues = textTracks[0].cues;
    //console.log(cues[0]);
    console.log(formatSeconds(video.currentTime));

    // Bucle que recorre todas las cues para ver cual coincide con el segundo actual
    for (var i = 0; i < cues.length; i++) {
        // Si coincide el tiempo actual con el de la cue
        console.log(video.currentTime + ": " + cues[i].startTime + " - " + cues[i].endTime);
        if ((video.currentTime > cues[i].startTime) && (video.currentTime < cues[i].endTime)) {
            // Revisar si antes ya se ha cargado la cue actual
            if (cues[i] != cueActual) {
                cueActual = cues[i];
                break; // Salir del bucle
            }
            else {
                return; // Los datos ya estan actualizados con la cue actual
            }
        }
        // Si es la ultima cue y tampoco coincide
        else if (i == (cues.length - 1)) {
            borrarCampos(); // Ponerlo todo en blanco
            cueActual = null;
            return;
        }
    }

    // Actualizar campos con la cue actual (aqui solo se llega si hay que actualizar)
    $("#md-inicio").val(formatSeconds(cueActual.startTime));
    $("#md-fin").val(formatSeconds(cueActual.endTime));
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
}

// Funcion que crea un aviso de bootstrap dado el tipo, titulo y descripcion
// tipo: alert-danger, alert-warning, alert-success. (Clases de Bootstrap)
function crearAviso(tipo, titulo, descr) {
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

    // Mostrar y ocultar tras 4 segundos
    $(".myAlert-top").show();
    setTimeout(function () {
        $(".myAlert-top").hide();
    }, 4000);
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES QUE MANEJAN EVENTOS

// Funcion que se ejecuta al pausar el video y que activa/desactiva los botones
function pausePulsado() {
    // Si no hay metadatos en este punto
    if (cueActual == null) {
        $("#bt-inicio").prop("disabled", false);
        $("#bt-guardar").prop("disabled", true);
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
        $("#bt-eliminar").prop("disabled", false);
    }
}

// Funcion que activa el boton "Guardar" cuando todos los campos estan llenos
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
    if (vacios) {
        $("#bt-guardar").prop("disabled", true);
    }
    else {
        $("#bt-guardar").prop("disabled", false);
        console.log("Todo lleno");
    }
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES POST Y GET

// Funcion que sube un video al servidor
function peticionSubirVideo() {
    var file = document.getElementById("file-input").files[0];
    if (file == null) return;
    //console.log(document.getElementById("file-input").files[0]);

    // Pasar el archivo a formData
    var formData = new FormData();
    formData.append("file", file);

    // Peticion POST al servidor para subir el archivo (si no existe)
    $.ajax({
        url: "php/uploadVideo.php",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (data) {
            // Si ya existe un video con el mismo nombre mostrar aviso
            if (data == "existe") {
                var descr = "El vídeo seleccionado ya existe en el servidor. ";
                descr = descr + "Selecciona otro vídeo o modifícale el nombre.";
                crearAviso("alert-danger", "Aviso:", descr);
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
            //console.log(JSON.parse(data));
        });
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES AUXILIARES

// Funcion auxiliar para añadir mas de 1 atributo a la vez (a un mismo elemento)
// https://stackoverflow.com/questions/12274748/setting-multiple-attributes-for-an-element-at-once-with-javascript
function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

// Funcion auxiliar que cambia todas las ocurrencias de una expresion en un string
// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

// Funcion para formatear el tiempo en minutos y segundos
// https://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds
function formatSeconds(time) {
    //1:43
    // console.log(Math.floor(time % 60))
    var minutes = ("0" + Math.floor(time / 60)).slice(-2);
    var seconds = ('0' + Math.floor(time % 60)).slice(-2);
    return minutes + ':' + seconds;
}