<?php
// api/update-profile.php
// Update the logged-in user's profile (username, phone, password)
header('Content-Type: application/json');
session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/notifications.php';

$response = ['success' => false, 'errors' => []];

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    $response['errors'][] = 'Not authenticated.';
    echo json_encode($response);
    exit();
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$userId = intval($_SESSION['user_id']);
$newUsername = isset($data['username']) ? trim($data['username']) : null;
$currentPassword = isset($data['current_password']) ? $data['current_password'] : null;
$newPassword = isset($data['new_password']) ? $data['new_password'] : null;
$phone = isset($data['phone']) ? trim($data['phone']) : null;

// Load current user data
$stmt = $conn->prepare('SELECT id, username, email, phone, password FROM users WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $userId);
$stmt->execute();
$result = $stmt->get_result();
if (!$result || $result->num_rows !== 1) {
    http_response_code(404);
    $response['errors'][] = 'User not found.';
    echo json_encode($response);
    exit();
}
$current = $result->fetch_assoc();
$stmt->close();

// Check current password if user has a password set
if ($current['password']) {
    if (empty($currentPassword) || !password_verify($currentPassword, $current['password'])) {
        http_response_code(403);
        $response['errors'][] = 'Current password is incorrect.';
        echo json_encode($response);
        exit();
    }
}

$updates = [];
$params = [];
$types = '';

// Validate and handle username change
if ($newUsername && $newUsername !== $current['username']) {
    // Check uniqueness
    $tstmt = $conn->prepare('SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1');
    $tstmt->bind_param('si', $newUsername, $userId);
    $tstmt->execute();
    $tres = $tstmt->get_result();
    if ($tres && $tres->num_rows > 0) {
        $response['errors'][] = 'Username already taken.';
        echo json_encode($response);
        exit();
    }
    $tstmt->close();
    $updates[] = 'username = ?'; $params[] = $newUsername; $types .= 's';
}

// Validate phone
if ($phone !== null) {
    $normalized = normalizePhone($phone);
    // Only support normalized Philippine numbers +63XXXXXXXXX
    if (!$normalized || !preg_match('/^\+63\d{9}$/', $normalized)) {
        $response['errors'][] = 'Invalid phone number format.';
        echo json_encode($response);
        exit();
    }
    // Check uniqueness
    $pstmt = $conn->prepare('SELECT id FROM users WHERE phone = ? AND id != ? LIMIT 1');
    $pstmt->bind_param('si', $normalized, $userId);
    $pstmt->execute();
    $pres = $pstmt->get_result();
    if ($pres && $pres->num_rows > 0) {
        $response['errors'][] = 'Phone number already in use.';
        echo json_encode($response);
        exit();
    }
    $pstmt->close();
    $updates[] = 'phone = ?'; $params[] = $normalized; $types .= 's';
}

// Handle new password
if ($newPassword) {
    if (strlen($newPassword) < 6) {
        $response['errors'][] = 'New password must be at least 6 characters long.';
        echo json_encode($response);
        exit();
    }
    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $updates[] = 'password = ?'; $params[] = $hash; $types .= 's';
}

if (empty($updates)) {
    // Nothing to change
    $response['success'] = true;
    $response['session_user'] = [
        'id' => $current['id'],
        'username' => $current['username'],
        'email' => $current['email'],
        'phone' => $current['phone']
    ];
    echo json_encode($response);
    exit();
}

$setClause = implode(', ', $updates);
$sql = sprintf('UPDATE users SET %s WHERE id = ?', $setClause);
$stmt = $conn->prepare($sql);
// bind params
$types .= 'i';
$params[] = $userId;

$bind_names[] = $types;
for ($i = 0; $i < count($params); $i++) {
    $bind_name = 'bind' . $i;
    $$bind_name = $params[$i];
    $bind_names[] = &$$bind_name;
}
// call_user_func_array requires the variables passed by reference
call_user_func_array([$stmt, 'bind_param'], $bind_names);

if (!$stmt->execute()) {
    http_response_code(500);
    error_log("[UPDATE-PROFILE] Failed to execute update: " . $stmt->error, 3, __DIR__ . '/../notifications.log');
    $response['errors'][] = 'Failed to update profile.';
    echo json_encode($response);
    exit();
}

$stmt->close();

// Refresh user data and session
$stmt = $conn->prepare('SELECT id, username, email, phone, created_at FROM users WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $userId);
$stmt->execute();
$res = $stmt->get_result();
$updated = $res->fetch_assoc();
$stmt->close();

// Update session data
$_SESSION['username'] = $updated['username'];
$_SESSION['phone'] = $updated['phone'];
$_SESSION['created_at'] = isset($updated['created_at']) ? $updated['created_at'] : $_SESSION['created_at'] ?? null;
$_SESSION['loggedInAt'] = $_SESSION['created_at'] ?? $_SESSION['loggedInAt'] ?? null;

$response['success'] = true;
$response['session_user'] = $updated;
echo json_encode($response);
exit();
?>
