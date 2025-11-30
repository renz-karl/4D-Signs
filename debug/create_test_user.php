<?php
// debug/create_test_user.php - create a verified test user for local development
require_once __DIR__ . '/../includes/db.php';
// Change these values if you want a different user
$username = 'manualtest';
$email = 'manualtest@example.local';
$phone = '09123456789';
$passwordPlain = 'DebugPass123!';
$hashed = password_hash($passwordPlain, PASSWORD_DEFAULT);

// Check if user exists
$stmt = $conn->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
$stmt->bind_param('ss', $username, $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    echo "User already exists.\n";
    $stmt->close();
    exit(0);
}
$stmt->close();

$ins = $conn->prepare('INSERT INTO users (username, email, password, phone, is_verified) VALUES (?, ?, ?, ?, 1)');
$ins->bind_param('ssss', $username, $email, $hashed, $phone);
if ($ins->execute()) {
    echo "Created user: $username / $passwordPlain\n";
} else {
    echo "Failed to create user: " . $conn->error . "\n";
}
$ins->close();
$conn->close();
?>
