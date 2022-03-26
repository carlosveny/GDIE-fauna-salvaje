<?php
/*
    Fichero que sube un video al servidor, verificando antes que el
    video no exista. Pasos a seguir para subir archivos:
    1. Dar permisos a la carpeta html al usuario www-data:www-data
        (sudo chown -R www-data:www-data /var/www/html/)
    2. Modificar fichero "php.ini" para permitir subidas de mas tamaño
        (https://stackoverflow.com/questions/3586919/why-would-files-be-empty-when-uploading-files-to-php)
*/

if (isset($_FILES['file']['name'])) {
    // File name
    $filename = $_FILES['file']['name'];

    // Location
    $location = '../assets/videos/' . $filename;

    // File extension
    $file_extension = pathinfo($location, PATHINFO_EXTENSION);
    $file_extension = strtolower($file_extension);

    // Valid extensions
    $valid_ext = array("mp4", "webm", "ogg");

    $response = "false";
    if (in_array($file_extension, $valid_ext)) {
        // Check if already exists
        if (file_exists($location)) {
            echo "existe";
            exit;
        }

        // Upload file
        if (move_uploaded_file($_FILES['file']['tmp_name'], $location)) {
            $response = $location;
        }
    }

    echo $response;
    exit;
}
