<?php
// scripts/verify_user.php
// Usage: php verify_user.php <username_or_id>
require_once __DIR__ . '/../includes/db.php';
if ($argc < 2) { echo "Usage: php verify_user.php <username_or_id>\n"; exit(1); }
$term = $argv[1];
$isId = is_numeric($term);
if ($isId) {
    $stmt = $conn->prepare('UPDATE users SET is_verified = 1 WHERE id = ?');
    $stmt->bind_param('i', $term);
} else {
    $stmt = $conn->prepare('UPDATE users SET is_verified = 1 WHERE username = ? OR email = ?');
    $stmt->bind_param('ss', $term, $term);
}
if ($stmt->execute()) { echo "User verified.\n"; } else { echo "Failed: " . $stmt->error . "\n"; }
$stmt->close();
$conn->close();
?>