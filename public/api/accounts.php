<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$root = dirname(__DIR__); // public_html/

function sanitizeEmail($email) {
  return preg_replace('/[^a-zA-Z0-9._@-]/', '_', strtolower(trim($email)));
}

function accountFolder($account, $root) {
  if ($account['type'] === 'client') {
    return $root . '/customers/' . sanitizeEmail($account['email']);
  }
  if ((isset($account['roleKey']) && $account['roleKey'] === 'admin') || (isset($account['type']) && $account['type'] === 'admin')) {
    return $root . '/admin/' . $account['id'];
  }
  return $root . '/workers/' . $account['id'];
}

function readAllAccounts($root) {
  $accounts = [];
  foreach (['customers', 'workers', 'admin'] as $folder) {
    $dir = $root . '/' . $folder;
    if (!is_dir($dir)) continue;
    foreach (scandir($dir) as $entry) {
      if ($entry === '.' || $entry === '..') continue;
      $file = $dir . '/' . $entry . '/account.json';
      if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true);
        if ($data) $accounts[] = $data;
      }
    }
  }
  return $accounts;
}

function writeAccount($account, $root) {
  $folder = accountFolder($account, $root);
  if (!is_dir($folder)) mkdir($folder, 0755, true);
  file_put_contents($folder . '/account.json', json_encode($account, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?: [];

if ($method === 'GET') {
  echo json_encode(readAllAccounts($root));
  exit;
}

if ($method === 'POST') {
  if (empty($body)) { http_response_code(400); echo json_encode(['error' => 'Empty body']); exit; }
  writeAccount($body, $root);
  echo json_encode(['success' => true]);
  exit;
}

if ($method === 'DELETE') {
  if (empty($body['id'])) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
  $all = readAllAccounts($root);
  $existing = null;
  foreach ($all as $a) { if ($a['id'] === $body['id']) { $existing = $a; break; } }
  if (!$existing) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
  $file = accountFolder($existing, $root) . '/account.json';
  if (file_exists($file)) unlink($file);
  echo json_encode(['success' => true]);
  exit;
}

if ($method === 'PATCH') {
  if (empty($body['id'])) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
  $all = readAllAccounts($root);
  $existing = null;
  foreach ($all as $a) { if ($a['id'] === $body['id']) { $existing = $a; break; } }
  if (!$existing) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
  writeAccount(array_merge($existing, $body), $root);
  echo json_encode(['success' => true]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
