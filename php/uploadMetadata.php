<?php
/*
    Fichero que sube un archivo de metadatos al servidor, sobreescribiendolo
    si ya existe. Hay que pasar todo el texto del archivo en la peticion.
*/
$path = $_POST["path"];
$contenido = $_POST["texto"];
$output = file_put_contents($path, $contenido);
echo $output;