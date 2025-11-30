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
// Set mysqli to throw exceptions on errors where available for better error handling
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
    $conn = new mysqli($servername, $db_username, $db_password, $dbname);
} catch (Throwable $t) {
    error_log('Database connection failed: ' . $t->getMessage() . "\n", 3, __DIR__ . '/../notifications.log');
    // For dev, display an error page, but do not leak credentials in production
    die('Database connection failed. Please check the application log for details.');
}

// Set charset
$conn->set_charset('utf8mb4');

?>