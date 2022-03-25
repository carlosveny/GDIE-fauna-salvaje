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

function cargarVideo(path) {
    console.log(path);
    var src = document.createElement("source");
    setAttributes(src, { id: "video-src", src: path, type: "video/mp4" });
    document.getElementById("player").appendChild(src);
    if (document.getElementById("alerta-no-video") != null) {
        document.getElementById("alerta-no-video").remove();
    }

}