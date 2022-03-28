<?php
/*
    Fichero que sube un archivo de metadatos al servidor, sobreescribiendolo
    si ya existe. Hay que pasar todo el texto del archivo en la peticion.
*/

// Hash de la contraseña correcta
$hashCorrecto = '$2y$10$O2h43HAj/1hRCJx8tD8x.eLn2bw2DzrZG8P14PbgQmeW2hOTx73my';

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