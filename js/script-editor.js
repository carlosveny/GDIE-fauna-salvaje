/*
    Fichero que gestiona la introduccion, modificacion y eliminacion
    de metadatos en videos de animales y su posterior actualizacion
    en el servidor.
*/
// https://www.w3schools.com/php/php_file_upload.asp (file uploads php)
// https://developer.mozilla.org/en-US/docs/Web/API/TextTrack/cues (add cues)

// Funcion que se ejecuta al cargarse la pagina
function loaded() {
    // Inicializacion del media player "plyr"
    const player = new Plyr('#player');
    const video = document.querySelector('#player');
    video.addEventListener('play', (event) => {
        console.log('The Boolean paused property is now false. Either the ' +
            'play() method was called or the autoplay attribute was toggled.');
    });

    // Inicializacion del boton "Examinar"
    const input = document.querySelector('#file-input');
    input.addEventListener('input', subirVideo);

    cargarVideo("assets/animales.mp4");
}

// Funcion que sube un video al servidor
function subirVideo() {
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
            var path = data.replace("../", "");
            cargarVideo(path);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //if fails
        }
    });
}

function cargarVideo(path) {
    console.log(path);
    var src = document.createElement("source");
    setAttributes(src, { id: "video-src", src: path, type: "video/mp4" });
    document.getElementById("player").appendChild(src);
    if (document.getElementById("alerta-no-video") != null) {
        document.getElementById("alerta-no-video").remove();
    }

}

function readDatos() {
    var videoElement = document.getElementById("player");
    var textTracks = videoElement.textTracks;
    var cues = textTracks[0].cues;
    var str = replaceAll(cues[0].text, "\n", "<br>");
    document.getElementById("display-metadata").innerHTML = str;
    console.log(cues[0]);
    //console.log(JSON.parse(cues[0].text));

    $("#md-inicio").attr("value", cues[0].startTime);
    $("#md-fin").attr("value", cues[0].endTime);
    var info = JSON.parse(cues[0].text);
    $("#md-nombreComun").attr("value", info.nombreComun);
    $("#md-nombreCientifico").attr("value", info.nombreCientifico);
    $("#md-descripcion").html(info.descripcion);
    $("#md-geoLat").attr("value", info.geoLat);
    $("#md-geoLong").attr("value", info.geoLong);
    $("#md-foto").attr("value", info.foto);

    var continente = info.continente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var medio = info.medio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var alimentacion = info.alimentacion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var esqueleto = info.esqueleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    $('#md-continente option[value=default]').removeAttr('selected');
    $('#md-medio option[value=default]').removeAttr('selected');
    $('#md-alimentacion option[value=default]').removeAttr('selected');
    $('#md-esqueleto option[value=default]').removeAttr('selected');
    $('#md-continente option[value=' + continente + ']').attr('selected', "");
    $('#md-medio option[value=' + medio + ']').attr('selected', "");
    $('#md-alimentacion option[value=' + alimentacion + ']').attr('selected', "");
    $('#md-esqueleto option[value=' + esqueleto + ']').attr('selected', "");
}

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