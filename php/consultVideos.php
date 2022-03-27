<?php
/*
    Fichero que devuelve un array con todos los paths de los videos
    que hay subidos en el servidor.
*/

$relativePath = "../assets/videos/";
$absolutePath = "assets/videos/";
$files = scandir($relativePath);

// Bucle para eliminar las posiciones que contienen '.' y '..' a causa de scandir
// Tambien descarta los archivos que no son ".mp4"
// Tambien concatena el path absoluto
$archivos = [];
for ($i = 0; $i < count($files); $i++) {
    if (($files[$i] != ".") && ($files[$i] != ".."))
        if (((strpos($files[$i], '.mp4') !== false) || (strpos($files[$i], '.webm') !== false))) {
        $archivos[] = $absolutePath . $files[$i];
    }
}

// Devolver el array de paths
// JSON_UNESCAPED_SLASHES (https://stackoverflow.com/questions/10210338/json-encode-escaping-forward-slashes)
echo json_encode($archivos, JSON_UNESCAPED_SLASHES);
