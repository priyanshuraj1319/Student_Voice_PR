<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

$stmt = $pdo->prepare("INSERT INTO issues 
    (name, roll, dept, category, priority, description, date) 
    VALUES (?, ?, ?, ?, ?, ?, ?)");

$stmt->execute([
    $data['name'],
    $data['roll'],
    $data['dept'],
    $data['category'],
    $data['priority'],
    $data['description'],
    date('Y-m-d')
]);

echo json_encode(['success' => true]);
?>