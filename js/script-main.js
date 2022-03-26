
var video; // objeto de video
var cueActual; // VTTCue actual

function loaded() {
    // Inicializacion variable global
    video = document.getElementById("player");

    // Inicializacion del media player "plyr"
    const player = new Plyr('#player', {
        invertTime: false,
        toggleInvert: false
    });
    
    cargarVideo("assets/animales.mp4");

    //Inicialización botones filtros
    
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
    video.appendChild(track);

}


/* ---------------------------------------------------------------------------- */

// FUNCIONES QUE MANEJAN EVENTOS

// Funcion que se ejecuta al cargarse los metadatos y configura los listeners
function loadedMetadatos() {
    //cargar los filtros de la home page cuando se carguen los cues
    cargarFiltros();

    // Configurar los eventos de los metadatos
    var cues = video.textTracks[0].cues;
    for (var i = 0; i < cues.length; i++) {
        cues[i].addEventListener('enter', event => {
            updateDatos(event.target);
        });
        cues[i].addEventListener('exit', event => {
            updateDatos(null);
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
    $("#iconoAlimentacion").attr("src", "assets/icons/"+ alimentacion +".ico" );
    $("#medio").text(info.medio);
    $("#iconoMedio").attr("src", "assets/icons/"+ medio +".ico" );
    $("#esqueleto").text(info.esqueleto);
    $("#iconoEsqueleto").attr("src", "assets/icons/"+ esqueleto +".ico" );

    /* $("#md-geoLat").attr("value", info.geoLat);
    $("#md-geoLong").attr("value", info.geoLong);
    $("#md-foto").attr("value", info.foto); */ 

    

}

//Función que carga los filtros disponibles en la página principal según los datos del fichero .vtt
function cargarFiltros(){

    var cues = video.textTracks[0].cues;

    var animales = [];
    var alimentacion = [];
    var medio = [];
    var esqueleto = [];
    var continente = [];

    var info;

    console.log(cues);

    //Se recorren todos los cues y se añaden todos los filtros disponibles a los arrays
    for (var i = 0; i < cues.length; i++) {
        info = JSON.parse(cues[i].text);
        console.log(info);
        checkArray(animales, info.nombreComun);
        checkArray(alimentacion, info.alimentacion);
        checkArray(medio, info.medio);
        checkArray(esqueleto, info.esqueleto);
        checkArray(continente, info.continente);
    }

    console.log(animales);

    cargarDesplegable(animales, "filtroAnimales");
    cargarDesplegable(alimentacion, "filtroAlimentacion");
    cargarDesplegable(medio, "filtroMedio");
    cargarDesplegable(esqueleto, "filtroEsqueleto");
    cargarDesplegable(continente, "filtroContinente");


}

function cargarDesplegable(array, id) {
    var filtro;
    for (var i = 0; i < array.length; i++){
        filtro = crearElementoFiltro(array[i]);
        document.getElementById(id).appendChild(filtro);
    }
    var divisor = crearDivisorFiltro();
    document.getElementById(id).appendChild(divisor);
    filtro = crearElementoFiltro("Ver todos");
    document.getElementById(id).appendChild(filtro);
}

//Función que crea un elemento con el formato de las opciones de los filtros
function crearElementoFiltro(nombre){
    var filtro = document.createElement("li");
    var link = document.createElement("a");
    var texto = document.createTextNode(nombre);
    link.appendChild(texto);
    setAttributes(link, {class: "dropdown-item", href: "#", onclick: "debug();"});
    filtro.appendChild(link);
    return filtro;
}

function crearDivisorFiltro(){
    var divisor = document.createElement("li");
    var hr = document.createElement("hr");
    setAttributes(hr, {class: "dropdown-divider"});
    divisor.appendChild(hr);
    return divisor;
}

function debug(){
    console.log("Succsessful!")
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
    console.log(nuevaPalabra);
    console.log(array.includes(nuevaPalabra));
    if (!array.includes(nuevaPalabra)) {
        array.push(nuevaPalabra);
    }
    //return array
}