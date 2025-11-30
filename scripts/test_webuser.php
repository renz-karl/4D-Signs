<?php
$m = new mysqli('localhost','webuser','ChangeThisPassword!','4d_signs_db');
if ($m->connect_error) {
    echo "ERROR: " . $m->connect_error . "\n";
    exit(1);
}
echo "OK\n";
?>