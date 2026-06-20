<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

$stmt = $pdo->prepare("UPDATE issues SET status = ? WHERE id = ?");
$stmt->execute([$data['status'], $data['id']]);

echo json_encode(['success' => true]);
?>