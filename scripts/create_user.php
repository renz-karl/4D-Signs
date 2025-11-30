<?php
// scripts/create_user.php
// Usage: php create_user.php username email password [phone]
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/notifications.php';

if ($argc < 4) {
    echo "Usage: php create_user.php <username> <email> <password> [phone]\n";
    exit(1);
}

$username = $argv[1];
$email = $argv[2];
$password = $argv[3];
$phone = isset($argv[4]) ? $argv[4] : '';
// Normalize phone for consistent storage
$phone = normalizePhone($phone);
// OTP is SMS-only by design; not accepting an email option here.

// Basic validation
if (strlen($username) < 3) { echo "Username too short\n"; exit(1); }
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { echo "Invalid email\n"; exit(1); }
if (strlen($password) < 6) { echo "Password too short\n"; exit(1); }

$stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?");
$stmt->bind_param('sss', $username, $email, $phone);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) { echo "Username, email, or phone already exists\n"; exit(1); }
$stmt->close();

$hash = password_hash($password, PASSWORD_DEFAULT);
$profile_pic_path = NULL;
$phoneVal = $phone;

$stmt = $conn->prepare("INSERT INTO users (username, email, password, phone, profile_pic_path, status) VALUES (?, ?, ?, ?, ?, 'active')");
$stmt->bind_param('sssss', $username, $email, $hash, $phoneVal, $profile_pic_path);
if (!$stmt->execute()) {
    echo "Insert failed: " . $stmt->error . "\n";
    exit(1);
}

echo "User created with id: " . $conn->insert_id . "\n";
$stmt->close();
$conn->close();
?>