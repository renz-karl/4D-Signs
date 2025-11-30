<?php
$mysqli = new mysqli('localhost','root','','4d_signs_db');
if ($mysqli->connect_error) { die('conn error'); }
$hash = password_hash('Test1234',PASSWORD_DEFAULT);
$stmt = $mysqli->prepare('UPDATE users SET password=? WHERE username=?');
$username = 'testuser';
$stmt->bind_param('ss', $hash, $username);
if ($stmt->execute()) { echo 'Updated\n'; } else { echo 'Fail: '. $stmt->error ."\n"; }
$stmt->close();
$mysqli->close();
?>