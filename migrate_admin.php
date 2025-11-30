<?php
// migrate_admin.php - Simple web UI to run database migration if you have admin DB credentials.
// Security: only allow from localhost and provide credentials through a form; do NOT expose in public.

// Allow only local access
$remoteIp = $_SERVER['REMOTE_ADDR'] ?? '';
if (!in_array($remoteIp, ['127.0.0.1', '::1'])) {
    http_response_code(403);
    echo "This admin migration page can only be run from localhost for security reasons.";
    exit();
}

function runSqlList($conn, $sqlList) {
    $output = [];
    foreach ($sqlList as $sql) {
        try {
            if ($conn->query($sql) === TRUE) {
                $output[] = "OK: $sql";
            } else {
                $output[] = "ERR: ($conn->errno) " . $conn->error . " - SQL: $sql";
            }
        } catch (Exception $e) {
            $output[] = "EXC: " . $e->getMessage() . " - SQL: $sql";
        }
    }
    return $output;
}

$message = '';
$errors = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dbHost = $_POST['db_host'] ?? 'localhost';
    $dbUser = $_POST['db_user'] ?? 'root';
    $dbPass = $_POST['db_pass'] ?? '';
    $dbName = $_POST['db_name'] ?? '4d_signs_db';

    $conn = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);
    if ($conn->connect_error) {
        $errors[] = 'Connection failed: ' . $conn->connect_error;
    } else {
        $conn->set_charset('utf8mb4');

        // Create pending table
        $createPending = "CREATE TABLE IF NOT EXISTS pending_registrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(100) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            profile_pic_path VARCHAR(255) DEFAULT NULL,
            otp_code_hash VARCHAR(255) DEFAULT NULL,
            otp_expires_at DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )";

        $outputs = runSqlList($conn, [$createPending]);

        // Add unique index to users.phone
        $addUniqueUsers = "ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS unique_phone (phone)";
        // MySQL 'IF NOT EXISTS' with index is not always supported; handle gracefully
        try {
            $r = $conn->query("ALTER TABLE users ADD UNIQUE INDEX unique_phone (phone)");
            if ($r === TRUE) $outputs[] = 'users.phone unique index created.';
        } catch (Exception $e) {
            $outputs[] = 'users.phone unique index creation skipped or failed: ' . $e->getMessage();
        }

        // Add unique index to pending table
        try {
            $r2 = $conn->query("ALTER TABLE pending_registrations ADD UNIQUE INDEX pending_unique_phone (phone)");
            if ($r2 === TRUE) $outputs[] = 'pending_registrations.phone unique index created.';
        } catch (Exception $e) {
            $outputs[] = 'pending_registrations phone unique index creation skipped or failed: ' . $e->getMessage();
        }

        $conn->close();

        $message = implode("\n", $outputs);
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Run DB Migration (Admin)</title>
    <style>body{font-family:Arial,Helvetica,sans-serif;background:#f4f4f5;margin:30px} .box{max-width:700px;margin:0 auto;background:#fff;padding:20px;border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,0.05);}</style>
</head>
<body>
<div class="box">
    <h2>Database migration (Admin)</h2>
    <p>This will create the <code>pending_registrations</code> table and add unique phone indices. Only run this on localhost and with admin DB credentials.</p>
    <?php if (!empty($errors)) { echo '<div style="color:#d00"><pre>' . htmlspecialchars(implode("\n", $errors)) . '</pre></div>'; } ?>
    <?php if (!empty($message)) { echo '<div style="color:#060"><pre>' . htmlspecialchars($message) . '</pre></div>'; } ?>
    <form method="POST">
        <label>DB Host: <input name="db_host" value="localhost"></label><br><br>
        <label>DB User: <input name="db_user" value="root"></label><br><br>
        <label>DB Password: <input name="db_pass" value="" type="password"></label><br><br>
        <label>DB Name: <input name="db_name" value="4d_signs_db"></label><br><br>
        <button type="submit">Run migration</button>
    </form>
</div>
</body>
</html>
