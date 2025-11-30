<?php
// api/verify-otp.php - AJAX endpoint for OTP verification (returns JSON)
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
session_start();

// Robust error handling: ensure any Throwable returns JSON
try {

$userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
$pendingId = isset($_POST['pending_id']) ? intval($_POST['pending_id']) : 0;
$otp = isset($_POST['otp']) ? trim($_POST['otp']) : '';

if (($userId <= 0 && $pendingId <= 0) || $otp === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing user_id or otp']);
    exit();
}

$isPending = ($pendingId > 0);
if ($isPending) {
    // quick check: pending table exists
    $s = $conn->prepare("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pending_registrations'");
    $dbParam = isset($config['db_name']) ? $config['db_name'] : $dbname;
    $s->bind_param('s', $dbParam);
    $s->execute();
    $r = $s->get_result()->fetch_assoc();
    $s->close();
    if (!(isset($r['c']) && intval($r['c']) > 0)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Server misconfiguration: pending_registrations table missing. Run migrate_schema.php']);
        exit();
    }
}
if ($isPending) {
    $stmt = $conn->prepare("SELECT id, username, email, password_hash, phone, profile_pic_path, otp_code_hash, otp_expires_at FROM pending_registrations WHERE id = ?");
    $stmt->bind_param('i', $pendingId);
} else {
    $stmt = $conn->prepare("SELECT id, username, email, otp_code_hash, otp_expires_at FROM users WHERE id = ?");
    $stmt->bind_param('i', $userId);
}
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows != 1) {
    $stmt->close();
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit();
}
$passwordHashOrNull = null; $phoneOrNull = null; $profilePicOrNull = null;
if ($isPending) {
    $stmt->bind_result($id, $username, $email, $passwordHashOrNull, $phoneOrNull, $profilePicOrNull, $otpHash, $otpExpiresAt);
} else {
    $stmt->bind_result($id, $username, $email, $otpHash, $otpExpiresAt);
}
$stmt->fetch();
$stmt->close();

if (!$otpHash || !$otpExpiresAt) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'OTP not set or expired']);
    exit();
}

if (new DateTime($otpExpiresAt) < new DateTime()) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'OTP expired']);
    exit();
}

if (!password_verify($otp, $otpHash)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Invalid code']);
    exit();
}

if ($isPending) {
    // Create a real user from pending registration
    $insertStmt = $conn->prepare("INSERT INTO users (username, email, password, phone, profile_pic_path, is_verified) VALUES (?, ?, ?, ?, ?, 1)");
    $insertStmt->bind_param('sssss', $username, $email, $passwordHashOrNull, $phoneOrNull, $profilePicOrNull);
    $ok = $insertStmt->execute();
    if ($ok) {
        $newUserId = $conn->insert_id;
        // Delete pending registration
        $del = $conn->prepare('DELETE FROM pending_registrations WHERE id = ?');
        $del->bind_param('i', $pendingId);
        $del->execute();
        $del->close();
        $id = $newUserId; // for session
    }
    $insertStmt->close();
} else {
    // Mark user as verified and clear OTP
    $up = $conn->prepare("UPDATE users SET is_verified = 1, otp_code_hash = NULL, otp_expires_at = NULL WHERE id = ?");
    $up->bind_param('i', $userId);
    $ok = $up->execute();
    $up->close();
}

if (!$ok) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update verification status']);
    exit();
}

// Set session data for auto-login
$_SESSION['user_id'] = $id;
$_SESSION['username'] = $username;
$_SESSION['email'] = $email;

echo json_encode(['success' => true, 'redirect' => '4Dsigns.php']);
exit();
} catch (Throwable $t) {
    http_response_code(500);
    error_log('Exception in api/verify-otp.php: ' . $t->getMessage() . "\n" . $t->getTraceAsString(), 3, __DIR__ . '/../notifications.log');
    $errMsg = 'Internal server error';
    $errMsg = (!empty($config['debug']) ? ('Server error: ' . $t->getMessage()) : $errMsg);
    echo json_encode(['success' => false, 'error' => $errMsg]);
    exit();
}
?>
