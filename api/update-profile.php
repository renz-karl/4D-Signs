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

// Support both JSON and multipart/form-data POSTs (with file upload).
if (!empty($_FILES) || (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false)) {
    $data = $_POST;
} else {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: $_POST;
}

$userId = intval($_SESSION['user_id']);
$newUsername = isset($data['username']) ? trim($data['username']) : null;
$currentPassword = isset($data['current_password']) ? $data['current_password'] : null;
$newPassword = isset($data['new_password']) ? $data['new_password'] : null;
$phone = isset($data['phone']) ? trim($data['phone']) : null;
// We'll handle profile picture upload if present in $_FILES (store path then add to update list later)
$profile_pic_path = null;
if (isset($_FILES['profilePic']) && $_FILES['profilePic']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['profilePic'];
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowed_types) || $file['size'] > 2 * 1024 * 1024) {
        http_response_code(400);
        $response['errors'][] = 'Invalid profile picture. Use JPG/PNG/GIF under 2MB.';
        echo json_encode($response);
        exit();
    }
    $uploadsDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('p_', true) . '.' . $ext;
    $targetPath = $uploadsDir . '/' . $filename;
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        http_response_code(500);
        $response['errors'][] = 'Failed to save uploaded file.';
        echo json_encode($response);
        exit();
    }
    // Return a web-accessible path (absolute prefixed) to the uploads folder
    $profile_pic_path = '/4D-Signs/uploads/' . $filename;
    // We'll add update entry later (after initializing $updates)
}

$stmt = $conn->prepare('SELECT id, username, email, phone, password, profile_pic_path FROM users WHERE id = ? LIMIT 1');
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

// Determine if this request is trying to change sensitive fields
$usernameChange = ($newUsername && $newUsername !== $current['username']);
$phoneNormalized = null;
$phoneChange = false;
if ($phone !== null) {
    $phoneNormalized = normalizePhone($phone);
    $phoneChange = ($phoneNormalized && $phoneNormalized !== $current['phone']);
}
$passwordChange = !empty($newPassword);

// Require current password only when changing username, phone, or password
if ($current['password'] && ($usernameChange || $phoneChange || $passwordChange)) {
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
// If a file upload was handled earlier, add its profile_pic_path to the updates
if (!empty($profile_pic_path)) {
    $updates[] = 'profile_pic_path = ?'; $params[] = $profile_pic_path; $types .= 's';
}

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
    $normalized = $phoneNormalized ?? normalizePhone($phone);
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
        'phone' => $current['phone'],
        'profile_pic_path' => isset($current['profile_pic_path']) ? $current['profile_pic_path'] : null
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

$bind_names = array();
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
$stmt = $conn->prepare('SELECT id, username, email, phone, profile_pic_path, created_at FROM users WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $userId);
$stmt->execute();
$res = $stmt->get_result();
$updated = $res->fetch_assoc();
$stmt->close();

// Update session data
// Normalize returned path for client consumption (absolute web path)
$pp = isset($updated['profile_pic_path']) ? $updated['profile_pic_path'] : null;
if ($pp && strpos($pp, 'http') !== 0 && strpos($pp, '/') !== 0) {
    $pp = '/4D-Signs/' . ltrim($pp, '/\\');
}
$_SESSION['username'] = $updated['username'];
$_SESSION['phone'] = $updated['phone'];
// Keep both keys set for backwards and forwards compatibility
$_SESSION['profile_pic'] = $pp ?: ($_SESSION['profile_pic'] ?? '');
$_SESSION['profile_pic_path'] = $pp ?: ($_SESSION['profile_pic_path'] ?? $_SESSION['profile_pic'] ?? '');
$_SESSION['created_at'] = isset($updated['created_at']) ? $updated['created_at'] : $_SESSION['created_at'] ?? null;
$_SESSION['loggedInAt'] = $_SESSION['created_at'] ?? $_SESSION['loggedInAt'] ?? null;

$response['success'] = true;
$updated['profile_pic_path'] = $pp;
$response['session_user'] = $updated;
// Debug log: successful update
error_log("[UPDATE-PROFILE] user={$userId} profile_pic_path={$pp}\n", 3, __DIR__ . '/../notifications.log');
echo json_encode($response);
exit();
?>
