<?php
// Fallback index to redirect to the main 4Dsigns page; prevents 404 when users access /4D-Signs/4Dsigns/...
header('Location: /4D-Signs/4Dsigns.php', true, 301);
exit();
?>