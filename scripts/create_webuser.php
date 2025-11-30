<?php
// create_webuser.php
// Runs the `create_webuser.sql` file using root permissions; edit the SQL with your chosen password before running.
$mysqlBin = 'C:\xampp\mysql\bin\mysql.exe';
$sqlFile = __DIR__ . '/create_webuser.sql';
if (!file_exists($sqlFile)) {
    echo "SQL file not found: $sqlFile\n";
    exit(1);
}

// Attempt to run as root (XAMPP default has no root password). If your root has a password, set it.
$rootUser = 'root';
$rootPass = '';

$cmd = sprintf('"%s" -u %s %s < "%s"', $mysqlBin, $rootUser, $rootPass ? '-p'.escapeshellarg($rootPass) : '', $sqlFile);
// If root password is empty, the command will just be `mysql.exe -u root  4d_signs_db < file` if we adapt. We will run with db name and assume no root password.
$cmd = sprintf('"%s" -u %s 4d_signs_db < "%s"', $mysqlBin, $rootUser, $sqlFile);

echo "Running: $cmd\n";

passthru($cmd, $ret);
if ($ret === 0) {
    echo "Created webuser (if not present). Update includes/config.php with the new credentials.\n";
} else {
    echo "Command failed with exit $ret - review output above.\n";
}
?>