/* ---------------------------------------------------------------------------- */


/* ---------------------------------------------------------------------------- */

//GLOBAL
var video; // objeto de video
var cueActual; // VTTCue actual
var allCues; //Cues del video actual

//Control filtros
var seleccionAnimal = "todos";
var seleccionAlimentacion = "todos";
var seleccionMedio = "todos";
var seleccionEsqueleto = "todos";
var seleccionContinente = "todos";

//Gestión funcionalidad filtros
//var usadoFiltro = true;
var seguirReproduccion = true;
var nuevoCambio = false;

//Gestión mapa
var map;
var geoJson;
var geoJson2;
var casoAmerica; //booleana, true si se marca América en el mapa
var pinAnimal;
//                      Africa                      Asia                        America                      Europa                      Oceania                       Antártida
var centroContinentes = [["2.089165", "23.420877"], ["32.833621", "90.013133"], ["14.585737", "-85.387716"], ["56.625777", "29.137090"], ["-27.718539", "142.608864"], ["-75.775488", "38.663171"]];


/* ---------------------------------------------------------------------------- */
//FUNCIONES
/* ---------------------------------------------------------------------------- */

//Función inicial tras cargar la página
function loaded() {
    // Inicializacion variable global
    video = document.getElementById("player");

    // Inicializacion del media player "plyr"
    const player = new Plyr('#player', {
        invertTime: false,
        toggleInvert: false
    });
    peticionObtenerVideos();

    /* video.onseeked = function () {
        clearFiltros();
    }; */

    //cargarVideo("assets/animales.mp4");
    cargarMapa("todo");
}

/* ---------------------------------------------------------------------------- */

//FUNCIONES INICIALIZACIÓN Y CONTROL PLAYER

//Función que carga un video en el player con sus correspondientes tracks
function cargarVideo(path) {
    // Si es un objeto se ha elegido un video existente
    if ((typeof path) == "object") {
        path = path.value;
        console.log(path);
    }

    var pathMP4, pathWebm;
    if (path.includes(".mp4")) {
        pathMP4 = path;
        pathWebm = path.replace("mp4", "webm");
    }
    else {
        pathWebm = path;
        pathMP4 = path.replace("webm", "mp4");
    }

    // Crear elemento "source" con MP4
    var src = document.createElement("source");
    setAttributes(src, { id: "video-src", src: pathMP4, type: "video/mp4" });
    video.appendChild(src);

    // Crear elemento "source" con webm
    var src2 = document.createElement("source");
    setAttributes(src2, { id: "video-src2", src: pathWebm, type: "video/webm" });
    video.appendChild(src2);

    var pathMetadata;
    var pathSubtitulos1;

    // Cargar fichero de metadatos
    if (path.includes(".mp4")) {
        pathMetadata = path.replace(".mp4", "-metadata.vtt");
        pathSubtitulos1 = path.replace(".mp4", "-castellano.vtt");
    }
    else {
        pathMetadata = path.replace(".webm", "-metadata.vtt");
        pathSubtitulos1 = path.replace(".webm", "-castellano.vtt");
    }

    // Cargar fichero de metadatos
    var track = document.createElement("track");
    setAttributes(track, { id: "track", kind: "metadata", label: "Metadatos" });
    var random = Math.random();
    track.setAttribute("src", pathMetadata + "?" + random); //Añadido ? + random cortesía de carlos
    track.default = true;
    track.addEventListener("load", loadedMetadatos);

    //Inicialización botones filtros al cargarse los cues
    track.addEventListener("load", cargarFiltros);
    video.appendChild(track);

}

//Función que cambia el video cargado en el player
function reloadVideo(path) {
    document.getElementById('player').remove();
    document.getElementById('videotest').innerHTML = '<video id="player" class="w-100" playsinline controls data-poster="" ></video>';
    video = document.getElementById('player');

    // Inicializacion del media player "plyr"
    const player = new Plyr('#player', {
        invertTime: false,
        toggleInvert: false
    });
    // Si es un objeto se ha elegido un video existente
    if ((typeof path) == "object") {
        path = path.value;
        console.log(path);
    }

    var pathMP4, pathWebm;
    if (path.includes(".mp4")) {
        pathMP4 = path;
        pathWebm = path.replace("mp4", "webm");
    }
    else {
        pathWebm = path;
        pathMP4 = path.replace("webm", "mp4");
    }

    // Crear elemento "source" con MP4
    var src = document.createElement("source");
    setAttributes(src, { id: "video-src", src: pathMP4, type: "video/mp4" });
    video.appendChild(src);

    // Crear elemento "source" con webm
    var src2 = document.createElement("source");
    setAttributes(src2, { id: "video-src2", src: pathWebm, type: "video/webm" });
    video.appendChild(src2);

    var pathMetadata;
    var pathSubtitulos1;

    // Cargar fichero de metadatos
    if (path.includes(".mp4")) {
        pathMetadata = path.replace(".mp4", "-metadata.vtt");
        pathSubtitulos1 = path.replace(".mp4", "-castellano.vtt");
    }
    else {
        pathMetadata = path.replace(".webm", "-metadata.vtt");
        pathSubtitulos1 = path.replace(".webm", "-castellano.vtt");
    }

    // Cargar fichero de metadatos
    var track = document.createElement("track");
    setAttributes(track, { id: "track", kind: "metadata", label: "Metadatos" });
    track.setAttribute("src", pathMetadata);
    track.default = true;
    track.addEventListener("load", loadedMetadatos);

    //Inicialización botones filtros al cargarse los cues
    track.addEventListener("load", cargarFiltros);
    video.appendChild(track);

    //video.load();
    video.play();
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES QUE MANEJAN METADATOS

// Funcion que se ejecuta al cargarse los metadatos y configura los listeners
function loadedMetadatos() {
    //console.log("loaded metadatos")
    //console.log(video.textTracks[0].cues);
    // Configurar los eventos de los metadatos
    var cues = video.textTracks[0].cues;
    allCues = cues;
    for (var i = 0; i < cues.length; i++) {
        cues[i].addEventListener('enter', event => {
            updateDatos(event.target);
        });
        cues[i].addEventListener('exit', event => {
            seleccionAnimal = "todos";
            updateTicks();
            $("#drop-animales").removeClass("filtroActivo");
            var activeCue = video.textTracks[0].activeCues[0];
            //si el cue inmediatamente siguiente al actual no cumple los filtros se salta al siguiente que sí los cumpla
            if (!nuevoCambio){
                if (!cumpleFiltros(getNumCue(cueActual) + 1)) {
                    var tiempo = siguienteCue(getNumCue(cueActual));
                    if (tiempo != null) {
                        video.currentTime = tiempo;
                    } else {
                        if (seguirReproduccion) {
                            //console.log("seguir reproduccion");
                        } else {
                            //console.log("alerta")
                            var descr = "Se han visualizado todos los animales que cumplen estos filtros"
                            crearAviso("alert-success", "Completado:", descr, 4000);
                            video.pause();
                            clearFiltros();
                        }
    
                    }
                }
            }
            nuevoCambio = false;
            seguirReproduccion = false;

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

//Función que actualiza los datos que se muestran en el visor
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

    updateMapa(continente);

    $("#alimentacion").text(info.alimentacion);
    $("#iconoAlimentacion").attr("src", "assets/icons/" + alimentacion + ".ico");
    if (seleccionAlimentacion != "todos") {
        $("#lock-alimentacion").attr("src", "assets/icons/locked.ico");
    } else {
        $("#lock-alimentacion").attr("src", "assets/icons/unlocked.ico");
    }

    $("#medio").text(info.medio);
    $("#iconoMedio").attr("src", "assets/icons/" + medio + ".ico");
    if (seleccionMedio != "todos") {
        $("#lock-medio").attr("src", "assets/icons/locked.ico");
    } else {
        $("#lock-medio").attr("src", "assets/icons/unlocked.ico");
    }

    $("#esqueleto").text(info.esqueleto);
    $("#iconoEsqueleto").attr("src", "assets/icons/" + esqueleto + ".ico");
    if (seleccionEsqueleto != "todos") {
        $("#lock-esqueleto").attr("src", "assets/icons/locked.ico");
    } else {
        $("#lock-esqueleto").attr("src", "assets/icons/unlocked.ico");
    }
}

//Función que devuelve el tiempo del siguiente cue que cumple los filtros
function siguienteCue(numCueAct) {
    var cues = video.textTracks[0].cues;
    //si no quedan más cues ...
    if (numCueAct + 1 > cues.length) {
        return null;
    }

    for (var i = numCueAct + 1; i < cues.length; i++) {
        if (cumpleFiltros(i)) {
            //console.log(cues[i].startTime);
            return cues[i].startTime;
        }
    }
    return null;
}

//Función booleana que examina si un cue cumple con los filtros
function cumpleFiltros(numCue) {
    //var cues = video.textTracks[0].cues;
    //console.log(cues.length)
    if (allCues.length <= numCue) {
        video.pause();
        return false;
    }

    var cue = allCues[numCue];
    var info = JSON.parse(cue.text);

    var alimentacionActual = info.alimentacion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var medioActual = info.medio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var esqueletoActual = info.esqueleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var continenteActual = info.continente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    //Comprobar si algún filtro no se cumple para el cue pasado por parametro
    if ((alimentacionActual == seleccionAlimentacion || seleccionAlimentacion == "todos") && (medioActual == seleccionMedio || seleccionMedio == "todos") &&
        (esqueletoActual == seleccionEsqueleto || seleccionEsqueleto == "todos") && (continenteActual == seleccionContinente || seleccionContinente == "todos")) {
        //console.log("cumple filtro")
        return true;
    }
    //console.log("no cumple filtro")
    return false;
}

/* ---------------------------------------------------------------------------- */

//FUNCIONES QUE CONTROLAN LOS FILTROS

//Función que carga los filtros disponibles en la página principal según los datos del fichero .vtt
function cargarFiltros() {

    //Limpiar filtros anteriores
    document.getElementById("filtroAnimales").innerHTML = "";
    document.getElementById("filtroAlimentacion").innerHTML = "";
    document.getElementById("filtroMedio").innerHTML = "";
    document.getElementById("filtroEsqueleto").innerHTML = "";
    document.getElementById("filtroContinente").innerHTML = "";

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

//Función que crea un desplegable en el id seleccionado con los elementos del array
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
    var identificador = tipoFiltro + "-" + normalizado;
    //console.log("id filtro: " + identificador);

    var tick = document.createElement("img");
    var identificadorTick = identificador + "-tick";
    setAttributes(tick, { id: identificadorTick });
    //Si es la opción "ver todos" marcar como seleccionada por defecto
    if (normalizado == "todos") {
        setAttributes(link, { id: identificador, class: "dropdown-item", href: "#", onclick: "actualizaFiltros(\'" + tipoFiltro + "\', \'" + normalizado + "\');" });
        //añadir tick
        setAttributes(tick, { id: identificadorTick, class: "tickFiltros", src: "assets/icons/check-mark.ico" });
    } else {
        setAttributes(link, { id: identificador, class: "dropdown-item", href: "#", onclick: "actualizaFiltros(\'" + tipoFiltro + "\', \'" + normalizado + "\');" });
    }

    var label = document.createElement("label");
    label.innerHTML = "&nbsp";
    link.appendChild(label);

    link.appendChild(tick);
    filtro.appendChild(link);

    return filtro;
}

//Función que crea una barra divisora para ser insertada en el dropdown
function crearDivisorFiltro() {
    var divisor = document.createElement("li");
    var hr = document.createElement("hr");
    setAttributes(hr, { class: "dropdown-divider" });
    divisor.appendChild(hr);
    return divisor;
}

//Funcion que actualiza los cues que se van a mostrar según los filtros activos
function actualizaFiltros(filtro, seleccion) {
    //console.log("filtro: " + filtro + " selección: " + seleccion);
    var combinacionPosible = false;
    switch (filtro) {
        /* case "video":
             break;*/
        case "animales":
            //Si se selecciona un animal concreto se eliminan todos los filtros
            seleccionAlimentacion = "todos";
            seleccionMedio = "todos";
            seleccionEsqueleto = "todos";
            seleccionContinente = "todos";
            seleccionAnimal = seleccion;

            if (seleccion == "todos") {
                video.currentTime = 0;
                nuevoCambio = true;
                video.play();
                $("#drop-animales").removeClass("filtroActivo");
                break;
            }
            //saltar al animal directamente
            for (var i = 0; i < allCues.length; i++) { //se puede cambiar el for para usar if (cumpleFiltros) pero da problemas de momento
                var info = JSON.parse(allCues[i].text);
                info = info.nombreComun.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                if (info == seleccion) {
                    video.currentTime = allCues[i].startTime;
                    nuevoCambio = true;
                    break;
                }
            }
            //Se actualiza el feedback de los filtros
            if (seleccionAnimal != "todos") {
                $("#drop-animales").addClass("filtroActivo");
                $("#drop-alimentacion").removeClass("filtroActivo");
                $("#drop-medio").removeClass("filtroActivo");
                $("#drop-esqueleto").removeClass("filtroActivo");
                $("#drop-continentes").removeClass("filtroActivo");
            } else {
                $("#drop-animales").removeClass("filtroActivo");
            }
            break;
        case "alimentacion":
            //actualizar variables de filtro y saltar al primer animal que cumple con el requisito
            seleccionAlimentacion = seleccion;
            seleccionAnimal = "todos";
            for (var i = 0; i < allCues.length; i++) {
                if (cumpleFiltros(i)) {
                    console.log(i);
                    console.log(cumpleFiltros(i))
                    combinacionPosible = true;
                    seguirReproduccion = true;
                    console.log(allCues[i])
                    video.currentTime = allCues[i].startTime;
                    nuevoCambio = true;
                    console.log(allCues[i].startTime)
                    break;
                }
            }
            //Comprobar si la combinación de filtros es posible
            if (!combinacionPosible) {
                seleccionAlimentacion = "todos";
                var descr = "No hay ningún animal que cumpla los requisitos de filtrado. Prueba otra combinación"
                crearAviso("alert-danger", "Error:", descr, 4000);
            }
            //Se actualiza el feedback de los filtros
            if (seleccionAlimentacion != "todos") {
                $("#drop-alimentacion").addClass("filtroActivo");
                $("#drop-animales").removeClass("filtroActivo");
            } else {
                $("#drop-alimentacion").removeClass("filtroActivo");
            }
            break;
        case "medio":
            //actualizar variables de filtro y saltar al primer animal que cumple con el requisito
            seleccionMedio = seleccion;
            seleccionAnimal = "todos";
            for (var i = 0; i < allCues.length; i++) {
                if (cumpleFiltros(i)) {
                    combinacionPosible = true;
                    seguirReproduccion = true;
                    video.currentTime = allCues[i].startTime;
                    nuevoCambio = true;
                    break;
                }
            }
            //Comprobar si la combinación de filtros es posible
            if (!combinacionPosible) {
                seleccionMedio = "todos";
                var descr = "No hay ningún animal que cumpla los requisitos de filtrado. Prueba otra combinación"
                crearAviso("alert-danger", "Error:", descr, 4000);
            }
            //Se actualiza el feedback de los filtros
            if (seleccionMedio != "todos") {
                $("#drop-medio").addClass("filtroActivo");
                $("#drop-animales").removeClass("filtroActivo");
            } else {
                $("#drop-medio").removeClass("filtroActivo");
            }
            break;
        case "esqueleto":
            //actualizar variables de filtro y saltar al primer animal que cumple con el requisito
            seleccionEsqueleto = seleccion;
            seleccionAnimal = "todos";
            for (var i = 0; i < allCues.length; i++) {
                if (cumpleFiltros(i)) {
                    combinacionPosible = true;
                    seguirReproduccion = true;
                    video.currentTime = allCues[i].startTime;
                    nuevoCambio = true;
                    break;
                }
            }
            //Comprobar si la combinación de filtros es posible
            if (!combinacionPosible) {
                seleccionEsqueleto = "todos";
                var descr = "No hay ningún animal que cumpla los requisitos de filtrado. Prueba otra combinación"
                crearAviso("alert-danger", "Error:", descr, 4000);
            }
            //Se actualiza el feedback de los filtros
            if (seleccionEsqueleto != "todos") {
                $("#drop-esqueleto").addClass("filtroActivo");
                $("#drop-animales").removeClass("filtroActivo");
            } else {
                $("#drop-esqueleto").removeClass("filtroActivo");
            }
            break;
        case "continente":
            //actualizar variables de filtro y saltar al primer animal que cumple con el requisito
            seleccionContinente = seleccion;
            seleccionAnimal = "todos";
            for (var i = 0; i < allCues.length; i++) {
                if (cumpleFiltros(i)) {
                    combinacionPosible = true;
                    seguirReproduccion = true;
                    video.currentTime = allCues[i].startTime;
                    nuevoCambio = true;
                    break;
                }
            }
            //Comprobar si la combinación de filtros es posible
            if (!combinacionPosible) {
                seleccionContinente = "todos";
                var descr = "No hay ningún animal que cumpla los requisitos de filtrado. Prueba otra combinación"
                crearAviso("alert-danger", "Error:", descr, 4000);
            }
            //Se actualiza el feedback de los filtros
            if (seleccionContinente != "todos") {
                $("#drop-continentes").addClass("filtroActivo");
                $("#drop-animales").removeClass("filtroActivo");
            } else {
                $("#drop-continentes").removeClass("filtroActivo");
            }
            break;
        default:
            //En caso de seleccionar un video se resetean todos los filtros
            $("#drop-animales").removeClass("filtroActivo");
            $("#drop-alimentacion").removeClass("filtroActivo");
            $("#drop-medio").removeClass("filtroActivo");
            $("#drop-esqueleto").removeClass("filtroActivo");
            $("#drop-continentes").removeClass("filtroActivo");

            seleccionAlimentacion = "todos";
            seleccionMedio = "todos";
            seleccionEsqueleto = "todos";
            seleccionContinente = "todos";
            seleccionAnimal = "todos";

            //en este caso "filtro" no contiene el tipo de filtro sino el path del video
            //para mantener mayúsculas y extensión del video
            reloadVideo(filtro);
    }
    updateTicks();
}

//Funcion que borra todos los filtros
function clearFiltros() {
    //Si se ha entrado en la función por la selección de un filtro no borra nada
    //en caso contrario significa que el usuario ha tocado la barra de reproducción

    console.log("clear");

    $("#drop-animales").removeClass("filtroActivo");
    $("#drop-alimentacion").removeClass("filtroActivo");
    $("#drop-medio").removeClass("filtroActivo");
    $("#drop-esqueleto").removeClass("filtroActivo");
    $("#drop-continentes").removeClass("filtroActivo");

    seleccionAlimentacion = "todos";
    seleccionMedio = "todos";
    seleccionEsqueleto = "todos";
    seleccionContinente = "todos";
    seleccionAnimal = "todos";

    updateTicks();

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

/* ---------------------------------------------------------------------------- */

// FUNCIONES POST Y GET

// Funcion que solicita al servidor los paths de los videos existentes
function peticionObtenerVideos() {
    $.get("php/consultVideos.php", {})
        .done(function (data) {
            var paths = JSON.parse(data);
            var filtro;
            var nombresVideos = [];
            var pathsVideos = [];
            for (var i = 0; i < paths.length; i++) {
                var nombre = paths[i].replace("assets/videos/", "");
                nombre = nombre.replace(".mp4", "");
                //nombre = nombre.replace(".ogg", "");
                nombre = nombre.replace(".webm", "");
                nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
                var actualizado = checkArray(nombresVideos, nombre);
                if (actualizado) {
                    pathsVideos.push(paths[i]);
                }
            }

            for (var i = 0; i < nombresVideos.length; i++) {
                filtro = crearElementoFiltro(nombresVideos[i], pathsVideos[i]);
                document.getElementById("filtroVideos").appendChild(filtro);
            }

            //Por defecto carga el primer video
            cargarVideo(paths[0]);
        });
}


/* ---------------------------------------------------------------------------- */

//FUNCIONES MAPA

//Función que carga e inicializa el mapa con todos los continentes marcados y el mínimo de zoom
function cargarMapa(continent) {
    var myGeoJSONPath = 'assets/leaflet/continents.json';

    $.getJSON(myGeoJSONPath, function (data) {

        map = L.map('map');
        map.createPane('labels');

        // This pane is above markers but below popups
        map.getPane('labels').style.zIndex = 650;

        // Layers in this pane are non-interactive and do not obscure mouse/touch events
        map.getPane('labels').style.pointerEvents = 'none';
        var cartodbAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';

        var positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
            attribution: cartodbAttribution
        }).addTo(map);

        var positronLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
            attribution: cartodbAttribution,
            pane: 'labels'
        }).addTo(map);

        geoJson = L.geoJson(data, {
        }).addTo(map);

        geoJson.eachLayer(function (layer) {
            layer.bindPopup(layer.feature.properties.name);
        });

        map.setView({ lat: 47.040182144806664, lng: 9.667968750000002 }, 0);


        //Añadir pins en todos los animales disponibles (pendiente)


    })
}

//Función que actualiza el mapa marcando el continente del animal actual (Antartida no implementado a falta de coordenadas)
function updateMapa(continent) {
    var latitudCentro, longitudCentro;
    var numContinent = 99;
    //Se selecciona el índice correspondiente para acceder a las coordenadas del continente seleccionado
    switch (continent) {
        case "africa":
            var numContinent = 1;
            latitudCentro = centroContinentes[0][0];
            longitudCentro = centroContinentes[0][1];
            break;
        case "asia":
            var numContinent = 0;
            latitudCentro = centroContinentes[1][0];
            longitudCentro = centroContinentes[1][1];
            break;
        case "america":
            var numContinent = 3;
            latitudCentro = centroContinentes[2][0];
            longitudCentro = centroContinentes[2][1];
            break;
        case "europa":
            var numContinent = 2;
            latitudCentro = centroContinentes[3][0];
            longitudCentro = centroContinentes[3][1];
            break;
        case "oceania":
            var numContinent = 4;
            latitudCentro = centroContinentes[4][0];
            longitudCentro = centroContinentes[4][1];
            break;
        case "antartida":
            var numContinent = 6;
            latitudCentro = centroContinentes[5][0];
            longitudCentro = centroContinentes[5][1];
            break;
        default:
            var numContinent = 99;
    }
    //path de los datos de fronteras de los continentes
    var myGeoJSONPath = 'assets/leaflet/continents.json';

    $.getJSON(myGeoJSONPath, function (data) {
        //console.log(data["features"]);
        var newdata;

        //Se elimina el pin actual
        if (pinAnimal != null) {
            map.removeLayer(pinAnimal);
        }

        //Se eliminan las zonas marcadas anteriormente
        map.removeLayer(geoJson);
        if (casoAmerica) {
            map.removeLayer(geoJson2);
            casoAmerica = false;
        }
        if (numContinent != 99) {
            newdata = data["features"][numContinent];
        }
        if (numContinent == 3) {
            newdata2 = data["features"][5];
        }

        //Se añade al mapa la zona que tiene que ser marcada
        geoJson = L.geoJson(newdata, {
        }).addTo(map);

        //En el caso que el contiente sea América hay que marcar tanto norteamerica y sudamerica
        if (numContinent == 3) {
            casoAmerica = true;
            geoJson2 = L.geoJson(newdata2, {
            }).addTo(map);
        }

        geoJson.eachLayer(function (layer) {
            layer.bindPopup(layer.feature.properties.name);
        });

        //Se marca con un pin la longitud y latitud del ficher vtt
        var pinIcon = L.icon({
            iconUrl: 'assets/icons/pin.ico',
            iconSize: [40, 40], // size of the icon
            iconAnchor: [20, 40], // point of the icon which will correspond to marker's location
            popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
        });

        var info = JSON.parse(cueActual.text);
        var latitud = info.geoLat;
        var longitud = info.geoLong;
        //console.log(latitud);
        //console.log(longitud)

        pinAnimal = L.marker([latitud, longitud], { icon: pinIcon }).addTo(map);

        //Se posiciona la vista en el centro del continente

        map.setView({ lat: latitudCentro, lng: longitudCentro }, 2);
    })
}

/* ---------------------------------------------------------------------------- */

// FUNCIONES AUXILIARES GENÉRICAS
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
        return true;
    }
    return false;
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

//Función que acutaliza los filtros que deben llevar tick
function updateTicks() {

    var animales = [];
    var alimentacion = [];
    var medio = [];
    var esqueleto = [];
    var continente = [];

    var info;

    //Se recorren todos los cues y se añaden todos los filtros disponibles a los arrays
    for (var i = 0; i < allCues.length; i++) {
        info = JSON.parse(allCues[i].text);
        checkArray(animales, info.nombreComun);
        checkArray(alimentacion, info.alimentacion);
        checkArray(medio, info.medio);
        checkArray(esqueleto, info.esqueleto);
        checkArray(continente, info.continente);
    }

    //Eliminar todos los ticks || CODIGO ZOMBI :(

    for (var i = 0; i < animales.length; i++) {
        //console.log(animales[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
        if (document.getElementById("animales-" + animales[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() + "-tick") != null) {
            document.getElementById("animales-" + animales[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() + "-tick").remove();
        }
    }
    if (document.getElementById("animales-todos-tick") != null) {
        document.getElementById("animales-todos-tick").remove();
    }
    for (var i = 0; i < alimentacion.length; i++) {
        //console.log(alimentacion[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
        if (document.getElementById("alimentacion-" + alimentacion[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() + "-tick") != null) {
            document.getElementById("alimentacion-" + alimentacion[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() + "-tick").remove();
        }
    }
    if (document.getElementById("alimentacion-todos-tick") != null) {
        document.getElementById("alimentacion-todos-tick").remove();
    }
    for (var i = 0; i < medio.length; i++) {
        //console.log(medio[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
        if (document.getElementById("medio-" + medio[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() + "-tick") != null) {
            document.getElementById("medio-" + medio[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() + "-tick").remove();
        }
    }
    if (document.getElementById("medio-todos-tick") != null) {
        document.getElementById("medio-todos-tick").remove();
    }
    for (var i = 0; i < esqueleto.length; i++) {
        //console.log(esqueleto[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
        if (document.getElementById("esqueleto-" + esqueleto[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() + "-tick") != null) {
            document.getElementById("esqueleto-" + esqueleto[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() + "-tick").remove();
        }
    }
    if (document.getElementById("esqueleto-todos-tick") != null) {
        document.getElementById("esqueleto-todos-tick").remove();
    }
    for (var i = 0; i < continente.length; i++) {
        //console.log(continente[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
        if (document.getElementById("continente-" + continente[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() + "-tick") != null) {
            document.getElementById("continente-" + continente[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() + "-tick").remove();
        }
    }
    if (document.getElementById("continente-todos-tick") != null) {
        document.getElementById("continente-todos-tick").remove();
    }
    //Añadir ticks
    var link, identificador, tick, identificadorTick;

    link = document.getElementById("animales-" + seleccionAnimal.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
    identificador = "animales-" + seleccionAnimal.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    tick = document.createElement("img");
    identificadorTick = identificador + "-tick";
    setAttributes(tick, { id: identificadorTick });
    setAttributes(tick, { id: identificadorTick, class: "tickFiltros", src: "assets/icons/check-mark.ico" });
    link.appendChild(tick);

    link = document.getElementById("alimentacion-" + seleccionAlimentacion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
    identificador = "alimentacion-" + seleccionAlimentacion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    tick = document.createElement("img");
    identificadorTick = identificador + "-tick";
    setAttributes(tick, { id: identificadorTick });
    setAttributes(tick, { id: identificadorTick, class: "tickFiltros", src: "assets/icons/check-mark.ico" });
    link.appendChild(tick);

    link = document.getElementById("medio-" + seleccionMedio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
    identificador = "medio-" + seleccionMedio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    tick = document.createElement("img");
    identificadorTick = identificador + "-tick";
    setAttributes(tick, { id: identificadorTick });
    setAttributes(tick, { id: identificadorTick, class: "tickFiltros", src: "assets/icons/check-mark.ico" });
    link.appendChild(tick);

    link = document.getElementById("esqueleto-" + seleccionEsqueleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
    identificador = "esqueleto-" + seleccionEsqueleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    tick = document.createElement("img");
    identificadorTick = identificador + "-tick";
    setAttributes(tick, { id: identificadorTick });
    setAttributes(tick, { id: identificadorTick, class: "tickFiltros", src: "assets/icons/check-mark.ico" });
    link.appendChild(tick);

    link = document.getElementById("continente-" + seleccionContinente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
    identificador = "continente-" + seleccionContinente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    tick = document.createElement("img");
    identificadorTick = identificador + "-tick";
    setAttributes(tick, { id: identificadorTick });
    setAttributes(tick, { id: identificadorTick, class: "tickFiltros", src: "assets/icons/check-mark.ico" });
    link.appendChild(tick);
}