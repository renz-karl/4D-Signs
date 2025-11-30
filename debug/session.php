<?php
// debug/session.php - provide JSON output of current session status and cookies for troubleshooting
header('Content-Type: application/json');
session_start();
$out = [
    'session_id' => session_id(),
    'session_status' => session_status() === PHP_SESSION_ACTIVE ? 'active' : 'inactive',
    'session_save_path' => session_save_path(),
    'session_data' => $_SESSION,
    'cookies' => $_COOKIE,
    'php_ini' => [
        'session.cookie_lifetime' => ini_get('session.cookie_lifetime'),
        'session.cookie_path' => ini_get('session.cookie_path'),
        'session.cookie_domain' => ini_get('session.cookie_domain'),
        'session.cookie_secure' => ini_get('session.cookie_secure'),
        'session.cookie_httponly' => ini_get('session.cookie_httponly'),
        'session.save_path' => session_save_path()
    ]
];
echo json_encode($out, JSON_PRETTY_PRINT);
exit();

?>
