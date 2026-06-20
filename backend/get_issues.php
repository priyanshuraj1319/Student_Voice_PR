<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require 'db.php';

$stmt = $pdo->query("SELECT * FROM issues ORDER BY id DESC");
$issues = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($issues);
?>