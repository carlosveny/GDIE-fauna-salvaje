<?php
/*
    Fichero que devuelve un array con todos los nombres de los videos
    que tienen adaptativo.
*/

$relativePath = "../assets/cmaf/";
$absolutePath = "assets/cmaf/";
$files = scandir($relativePath);

// Devolver el array de paths
// JSON_UNESCAPED_SLASHES (https://stackoverflow.com/questions/10210338/json-encode-escaping-forward-slashes)
echo json_encode($files, JSON_UNESCAPED_SLASHES);
