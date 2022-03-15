# Práctica GDIE
### Integrantes: Carlos Veny, Marc Rosselló y Juan José Nieto
La idea es la siguiente:
- Realizar el proyecto en local en nuestro PC.
- Subir los cambios a github (ver tutorial).
- Configurar el servidor apache para que haga deploys automáticos cuando se modifique este repositorio (https://gist.github.com/oodavid/1809044)
- Los cambios se actualizarán en el servidor (https://alumnes-ltim.uib.es/gdieXX)

## Tutorial GIT
### Instalación
1. Instalar git (https://git-scm.com/download/win). Dejar todo por defecto.
2. Abrir CMD y configurar nombre y email (el mismo de github).  
`git config --global user.name "Carlos Veny"`  
`git config --global user.email "MY_NAME@example.com"`
3. Crear una carpeta en el PC donde va a estar el repositorio en local.
4. Abrir el CMD en dicha carpeta (o navegar con cd ...).
5. Inicializar git en la carpeta.  
`git init`
6. Añadir el repositorio remoto.  
`git remote add origin https://github.com/carlosveny/GDIE-fauna-salvaje.git`
7. Cambiar a la rama "main".  
`git checkout -b main`
### Pull y push
#### Esto se realizará cada vez que se quiera modificar el repositorio
1. Hacer que el pull sobreescriba los archivos locales (Aviso: se perderá la información en local y se sobreescribirá con la del repositorio).  
`git reset --hard`
2. Hacer pull del repositorio a la carpeta local.  
`git pull origin main`
3. Modificar los archivos (VSC, Notepad, añadir o eliminar archivos...)
4. Realizar un commit.  
`git add --all`  
`git commit -m "Añadir un mensaje cualquiera"`  
5. Hacer un push de los cambios en el repositorio remoto.  
`git push origin main`
