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
$id         = isset($body['id']) ? $body['id'] : '';
$name       = isset($body['name']) ? $body['name'] : '';
$company    = isset($body['company']) ? $body['company'] : '';
$phone      = isset($body['phone']) ? $body['phone'] : '';
$clientType = isset($body['clientType']) ? $body['clientType'] : 'particulier';
$country    = isset($body['country']) ? $body['country'] : 'CA';
$createdAt  = date('Y-m-d H:i:s');

$base = dirname(__DIR__) . '/customers/' . $email;

if (!is_dir($base)) {
    if (!mkdir($base, 0755, true)) {
        http_response_code(500); echo json_encode(['error' => 'Cannot create directory']); exit;
    }
}

$info = "=== COMPTE CLIENT ===\n";
$info .= "ID          : " . $id . "\n";
$info .= "Nom         : " . $name . "\n";
$info .= "Email       : " . $body['email'] . "\n";
$info .= "Téléphone   : " . $phone . "\n";
$info .= "Entreprise  : " . $company . "\n";
$info .= "Type        : " . $clientType . "\n";
$info .= "Pays        : " . $country . "\n";
$info .= "Créé le     : " . $createdAt . "\n";

file_put_contents($base . '/info.txt', $info);

echo json_encode(['success' => true, 'folder' => 'customers/' . $email]);
