<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$root = dirname(__DIR__); // public_html/

function sanitizeEmail($email) {
  return preg_replace('/[^a-zA-Z0-9._@-]/', '_', strtolower(trim($email)));
}

function activeFolder($account, $root) {
  if ($account['type'] === 'client') {
    return $root . '/customers/' . sanitizeEmail($account['email']);
  }
  if ((isset($account['roleKey']) && $account['roleKey'] === 'admin') || (isset($account['type']) && $account['type'] === 'admin')) {
    return $root . '/admin/' . $account['id'];
  }
  return $root . '/workers/' . $account['id'];
}

function trashFolder($account, $root) {
  if ($account['type'] === 'client') {
    return $root . '/trash/customers/' . sanitizeEmail($account['email']);
  }
  if ((isset($account['roleKey']) && $account['roleKey'] === 'admin') || (isset($account['type']) && $account['type'] === 'admin')) {
    return $root . '/trash/admin/' . $account['id'];
  }
  return $root . '/trash/workers/' . $account['id'];
}

function readAllAccounts($root, $fromTrash = false) {
  $accounts = [];
  $base = $fromTrash ? $root . '/trash' : $root;
  foreach (['customers', 'workers', 'admin'] as $folder) {
    $dir = $base . '/' . $folder;
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

function writeAccount($account, $root, $inTrash = false) {
  $folder = $inTrash ? trashFolder($account, $root) : activeFolder($account, $root);
  if (!is_dir($folder)) mkdir($folder, 0755, true);
  file_put_contents($folder . '/account.json', json_encode($account, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function deleteAccountFile($account, $root, $fromTrash = false) {
  $folder = $fromTrash ? trashFolder($account, $root) : activeFolder($account, $root);
  $file = $folder . '/account.json';
  if (file_exists($file)) unlink($file);
  @rmdir($folder);
}

$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?: [];
$wantTrash = isset($_GET['trash']) && $_GET['trash'] === '1';

if ($method === 'GET') {
  echo json_encode(readAllAccounts($root, $wantTrash));
  exit;
}

if ($method === 'POST') {
  if (empty($body)) { http_response_code(400); echo json_encode(['error' => 'Empty body']); exit; }
  writeAccount($body, $root, false);
  echo json_encode(['success' => true]);
  exit;
}

if ($method === 'DELETE') {
  $id = $body['id'] ?? null;
  $fromTrash = !empty($body['_fromTrash']);
  if (!$id) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
  $all = readAllAccounts($root, $fromTrash);
  $existing = null;
  foreach ($all as $a) { if ($a['id'] === $id) { $existing = $a; break; } }
  if (!$existing) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
  deleteAccountFile($existing, $root, $fromTrash);
  echo json_encode(['success' => true]);
  exit;
}

if ($method === 'PATCH') {
  $action = $body['_action'] ?? null;
  $id     = $body['id'] ?? null;
  if (!$id) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }

  if ($action === 'trash') {
    $existing = null;
    foreach (readAllAccounts($root, false) as $a) { if ($a['id'] === $id) { $existing = $a; break; } }
    if (!$existing) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
    $existing['trashed_at'] = date('c');
    writeAccount($existing, $root, true);
    deleteAccountFile($existing, $root, false);
    echo json_encode(['success' => true]); exit;
  }

  if ($action === 'restore') {
    $existing = null;
    foreach (readAllAccounts($root, true) as $a) { if ($a['id'] === $id) { $existing = $a; break; } }
    if (!$existing) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
    unset($existing['trashed_at']);
    writeAccount($existing, $root, false);
    deleteAccountFile($existing, $root, true);
    echo json_encode(['success' => true]); exit;
  }

  // Normal PATCH
  $existing = null;
  foreach (readAllAccounts($root, false) as $a) { if ($a['id'] === $id) { $existing = $a; break; } }
  if (!$existing) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
  $patch = $body;
  unset($patch['_action']);
  writeAccount(array_merge($existing, $patch), $root, false);
  echo json_encode(['success' => true]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
