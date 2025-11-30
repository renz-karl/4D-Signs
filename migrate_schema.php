<?php
// migrate_schema.php
// Use this tool to make sure the users table has the new columns and optionally migrate base64 images.
require_once __DIR__ . '/includes/db.php';

function columnExists($conn, $db, $table, $column) {
    $sql = "SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?;";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sss', $db, $table, $column);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    return isset($row['c']) && intval($row['c']) > 0;
}

function uniqueIndexExists($conn, $db, $table, $column) {
    $sql = "SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? AND NON_UNIQUE = 0";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sss', $db, $table, $column);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    return isset($row['c']) && intval($row['c']) > 0;
}

$columnsToAdd = [
    "profile_pic_path VARCHAR(255) DEFAULT NULL",
    "is_admin TINYINT(1) DEFAULT 0",
    "last_login DATETIME DEFAULT NULL"
];

$columnsToAdd = array_merge($columnsToAdd, [
    "otp_code_hash VARCHAR(255) DEFAULT NULL",
    "otp_expires_at DATETIME DEFAULT NULL",
    "is_verified TINYINT(1) DEFAULT 0"
]);

    $columnsToAdd[] = "otp_method ENUM('sms','email') DEFAULT 'sms'";
    // If pending_registrations doesn't exist, add it
    $createPendingTable = "CREATE TABLE IF NOT EXISTS pending_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        profile_pic_path VARCHAR(255) DEFAULT NULL,
        otp_code_hash VARCHAR(255) DEFAULT NULL,
        otp_expires_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )";

foreach ($columnsToAdd as $definition) {
    preg_match('/^([\w_]+)/', $definition, $m);
    $colName = $m[1];
    if (!columnExists($conn, $dbname, 'users', $colName)) {
        echo "Adding column $colName...\n";
        $sql = "ALTER TABLE users ADD COLUMN $definition;";
        if ($conn->query($sql) === TRUE) {
            echo "Column $colName added successfully.\n";
        } else {
            echo "Error adding $colName: " . $conn->error . "\n";
        }
    } else {
        echo "Column $colName already exists, skipping.\n";
    }
}

// Ensure phone uniqueness to enforce OTP per unique phone number
if (!uniqueIndexExists($conn, $dbname, 'users', 'phone')) {
    echo "Adding unique index to users.phone...\n";
    $sql = "ALTER TABLE users ADD UNIQUE INDEX unique_phone (phone)";
    try {
        if ($conn->query($sql) === TRUE) { echo "users.phone unique index added.\n"; } else { echo "Failed to add unique_phone: " . $conn->error . "\n"; }
    } catch (Exception $e) {
        echo "Could not add unique index to users.phone: " . $e->getMessage() . "\n";
        echo "Run the migrate script as a user with ALTER privileges or add the index manually in phpMyAdmin.\n";
    }
} else { echo "users.phone already unique, skipping.\n"; }

// If pending_registrations table exists, add unique index to its phone column
$checkPending = $conn->prepare("SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pending_registrations'");
$checkPending->bind_param('s', $dbname);
$checkPending->execute();
$pRes = $checkPending->get_result()->fetch_assoc();
$checkPending->close();
if (isset($pRes['c']) && intval($pRes['c']) > 0) {
    if (!uniqueIndexExists($conn, $dbname, 'pending_registrations', 'phone')) {
        echo "Adding unique index to pending_registrations.phone...\n";
        $sql = "ALTER TABLE pending_registrations ADD UNIQUE INDEX pending_unique_phone (phone)";
        try {
            if ($conn->query($sql) === TRUE) { echo "pending_registrations.phone unique index added.\n"; } else { echo "Failed to add pending_unique_phone: " . $conn->error . "\n"; }
        } catch (Exception $e) {
            echo "Could not add unique index to pending_registrations.phone: " . $e->getMessage() . "\n";
            echo "Run the migrate script as a user with ALTER privileges or add the index manually in phpMyAdmin.\n";
        }
    } else {
        echo "pending_registrations.phone already unique, skipping.\n";
    }
}

// Ensure pending_registrations table exists
echo "Ensuring pending_registrations table exists...\n";
try {
    if ($conn->query($createPendingTable) === TRUE) {
        echo "pending_registrations table ensured.\n";
    } else {
        echo "Could not ensure pending_registrations table (you may need to run as root): " . $conn->error . "\n";
    }
} catch (Exception $e) {
    echo "Could not ensure pending_registrations table: " . $e->getMessage() . "\n";
    echo "You probably need to run this migration as a user with CREATE TABLE privileges (root).\n";
}

// Optional migration of profile_pic base64 -> file
$needMigrate = false;
$stmt = $conn->prepare("SELECT id, profile_pic FROM users WHERE profile_pic IS NOT NULL AND profile_pic <> ''");
if ($stmt) {
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $needMigrate = true;
    }
    $stmt->close();
}

if ($needMigrate) {
    echo "Found rows with base64 images in profile_pic. This script can try to migrate them to files under uploads/.\n";
    echo "Run with manual approval to proceed. Exiting to be safe.\n";
    exit();
} else {
    echo "No base64 images detected in profile_pic.\n";
}

$conn->close();
?>