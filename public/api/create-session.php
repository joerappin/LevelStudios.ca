<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$body = json_decode(file_get_contents('php://input'), true);
if (!$body || empty($body['email'])) { http_response_code(400); echo json_encode(['error' => 'Email required']); exit; }

$email      = preg_replace('/[^a-zA-Z0-9._@-]/', '_', strtolower(trim($body['email'])));
$sessionId  = isset($body['session_id']) ? $body['session_id'] : str_pad(rand(10000, 99999), 5, '0', STR_PAD_LEFT);
$date       = isset($body['date']) ? $body['date'] : '';
$studio     = isset($body['studio']) ? $body['studio'] : '';
$service    = isset($body['service']) ? $body['service'] : '';
$duration   = isset($body['duration']) ? $body['duration'] : '';
$createdAt  = date('Y-m-d H:i:s');

$customerDir = dirname(__DIR__) . '/customers/' . $email;

// Create customer folder if it doesn't exist (safety)
if (!is_dir($customerDir)) {
    mkdir($customerDir, 0755, true);
}

$sessionDir = $customerDir . '/' . $sessionId;
if (!is_dir($sessionDir)) {
    if (!mkdir($sessionDir, 0755, true)) {
        http_response_code(500); echo json_encode(['error' => 'Cannot create session directory']); exit;
    }
}

$info = "=== SESSION ===\n";
$info .= "Session ID  : " . $sessionId . "\n";
$info .= "Client      : " . $body['email'] . "\n";
$info .= "Date        : " . $date . "\n";
$info .= "Studio      : " . $studio . "\n";
$info .= "Offre       : " . $service . "\n";
$info .= "Durée       : " . $duration . "\n";
$info .= "Créé le     : " . $createdAt . "\n";

file_put_contents($sessionDir . '/session.txt', $info);

echo json_encode(['success' => true, 'session_id' => $sessionId, 'folder' => 'customers/' . $email . '/' . $sessionId]);
