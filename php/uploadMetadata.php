<?php
/*
    Fichero que sube un archivo de metadatos al servidor, sobreescribiendolo
    si ya existe. Hay que pasar todo el texto del archivo en la peticion.
*/

// Hash de la contraseña correcta
$hashCorrecto = "$2y$10$7Pxe.3i3uZbReqoRiW4oR.u47PLbHCgOk7ORuFWuozmdItSNjxWXS";

// Comparar hash correcto con el de la contraseña a verificar
if (password_verify($_POST["password"], $hashCorrecto)) {
} else {
    echo "false";
    exit;
}

$path = $_POST["path"];
$contenido = $_POST["texto"];
$output = file_put_contents($path, $contenido);
echo $output;