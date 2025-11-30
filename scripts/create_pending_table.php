<?php
// CLI script to create pending_registrations table using provided DB credentials.
if ($argc < 4) {
    echo "Usage: php create_pending_table.php <db_host> <db_user> <db_pass> [db_name]\n";
    echo "Example: php create_pending_table.php localhost root '' 4d_signs_db\n";
    exit(1);
}
$host = $argv[1];
$user = $argv[2];
$pass = $argv[3];
$db = isset($argv[4]) ? $argv[4] : '4d_signs_db';

try {
    $conn = new mysqli($host, $user, $pass, $db);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error . "\n");
    }
} catch (Exception $e) {
    die("Failed to connect to DB: " . $e->getMessage() . "\n");
}

$sql = "CREATE TABLE IF NOT EXISTS pending_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  profile_pic_path VARCHAR(255) DEFAULT NULL,
  otp_code_hash VARCHAR(255) DEFAULT NULL,
  otp_expires_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);";

if ($conn->query($sql) === TRUE) {
    echo "pending_registrations table created or already exists.\n";
} else {
    echo "Error creating table: " . $conn->error . "\n";
}

$conn->close();
?>
