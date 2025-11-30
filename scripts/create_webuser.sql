-- Create a non-root DB user 'webuser' with limited privileges (edit password before running)
CREATE USER IF NOT EXISTS 'webuser'@'localhost' IDENTIFIED BY 'ChangeThisPassword!';
GRANT SELECT, INSERT, UPDATE, DELETE ON `4d_signs_db`.* TO 'webuser'@'localhost';
FLUSH PRIVILEGES;