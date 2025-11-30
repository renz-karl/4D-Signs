<?php
// debug/set_session.php - locally create a session for testing session persistence
header('Content-Type: application/json');
session_start();
$uid = isset($_GET['user_id']) ? intval($_GET['user_id']) : 9999;
$username = isset($_GET['username']) ? $_GET['username'] : 'debuguser';
// Regenerate id to mimic login flow
session_regenerate_id(true);
$_SESSION['user_id'] = $uid;
$_SESSION['username'] = $username;
$_SESSION['email'] = "$username@example.local";
$_SESSION['profile_pic'] = '';
error_log("[DEBUG] set_session: user_id={$uid} username={$username} session_id=" . session_id() . "\n", 3, __DIR__ . '/../notifications.log');
echo json_encode(['success' => true, 'session_id' => session_id(), 'session_data' => $_SESSION]);
exit();
?>
