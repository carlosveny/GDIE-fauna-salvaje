<?php
/*
    Fichero que revisa si la contraseña introducida es la correcta,
    comparandola con el hash. Devuelve true/false segun is es correcta
    o no.
*/

// Hash de la contraseña correcta
$hashCorrecto = '$2y$10$O2h43HAj/1hRCJx8tD8x.eLn2bw2DzrZG8P14PbgQmeW2hOTx73my';

// Comparar hash correcto con el de la contraseña a verificar
if (password_verify($_POST["password"], $hashCorrecto)) {
    echo "true";
} else {
    echo "false";
}