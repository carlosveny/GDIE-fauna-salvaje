
//plyr.setup("#player");

function loaded() {
    const player = new Plyr('#player');

    const video = document.querySelector('#player');

    video.addEventListener('play', (event) => {
        console.log('The Boolean paused property is now false. Either the ' +
            'play() method was called or the autoplay attribute was toggled.');
    });

}