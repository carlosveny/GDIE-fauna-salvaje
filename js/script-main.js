
var video; // objeto de video
var cueActual; // VTTCue actual
var allCues; //Cues del video actual

//var seleccionAnimal = "todos";
var seleccionAlimentacion = "todos";
var seleccionMedio = "todos";
var seleccionEsqueleto = "todos";
var seleccionContinente = "todos";

function loaded() {
    // Inicializacion variable global
    video = document.getElementById("player");

    // Inicializacion del media player "plyr"
    const player = new Plyr('#player', {
        invertTime: false,
        toggleInvert: false
    });
    peticionObtenerVideos();

    cargarVideo("assets/animales.mp4");

}

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

    // Cargar fichero de metadatos
    var track = document.createElement("track");
    setAttributes(track, { id: "track", kind: "metadata", label: "Metadatos" });
    track.setAttribute("src", "assets/videos/animales-metadata.vtt");
    track.default = true;
    track.addEventListener("load", loadedMetadatos);
    //Inicialización botones filtros al cargarse los cues
    track.addEventListener("load", cargarFiltros);
    video.appendChild(track);

}

//Funcion que actualiza los cues que se van a mostrar según los filtros activos
function actualizaFiltros(filtro, seleccion) {

    console.log("filtro: " + filtro + " selección: " + seleccion);
    switch (filtro) {
        /* case "video":
             break;*/
        case "animales":
            seleccionAlimentacion = "todos";
            seleccionMedio = "todos";
            seleccionEsqueleto = "todos";
            seleccionContinente = "todos";

            if (seleccion == "todos"){
                video.currentTime = 0;
                video.play();
                break;
            }
            //saltar al animal directamente
            for (var i = 0; i < allCues.length; i++) { //se puede cambiar el for para usar if (cumpleFiltros) pero da problemas de momento
                var info = JSON.parse(allCues[i].text);
                info = info.nombreComun.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                if (info == seleccion) {
                    video.currentTime = allCues[i].startTime;
                    break;
                }
            }
            break;
        case "alimentacion":
            //actualizar variable de filtro y saltar al primer animal que cumple con el requisito
            seleccionAlimentacion = seleccion;

            for (var i = 0; i < allCues.length; i++) {
                if (cumpleFiltros(i)) {
                    video.currentTime = allCues[i].startTime;
                    break;
                }
            }
            break;
        case "medio":
            seleccionMedio = seleccion;
            for (var i = 0; i < allCues.length; i++) {
                if (cumpleFiltros(i)) {
                    video.currentTime = allCues[i].startTime;
                    break;
                }
            }
            break;
        case "esqueleto":
            seleccionEsqueleto = seleccion;
            for (var i = 0; i < allCues.length; i++) {
                if (cumpleFiltros(i)) {
                    video.currentTime = allCues[i].startTime;
                    break;
                }
            }
            break;
        case "continente":
            seleccionContinente = seleccion;
            for (var i = 0; i < allCues.length; i++) {
                if (cumpleFiltros(i)) {
                    video.currentTime = allCues[i].startTime;
                    break;
                }
            }
            break;
        default:
            console.log("es un video");
    }
}

//devuelve el tiempo para el siguiente cue que cumpla los filtros
function siguienteCue(numCueAct) {
    var cues = video.textTracks[0].cues;
    console.log("cargar siguiente cue");
    //si no quedan más cues ...
    if (numCueAct + 1 > cues.length) {
        return null;
    }

    for (var i = numCueAct + 1; i < cues.length; i++) {
        if (cumpleFiltros(i)) {
            console.log(cues[i].startTime);
            return cues[i].startTime;
        }
    }

    return null;
}

function cumpleFiltros(numCue) {
    var cues = video.textTracks[0].cues;
    //console.log(cues.length)
    if (cues.length <= numCue) {
        video.pause();
        return true;
    }

    var cue = cues[numCue];

    var info = JSON.parse(cue.text);

    var alimentacionActual = info.alimentacion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var medioActual = info.medio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var esqueletoActual = info.esqueleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var continenteActual = info.continente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    //if que mira si algún filtro no se cumple para el cue pasado por parametro
    if ((alimentacionActual == seleccionAlimentacion || seleccionAlimentacion == "todos") && (medioActual == seleccionMedio || seleccionMedio == "todos") &&
        (esqueletoActual == seleccionEsqueleto || seleccionEsqueleto == "todos") && (continenteActual == seleccionContinente || seleccionContinente == "todos")) {
        //console.log("cumple filtro")
        return true;
    }
    //console.log("no cumple filtro")
    return false;
}





/* ---------------------------------------------------------------------------- */

// FUNCIONES QUE MANEJAN EVENTOS

// Funcion que se ejecuta al cargarse los metadatos y configura los listeners
function loadedMetadatos() {

    // Configurar los eventos de los metadatos
    var cues = video.textTracks[0].cues;
    allCues = cues;
    for (var i = 0; i < cues.length; i++) {
        cues[i].addEventListener('enter', event => {
            updateDatos(event.target);
        });
        cues[i].addEventListener('exit', event => {
            var activeCue = video.textTracks[0].activeCues[0];
            //si el cue inmediatamente siguiente al actual no cumple los filtros se salta al siguiente que sí los cumpla
            if (!cumpleFiltros(getNumCue(cueActual) + 1)) {
                var tiempo = siguienteCue(getNumCue(cueActual));
                video.currentTime = tiempo;
            }

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


function updateDatos(cue) {
    // Si es null significa que la cue ya ha emitido "exit"
    if (cue == null) {
        cueActual = null;
        return;
    }
    cueActual = cue;


    //var textTracks = video.textTracks;
    //var cues = textTracks[0].cues;
    //console.log(JSON.parse(cues[0].text));

    var info = JSON.parse(cueActual.text);
    $("#nombreComun").text(info.nombreComun);
    $("#nombreCientifico").text(info.nombreCientifico);
    $("#descripcion").html(info.descripcion);

    var continente = info.continente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var medio = info.medio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var alimentacion = info.alimentacion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var esqueleto = info.esqueleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    $("#alimentacion").text(info.alimentacion);
    $("#iconoAlimentacion").attr("src", "assets/icons/" + alimentacion + ".ico");
    if (seleccionAlimentacion != "todos"){
        $("#lock-alimentacion").attr("src", "assets/icons/locked.ico");
    }else{
        $("#lock-alimentacion").attr("src", "assets/icons/unlocked.ico");
    }
    
    $("#medio").text(info.medio);
    $("#iconoMedio").attr("src", "assets/icons/" + medio + ".ico");
    if (seleccionMedio != "todos"){
        $("#lock-medio").attr("src", "assets/icons/locked.ico");
    }else{
        $("#lock-medio").attr("src", "assets/icons/unlocked.ico");
    }

    $("#esqueleto").text(info.esqueleto);
    $("#iconoEsqueleto").attr("src", "assets/icons/" + esqueleto + ".ico");
    if (seleccionEsqueleto != "todos"){
        $("#lock-esqueleto").attr("src", "assets/icons/locked.ico");
    }else{
        $("#lock-esqueleto").attr("src", "assets/icons/unlocked.ico");
    }

    /* $("#md-geoLat").attr("value", info.geoLat);
    $("#md-geoLong").attr("value", info.geoLong);
    $("#md-foto").attr("value", info.foto); */



}

//Función que carga los filtros disponibles en la página principal según los datos del fichero .vtt
function cargarFiltros() {

    var cues = video.textTracks[0].cues;

    var animales = [];
    var alimentacion = [];
    var medio = [];
    var esqueleto = [];
    var continente = [];

    var info;

    //Se recorren todos los cues y se añaden todos los filtros disponibles a los arrays
    for (var i = 0; i < cues.length; i++) {
        info = JSON.parse(cues[i].text);
        checkArray(animales, info.nombreComun);
        checkArray(alimentacion, info.alimentacion);
        checkArray(medio, info.medio);
        checkArray(esqueleto, info.esqueleto);
        checkArray(continente, info.continente);
    }

    cargarDesplegable(animales, "filtroAnimales");
    cargarDesplegable(alimentacion, "filtroAlimentacion");
    cargarDesplegable(medio, "filtroMedio");
    cargarDesplegable(esqueleto, "filtroEsqueleto");
    cargarDesplegable(continente, "filtroContinente");


}

function cargarDesplegable(array, id) {
    var filtro;
    var tipoFiltro = id.replace("filtro", "");
    tipoFiltro = tipoFiltro.toLowerCase();
    for (var i = 0; i < array.length; i++) {
        filtro = crearElementoFiltro(array[i], tipoFiltro);
        document.getElementById(id).appendChild(filtro);
    }
    var divisor = crearDivisorFiltro();
    document.getElementById(id).appendChild(divisor);
    filtro = crearElementoFiltro("Ver todos", tipoFiltro);
    document.getElementById(id).appendChild(filtro);
}

//Función que crea un elemento con el formato de las opciones de los filtros
function crearElementoFiltro(nombre, tipoFiltro) {
    var filtro = document.createElement("li");
    var link = document.createElement("a");
    var texto = document.createTextNode(nombre);
    link.appendChild(texto);
    var normalizado = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    normalizado = normalizado.replace("ver ", "");
    setAttributes(link, { class: "dropdown-item", href: "#", onclick: "actualizaFiltros(\'" + tipoFiltro + "\', \'" + normalizado + "\');" });
    filtro.appendChild(link);
    return filtro;
}

function crearDivisorFiltro() {
    var divisor = document.createElement("li");
    var hr = document.createElement("hr");
    setAttributes(hr, { class: "dropdown-divider" });
    divisor.appendChild(hr);
    return divisor;
}

function debug() {
    console.log("Succsessful!")
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES POST Y GET

// Funcion que solicita al servidor los paths de los videos existentes
function peticionObtenerVideos() {
    $.get("php/consultVideos.php", {})
        .done(function (data) {
            var paths = JSON.parse(data);
            var filtro;
            for (var i = 0; i < paths.length; i++) {
                var nombre = paths[i].replace("assets/videos/", "");
                nombre = nombre.replace(".mp4", "");
                nombre = nombre.replace(".ogg", "");
                nombre = nombre.replace(".webm", "");
                nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
                filtro = crearElementoFiltro(nombre);
                document.getElementById("filtroVideos").appendChild(filtro);
            }
        });
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
//Funcion auxiliar que comprueba si un array contiene una palabra y si no la contiene la añade (añadir que se mantenga un orden ej. alfabético o preestablecido)
function checkArray(array, nuevaPalabra) {
    //console.log(nuevaPalabra);
    if (!array.includes(nuevaPalabra)) {
        array.push(nuevaPalabra);
    }
    //return array
}

//Funcion que devuelve el número de cue correspondiente al siguiente cue del pasado por parametro
function getNumCue(cue) {
    var cues = video.textTracks[0].cues;
    for (var i = 0; i < cues.length; i++) {
        if (cues[i].id == cue.id) {
            return i;
        }
    }
}