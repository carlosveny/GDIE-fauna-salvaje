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
var pathSubtitulos1;
var pathsVideos = []; // array doble de paths de videos [0]: .mp4 [1]: .webm
// Si los datos se cargan del fichero y no se han modificado no se tienen que poder guardar de nuevo
var datosYaGuardados = false; // hace referencia a cada cue
// Para saber si activar/desactivar el boton "Subir al servidor"
var datosModificados = false; // hace referencia a todo el text track
var inicioPulsado = false; // para controlar la superposicion de datos
var solapamiento = false; // para controlar la superposicion de datos
var password; // contraseña para operaciones con el servidor
var subtitulos = false;

// Funcion que se ejecuta al cargarse la pagina
function loaded() {
    // Inicializar login (revisar en local storage si hay contraseña)
    var pw = localStorage.getItem("password");
    if (pw != null) {
        $("#password").val(pw);
        peticionLogin()
    }

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
    setAttributes(input, { class: "max-w-files", type: "file", id: "file-input", accept: "video/mp4, video/webm" });
    input.addEventListener('input', peticionSubirVideo);
    document.getElementById("file-input-div").appendChild(input);
    $("#file-input").prop("disabled", true);

    // Inicializacion dropdown "Video Existente"
    peticionObtenerVideos();
    $("#file-selector").prop("disabled", true);

    // Inicializacion dropdowns "tipo de datos" y "moverACue"
    $("#metadata-selector").val("default");
    $("#metadata-selector").prop("disabled", true);
    $("#cue-selector").val("default");
    $("#cue-selector").prop("disabled", true);

    // Desmarcar botones
    $("#bt-inicio").prop("disabled", true);
    $("#bt-fin").prop("disabled", true);
    $("#bt-guardar").prop("disabled", true);
    $("#bt-eliminar").prop("disabled", true);
    $("#bt-subir").prop("disabled", true);
    habilitarInputs(false);

    //peticionLogin();
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
    var descr = "El vídeo se ha cargado correctamente. También se han ";
    descr += "detectado y cargado los ficheros de metadatos.";
    if ($("#file-selector").val() == null) {
        descr = "El vídeo se ha subido al servidor. También se han creado los ficheros ";
        descr += "de metadatos vacíos porque no se han detectado metadatos para este vídeo."
    }
    crearAviso("alert-success", "Éxito:", descr, 5500);

    // Si es un objeto se ha elegido un video existente
    if ((typeof path) == "object") {
        path = path.value;
        console.log(path);
    }

    // Crear elemento "source"
    var idx;
    if (pathsVideos != null) {
        for (var i = 0; i < pathsVideos.length; i++) {
            if (pathsVideos[i][0] == path) {
                idx = i;
                break;
            }
        }
    }
    // Si solo hay 1 extension
    if ((pathsVideos == null) || (pathsVideos[idx][1] == null)) {
        var ext = "video/mp4";
        if (!path.includes(".mp4")) ext = "video/webm";
        var src = document.createElement("source");
        setAttributes(src, { id: "video-src", src: path, type: ext });
        video.appendChild(src);
    }
    // Hay 2 extensiones del mismo video
    else {
        var src = document.createElement("source");
        setAttributes(src, { id: "video-src1", src: pathsVideos[idx][0], type: "video/mp4" });
        video.appendChild(src);
        var src = document.createElement("source");
        setAttributes(src, { id: "video-src2", src: pathsVideos[idx][1], type: "video/webm" });
        video.appendChild(src);
        path = pathsVideos[idx][0];
    }
    if (document.getElementById("alerta-no-video") != null) {
        document.getElementById("alerta-no-video").remove();
    }


    // Deshabilitar la seleccion de nuevos videos
    document.getElementById("file-input").disabled = true;
    document.getElementById("file-selector").disabled = true;

    // Actualizar variables de paths de metadatos para cargarlos posteriormente
    $("#metadata-selector").prop("disabled", false);
    if (path.includes(".mp4")) {
        pathMetadata = path.replace(".mp4", "-metadata.vtt");
        pathSubtitulos1 = path.replace(".mp4", "-castellano.vtt");
    }
    else {
        pathMetadata = path.replace(".webm", "-metadata.vtt");
        pathSubtitulos1 = path.replace(".webm", "-castellano.vtt");
    }


    // Configurar los listeners del video
    video.addEventListener('play', playPulsado);
    video.addEventListener('pause', pausePulsado);
    video.addEventListener('timeupdate', (event) => {
        // Actualizar botones
        if (($("#md-inicio").val() != "") && ($("#md-fin").val() != "") && video.paused) {
            habilitarInputs(true);
        }
        else {
            var cueActual = video.textTracks[0].activeCues[0];
            if (cueActual != null && video.paused) {
                habilitarInputs(true);
                $("#bt-inicio").prop("disabled", true);
                $("#bt-fin").prop("disabled", true);
                $("#bt-eliminar").prop("disabled", false);
                $("#bt-guardar").prop("disabled", true);
            }
            else habilitarInputs(false);
        }
    });
}

// Funcion que deja todos los campos de inputs (metadatos) en blanco
function borrarCampos() {
    $("#md-inicio").val('');
    $("#md-fin").val('');
    $("#md-español").val('');
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
    var cue;
    if (subtitulos) {
        cue = new VTTCue(startTime, endTime, $('#md-español').val());
    }
    else {
        cue = new VTTCue(startTime, endTime, JSON.stringify(contenidoJSON));
        cue.id = $('#md-nombreComun').val().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }
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
    $("#md-español").prop("disabled", !enable);
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

// Funcion que actualiza el dropdown con el listado de las cues existentes
function actualizarDropdownCues() {
    // Borrar opciones actuales
    var select = document.getElementById("cue-selector");
    while (select.lastChild.value != "default") {
        select.removeChild(select.lastChild);
    }

    // Crear nuevas opciones
    var cues = video.textTracks[0].cues;
    console.log(cues);
    var select = document.getElementById("cue-selector");
    for (var i = 0; i < cues.length; i++) {
        // Guardar startTime y poner el titulo (id o parte del subtitulo)
        var option = document.createElement("option");
        option.setAttribute("value", cues[i].startTime + 0.1);
        var time = formatSeconds(cues[i].startTime, false);
        if (subtitulos) {
            var subt = cues[i].text.substring(0, 9) + "...";
            option.innerHTML = "[" + time + "] " + subt;
        }
        else {
            var time
            option.innerHTML = "[" + time + "] " + cues[i].id;
        }
        select.appendChild(option);
    }
}

// Funcion que posiciona el video en el momento de una cue
function irACue(time) {
    video.currentTime = time.value;
    $("#cue-selector").val("default");
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
    // Actualizar variables globales y activar boton "Subir al servidor"
    inicioPulsado = false;
    datosModificados = true; // referente a todo el text track
    $("#bt-subir").prop("disabled", false);

    // Obtener cue actual
    var activeCues = video.textTracks[0].activeCues;

    // Borrar cue del text track y actualizar dropdown de cues
    video.textTracks[0].removeCue(activeCues[0]);
    actualizarDropdownCues();

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

    // Crear nueva cue y actualizar dropdown de cues
    crearCue();
    actualizarDropdownCues();

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
    // Evitar errores
    video.play();
    video.pause();

    // Habilitar y generar dropdown "irACue"
    $("#cue-selector").prop("disabled", false);
    actualizarDropdownCues();

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

    // Revisar que no se tenga que reproducir ya una cue
    var activeCue = video.textTracks[0].activeCues[0];
    if (activeCue != null) {
        updateDatos(activeCue);
    }
}

// Funcion que se ejecuta al activarse/desactivarse una cue y actualiza los datos (parte derecha)
function updateDatos(cue) {
    console.log(cue);
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

    if (subtitulos) {
        $("#md-español").val(cueActual.text);
    }
    else {
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
    }

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
    if (subtitulos) {
        if ($("#md-español").val() == "") vacios = true;
    }
    else {
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
    }

    // Activar o desactivar el boton "Guardar"
    if (vacios || !video.paused) {
        $("#bt-guardar").prop("disabled", true);
    }
    else {
        $("#bt-guardar").prop("disabled", false);
        console.log("Todo lleno");
    }
}

// Funcion que muestra los campos de metadatos/subtitulos
function cambiarTipoMetadatos() {
    $("#metadata-selector").prop("disabled", true);
    var random = Math.floor(Math.random() * 10000);
    if ($("#metadata-selector").val() == "metadatos") {
        document.getElementById("container-metadatos").style.removeProperty("display");
        document.getElementById("container-subtitulos").remove();

        // Cargar fichero de metadatos
        var track1 = document.createElement("track");
        setAttributes(track1, { id: "track", kind: "metadata", label: "Metadatos" });
        track1.setAttribute("src", pathMetadata + "?" + random);
        track1.addEventListener("load", loadedMetadatos);
        track1.default = true;
        video.appendChild(track1);
    }
    else {
        subtitulos = true;
        document.getElementById("container-subtitulos").style.removeProperty("display");
        document.getElementById("container-metadatos").remove();

        // Cargar fichero de subtitulos
        var track2 = document.createElement("track");
        setAttributes(track2, { id: "español", kind: "subtitles", label: "Español", srclang: "es" });
        track2.setAttribute("src", pathSubtitulos1 + "?" + random);
        track2.addEventListener("load", loadedMetadatos);
        track2.default = true;
        video.appendChild(track2);
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

                // Llenar array multidimensional de paths
                // (si es el mismo archivo con distinta extension, misma posicion del array)
                pathsVideos.push([paths[i], null]);
                if (paths[i].includes(".mp4")) {
                    if (paths.includes(paths[i].replace(".mp4", ".webm"))) {
                        // Video en .mp4 y .webm
                        var idx = paths.indexOf(paths[i].replace(".mp4", ".webm"))
                        pathsVideos[i][1] = paths[idx];
                        paths.splice(idx, 1);
                        option.innerHTML = paths[i].replace("assets/videos/", "").replace(".mp4", " (mp4/webm)");
                    }
                    else {
                        // Video solo en .mp4
                        option.innerHTML = paths[i].replace("assets/videos/", "").replace(".mp4", " (mp4)");
                    }
                }
                else {
                    // Video solo en .webm
                    option.innerHTML = paths[i].replace("assets/videos/", "").replace(".webm", " (webm)");
                }

                select.appendChild(option);
            }
            $('#file-selector').val("default");
            //console.log(JSON.parse(data));
        });
}

// Funcion que sube un video al servidor
function peticionSubirVideo() {
    // Revisar la extension (por si tiene mayusculas)
    var name = document.getElementById("file-input").files[0].name;
    if ((!name.includes(".mp4")) && (!name.includes(".webm"))) {
        var descr = "El vídeo seleccionado no tiene el formato adecuado (.mp4 o .webm).";
        descr = descr + " Revisa las mayúsculas.";
        crearAviso("alert-danger", "Error:", descr, 4000);
        return;
    }

    pathsVideos = null; // Para evitar errores al cargar el path
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
                // Quitar aviso
                $(".myAlert-top").hide();
                const boxes = document.querySelectorAll('.myAlert-top');
                boxes.forEach(box => {
                    box.remove();
                });

                var descr = "Usuario o contraseña incorrectos. Inténtalo de nuevo."
                crearAviso("alert-danger", "Error:", descr, 4000);
                return;
            }
            // Si ya existe un video con el mismo nombre mostrar aviso
            else if (data == "existe") {
                // Quitar aviso
                $(".myAlert-top").hide();
                const boxes = document.querySelectorAll('.myAlert-top');
                boxes.forEach(box => {
                    box.remove();
                });

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
        var start = formatSeconds(cues[i].startTime);
        var end = formatSeconds(cues[i].endTime);
        contenido += cues[i].id + "\n" + start + " --> " + end + " \n";
        if (subtitulos) {
            contenido += cues[i].text + "\n\n";
        }
        else {
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
            contenido += JSON.stringify(json, null, 2) + "\n\n";
        }
    }

    var pth = "../" + pathMetadata;
    if (subtitulos) {
        pth = "../" + pathSubtitulos1;
    }
    //console.log(contenido);

    // Peticion POST al servidor para subir los metadatos (o sobreescribirlos)
    $.post("php/uploadMetadata.php", {
        path: pth,
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
                $("#username").val("");
                $("#password").val("");
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

                // Guardar en local storage
                localStorage.setItem("password", password);
            }
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
function formatSeconds(time, mil) {
    //1:43.000
    var minutes = ("0" + Math.floor(time / 60)).slice(-2);
    var seconds = ('0' + Math.floor(time % 60)).slice(-2);
    var milis = ("00" + (parseInt((time % 1) * 1000))).slice(-3);
    if (mil != null) {
        return minutes + ':' + seconds;
    }
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
