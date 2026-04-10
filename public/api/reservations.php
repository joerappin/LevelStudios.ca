<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$root   = dirname(__DIR__); // public_html/
$resDir = $root . '/reservations';

function readAllReservations($resDir) {
  if (!is_dir($resDir)) return [];
  $reservations = [];
  foreach (scandir($resDir) as $entry) {
    if ($entry === '.' || $entry === '..') continue;
    $file = $resDir . '/' . $entry . '/reservation.json';
    if (file_exists($file)) {
      $data = json_decode(file_get_contents($file), true);
      if ($data) $reservations[] = $data;
    }
  }
  usort($reservations, function($a, $b) {
    return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
  });
  return $reservations;
}

function writeReservation($reservation, $resDir) {
  $dir = $resDir . '/' . $reservation['id'];
  if (!is_dir($dir)) mkdir($dir, 0755, true);
  file_put_contents($dir . '/reservation.json', json_encode($reservation, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?: [];

if ($method === 'GET') {
  $all = readAllReservations($resDir);
  if (!empty($_GET['client_email'])) {
    $email = $_GET['client_email'];
    $all = array_values(array_filter($all, fn($r) => ($r['client_email'] ?? '') === $email));
  }
  echo json_encode($all);
  exit;
}

if ($method === 'POST') {
  if (empty($body['id'])) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
  writeReservation($body, $resDir);
  echo json_encode(['success' => true]);
  exit;
}

if ($method === 'PATCH') {
  if (empty($body['id'])) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
  $all = readAllReservations($resDir);
  $existing = null;
  foreach ($all as $r) { if ((string)$r['id'] === (string)$body['id']) { $existing = $r; break; } }
  if (!$existing) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
  writeReservation(array_merge($existing, $body), $resDir);
  echo json_encode(['success' => true]);
  exit;
}

if ($method === 'DELETE') {
  if (empty($body['id'])) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
  $dir  = $resDir . '/' . $body['id'];
  $file = $dir . '/reservation.json';
  if (file_exists($file)) unlink($file);
  @rmdir($dir);
  echo json_encode(['success' => true]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
