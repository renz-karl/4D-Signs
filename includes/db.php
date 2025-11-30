<?php
// Simple db.php to centralize DB connection
// Load DB config from includes/config.php if present
$defaultConfig = [
    'db_host' => 'localhost',
    'db_user' => 'root',
    'db_pass' => '',
    'db_name' => '4d_signs_db'
];
if (file_exists(__DIR__ . '/config.php')) {
    $userConfig = require __DIR__ . '/config.php';
    $config = array_merge($defaultConfig, $userConfig);
} else if (file_exists(__DIR__ . '/config.php.example')) {
    // still use defaults unless user creates config.php
    $config = $defaultConfig;
} else {
    $config = $defaultConfig;
}

$servername = $config['db_host'];
$db_username = $config['db_user'];
$db_password = $config['db_pass'];
$dbname = $config['db_name'];

// Create connection
$conn = new mysqli($servername, $db_username, $db_password, $dbname);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// Set charset
$conn->set_charset('utf8mb4');

?>