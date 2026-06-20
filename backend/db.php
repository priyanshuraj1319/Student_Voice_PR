<?php
$host = 'localhost';
$dbname = 'student_voice';
$username = 'root';
$password = ''; // XAMPP me default empty hota hai

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}
?>