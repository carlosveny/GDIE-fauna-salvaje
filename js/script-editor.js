/*
    Fichero que gestiona la introduccion, modificacion y eliminacion
    de metadatos en videos de animales y su posterior actualizacion
    en el servidor.
*/
// https://www.w3schools.com/php/php_file_upload.asp (file uploads php)

// Funcion que se ejecuta al cargarse la pagina
function loaded() {
    // Inicializacion del media player "plyr"
    const video = document.querySelector('#player');
    video.addEventListener('play', (event) => {
        console.log('The Boolean paused property is now false. Either the ' +
            'play() method was called or the autoplay attribute was toggled.');
    });

    // Inicializacion del boton "Examinar"
    const input = document.querySelector('#file-input');
    input.addEventListener('input', subirVideo);

}

// Funcion que sube un video al servidor
function subirVideo() {
    var file = document.getElementById("file-input").files[0];
    if (file == null) return;
    //console.log(document.getElementById("file-input").files[0]);

    // Pasar el archivo a formData
    var formData = new FormData();
    formData.append("file", file);

    $.ajax({
        url : "php/uploadVideo.php",
        type: "POST",
        data : formData,
        processData: false,
        contentType: false,
        success:function(data, textStatus, jqXHR){
            console.log(data);
            var path = data.replace("../", "");
            document.getElementById("video-src").setAttribute("src", path);
            console.log(path);
        },
        error: function(jqXHR, textStatus, errorThrown){
            //if fails
        }
    });

    // $.post("localhost/FaunaSalvaje/php/uploadVideo.php", {
    //     archivo: formData
    // })
    //     .done(function (data) {
    //         console.log(data);
    //     });
}