<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$root = dirname(__DIR__); // public_html/

function sanitizeEmail($email) {
  return preg_replace('/[^a-z0-9._@-]/', '_', strtolower(trim($email)));
}

// Structure : public_html/customers/{email}/{resId}/reservation.json
function readAllReservations($root) {
  $customersDir = $root . '/customers';
  if (!is_dir($customersDir)) return [];
  $reservations = [];
  foreach (scandir($customersDir) as $emailFolder) {
    if ($emailFolder === '.' || $emailFolder === '..') continue;
    $emailDir = $customersDir . '/' . $emailFolder;
    if (!is_dir($emailDir)) continue;
    foreach (scandir($emailDir) as $entry) {
      if ($entry === '.' || $entry === '..') continue;
      $file = $emailDir . '/' . $entry . '/reservation.json';
      if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true);
        if ($data) $reservations[] = $data;
      }
    }
  }
  usort($reservations, function($a, $b) {
    return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
  });
  return $reservations;
}

function writeReservation($reservation, $root) {
  $folder = !empty($reservation['client_email'])
    ? sanitizeEmail($reservation['client_email'])
    : '_unassigned';
  deleteReservationFile($reservation['id'], $root); // move if email changed
  $clientDir = $root . '/customers/' . $folder . '/' . $reservation['id'];
  if (!is_dir($clientDir)) mkdir($clientDir, 0755, true);
  file_put_contents($clientDir . '/reservation.json', json_encode($reservation, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function deleteReservationFile($id, $root) {
  $customersDir = $root . '/customers';
  if (!is_dir($customersDir)) return;
  foreach (scandir($customersDir) as $emailFolder) {
    if ($emailFolder === '.' || $emailFolder === '..') continue;
    $resDir  = $customersDir . '/' . $emailFolder . '/' . $id;
    $resFile = $resDir . '/reservation.json';
    if (file_exists($resFile)) {
      unlink($resFile);
      @rmdir($resDir);
      return;
    }
  }
}

$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?: [];

if ($method === 'GET') {
  $all = readAllReservations($root);
  // Exclude soft-deleted by default; pass ?include_trashed=1 to include them
  if (empty($_GET['include_trashed'])) {
    $all = array_values(array_filter($all, fn($r) => empty($r['trashed'])));
  }
  if (!empty($_GET['client_email'])) {
    $email = $_GET['client_email'];
    $all = array_values(array_filter($all, fn($r) => ($r['client_email'] ?? '') === $email));
  }
  echo json_encode($all);
  exit;
}

if ($method === 'POST') {
  if (empty($body['id'])) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
  writeReservation($body, $root);
  echo json_encode(['success' => true]);
  exit;
}

if ($method === 'PATCH') {
  if (empty($body['id'])) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
  // Upsert: find existing file to merge into, or create from scratch if not yet on file system
  $all = readAllReservations($root);
  $existing = null;
  foreach ($all as $r) { if ((string)$r['id'] === (string)$body['id']) { $existing = $r; break; } }
  $merged = $existing ? array_merge($existing, $body) : $body;
  writeReservation($merged, $root);
  echo json_encode(['success' => true]);
  exit;
}

if ($method === 'DELETE') {
  if (empty($body['id'])) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
  deleteReservationFile($body['id'], $root);
  echo json_encode(['success' => true]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
