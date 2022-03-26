## Carpeta .server
AVISO: Esta carpeta es únicamente para ver el código fuente de los archivos que están en la raíz del servidor Apache y del script de ffmpeg. Modificar estos archivos no modifica
nada del servidor. La función de tener en el repositorio estos archivos es informativa.
### Explicación
Estos ficheros se encuentran en la raíz del servidor apache y son para gestionar deploys "semiautomáticos".
- deploy.php: Script que actualiza la carpeta del repositorio con los datos actualizados de GitHub.
- index.html: Fichero que ejecuta la redirección al index del repositorio `repo/index.html` para que al acceder al servidor se muestre el index del repositorio.
