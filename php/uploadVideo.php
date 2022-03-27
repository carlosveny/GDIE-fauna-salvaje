<?php
/*
    Fichero que sube un video al servidor, verificando antes que el
    video no exista. Pasos a seguir para subir archivos:
    1. Dar permisos a la carpeta html al usuario www-data:www-data
        (chown -R www-data:www-data /var/www/html/)
    2. Modificar fichero "php.ini" para permitir subidas de mas tamaño
        (https://stackoverflow.com/questions/3586919/why-would-files-be-empty-when-uploading-files-to-php)
*/

// Hash de la contraseña correcta
$hashCorrecto = "$2y$10$7Pxe.3i3uZbReqoRiW4oR.u47PLbHCgOk7ORuFWuozmdItSNjxWXS";

// Comparar hash correcto con el de la contraseña a verificar
if (password_verify($_REQUEST["password"], $hashCorrecto)) {
} else {
    echo "false";
    exit;
}

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

        // Check if there is a metadata file. If not, create it
        if (strpos($location, '.mp4') !== false) {
            $locationMetadata = str_replace(".mp4", "-metadata.vtt", $location);
            if (!file_exists($locationMetadata)) {
                file_put_contents($locationMetadata, "WEBVTT FILE\n\n");
            }
            $locationSubtitulos = str_replace(".mp4", "-castellano.vtt", $location);
            if (!file_exists($locationSubtitulos)) {
                file_put_contents($locationSubtitulos, "WEBVTT FILE\n\n");
            }
        }
        else {
            $locationMetadata = str_replace(".webm", "-metadata.vtt", $location);
            if (!file_exists($locationMetadata)) {
                file_put_contents($locationMetadata, "WEBVTT FILE\n\n");
            }
            $locationSubtitulos = str_replace(".webm", "-castellano.vtt", $location);
            if (!file_exists($locationSubtitulos)) {
                file_put_contents($locationSubtitulos, "WEBVTT FILE\n\n");
            }
        }
    }

    echo $response;
    exit;
}
