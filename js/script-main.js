function loaded() {
    // Inicializacion del media player "plyr"
    const player = new Plyr('#player');
    const video = document.querySelector('#player');
    video.addEventListener('play', (event) => {
        console.log('The Boolean paused property is now false. Either the ' +
            'play() method was called or the autoplay attribute was toggled.');
    });

    cargarVideo("assets/animales.mp4");


    //Inicialización botones filtros
    cargarFiltros();
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
    console.log(JSON.parse(cues[0].text));

    var info = JSON.parse(cues[0].text);
    $("#nombreComun").text(info.nombreComun);
    $("#nombreCientifico").text(info.nombreCientifico);
    $("#descripcion").html(info.descripcion);

    var continente = info.continente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var medio = info.medio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var alimentacion = info.alimentacion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var esqueleto = info.esqueleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    $("#alimentacion").text(info.alimentacion);
    $("#iconoAlimentacion").attr("src", "assets/icons/"+ alimentacion +".ico" );
    console.log(alimentacion);
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
    var filtro = crearElementoFiltro("esto");
    document.getElementById("filtroAnimales").appendChild(filtro);
    filtro = crearElementoFiltro("es");
    document.getElementById("filtroAnimales").appendChild(filtro);
    filtro = crearElementoFiltro("una");
    document.getElementById("filtroAnimales").appendChild(filtro);

    divisor = crearDivisorFiltro();
    document.getElementById("filtroAnimales").appendChild(divisor);

    filtro = crearElementoFiltro("prueba");
    document.getElementById("filtroAnimales").appendChild(filtro);


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