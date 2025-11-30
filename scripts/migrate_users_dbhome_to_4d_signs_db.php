<?php
// scripts/migrate_users_dbhome_to_4d_signs_db.php
// Migrates users from dbhome.users to 4d_signs_db.users. Dry-run default: set $confirm = true to perform.
require_once __DIR__ . '/../includes/db.php';

$confirm = false; // default false - dry run
// If called with --run, perform the actual migration
global $argv;
if (is_array($argv) && in_array('--run', $argv)) {
    $confirm = true;
}

// Source DB connection (dbhome) - use root for read access
$src = new mysqli('localhost', 'root', '', 'dbhome');
if ($src->connect_error) {
    die('Source DB connect failed: ' . $src->connect_error . "\n");
}

$dest = $conn; // includes/db.php connection to 4d_signs_db

// Gather rows from dbhome.users
$rs = $src->query('SELECT id, username, email, password, phone, profile_pic, created_at, status FROM users');
if (!$rs) {
    die('Query failed on source: ' . $src->error . "\n");
}

$toInsert = [];
while ($row = $rs->fetch_assoc()) {
    // check uniqueness
    $stmt = $dest->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
    $u_check = $row['username'];
    $e_check = $row['email'];
    $stmt->bind_param('ss', $u_check, $e_check);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows == 0) {
        $toInsert[] = $row;
    }
    $stmt->close();
}

echo "Found " . count($toInsert) . " new users to migrate.\n";
if (!$confirm) {
    echo "Dry run mode. Set \$confirm = true in this script to perform the migration.\n";
    exit(0);
}

foreach ($toInsert as $r) {
    // if old system stored base64 in profile_pic, we will leave it in profile_pic column or prefer storing in uploads and profile_pic_path
    $profile_pic_path = NULL;
    if (!empty($r['profile_pic'])) {
        // attempt to decode base64 and save to uploads
        $data = $r['profile_pic'];
        // strip data URI header if present
        if (preg_match('/^data:\/\/([^;]+);base64,/', $data)) {
            $data = preg_replace('/^data:\/\/([^;]+);base64,/', '', $data);
        }
        $bin = base64_decode($data);
        if ($bin !== false) {
            $uploadsDir = __DIR__ . '/../uploads';
            if (!is_dir($uploadsDir)) { mkdir($uploadsDir, 0755, true); }
            $filename = uniqid('p_', true) . '.png';
            $targetPath = $uploadsDir . '/' . $filename;
            if (file_put_contents($targetPath, $bin) !== false) {
                $profile_pic_path = 'uploads/' . $filename;
            }
        }
    }

    $stmt = $dest->prepare('INSERT INTO users (username, email, password, phone, profile_pic_path, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $i_username = $r['username'];
    $i_email = $r['email'];
    $i_password = $r['password'];
    $i_phone = $r['phone'];
    $i_created_at = $r['created_at'];
    $i_status = $r['status'];
    $stmt->bind_param('sssssss', $i_username, $i_email, $i_password, $i_phone, $profile_pic_path, $i_created_at, $i_status);
    if ($stmt->execute()) {
        echo "Migrated user: " . $r['username'] . "\n";
    } else {
        echo "Failed to insert " . $r['username'] . ": " . $stmt->error . "\n";
    }
    $stmt->close();
}

$src->close();
$dest->close();
?>