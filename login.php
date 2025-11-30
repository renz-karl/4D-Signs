<?php
// login.php - Handle user login

session_start();
// Debug log: login attempt start
error_log("[LOGIN] session_id=" . session_id() . "; session_before=" . json_encode(array_keys($_SESSION)), 3, __DIR__ . '/notifications.log');

// Use centralized DB connection
require_once __DIR__ . '/includes/db.php';

// Check if form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $input = isset($_POST['username']) ? trim($_POST['username']) : '' ; // Can be username or email
    $password = $_POST['password'];

    // Validate inputs
    if (empty($input) || empty($password)) {
    header("Location: login.html?error=" . urlencode("Username/email and password are required."));
        exit();
    }

    // Log the sanitized input (do not log password)
    error_log("[LOGIN] Attempt: input=" . $input . " (from POST)" . PHP_EOL, 3, __DIR__ . '/notifications.log');

        // Normalize phone-like input so that users can sign in with 09XXXXXXXXX or +63... and it matches stored Phone values
        $searchInput = $input;
        if (preg_match('/^09[0-9]{9}$/', $input)) {
            require_once __DIR__ . '/includes/notifications.php';
            $searchInput = normalizePhone($input);
        }
        // Query user (allow username, email, or phone)
        $stmt = $conn->prepare("SELECT id, username, email, phone, password, profile_pic_path, is_verified FROM users WHERE username = ? OR email = ? OR phone = ?");
        $stmt->bind_param("sss", $searchInput, $searchInput, $searchInput);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows == 1) {
    $stmt->bind_result($id, $username, $email, $phone, $hashed_password, $profile_pic_path, $is_verified);
        $stmt->fetch();

        error_log("[LOGIN] User found: id=$id username={" . $username . "} email={" . $email . "} is_verified={$is_verified}", 3, __DIR__ . '/notifications.log');

        if (password_verify($password, $hashed_password)) {
            if (!$is_verified) {
                // Not verified yet — redirect to verification page and include email to show in modal
                    $redirect = 'login.html?user_id=' . $id . '&email=' . urlencode($email) . '&error=' . urlencode('Your account is not verified. Please check your email for the OTP or request a new one.');
                    $redirect .= '&show_verify_modal=1';
                    header("Location: " . $redirect);
                exit();
            }
            // Login successful
            session_regenerate_id(true);
            $_SESSION['user_id'] = $id;
            $_SESSION['username'] = $username;
            $_SESSION['email'] = $email;
            $_SESSION['profile_pic'] = $profile_pic_path;
            // Ensure the session cookie is explicitly set with helpful attributes (for browsers that need samesite/httponly)
            if (PHP_VERSION_ID >= 70300) {
                // PHP 7.3+ supports options array
                setcookie(session_name(), session_id(), [
                    'expires' => 0,
                    'path' => '/',
                    'domain' => '',
                    'secure' => false,
                    'httponly' => true,
                    'samesite' => 'Lax'
                ]);
            } else {
                // Backwards compatible setcookie
                setcookie(session_name(), session_id(), 0, '/', '', false, true);
            }
            // Log that session was written
            error_log("[LOGIN] Success: wrote session user_id={$id}, session_id=" . session_id() . "\n", 3, __DIR__ . '/notifications.log');
            // Update last_login
            $updateStmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            if ($updateStmt) {
                $updateStmt->bind_param("i", $id);
                $updateStmt->execute();
                $updateStmt->close();
            }

            header("Location: 4Dsigns.php");
            exit();
        } else {
            $error = "Invalid password.";
        }
    } else {
        // Prefer a friendly message language for missing account
        $error = "This account does not exist.";
    }

    $stmt->close();

    if (isset($error)) {
            header("Location: login.html?error=" . urlencode($error));
        exit();
    }
}

$conn->close();
?>