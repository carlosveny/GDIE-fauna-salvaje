<?php
shell_exec("rm -r repo");
shell_exec("mkdir repo");
shell_exec("git clone https://github.com/carlosveny/GDIE-fauna-salvaje.git /var/www/html/repo");

//echo "<pre>$output</pre>";
?>