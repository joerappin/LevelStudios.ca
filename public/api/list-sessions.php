<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$email = isset($_GET['email']) ? strtolower(trim($_GET['email'])) : '';
if (!$email) { http_response_code(400); echo json_encode(['error' => 'Email required']); exit; }

$emailSafe   = preg_replace('/[^a-zA-Z0-9._@-]/', '_', $email);
$customerDir = dirname(__DIR__) . '/customers/' . $emailSafe;

if (!is_dir($customerDir)) {
    echo json_encode(['sessions' => []]); exit;
}

$sessions = [];
foreach (scandir($customerDir) as $entry) {
    if ($entry === '.' || $entry === '..') continue;
    $sessionDir = $customerDir . '/' . $entry;
    if (!is_dir($sessionDir)) continue;

    $data = ['id' => $entry, 'date' => '', 'studio' => '', 'service' => '', 'duration' => ''];

    $infoFile = $sessionDir . '/session.txt';
    if (file_exists($infoFile)) {
        foreach (file($infoFile) as $line) {
            if (strpos($line, 'Date') !== false)   $data['date']     = trim(explode(':', $line, 2)[1] ?? '');
            if (strpos($line, 'Studio') !== false) $data['studio']   = trim(explode(':', $line, 2)[1] ?? '');
            if (strpos($line, 'Offre') !== false)  $data['service']  = trim(explode(':', $line, 2)[1] ?? '');
            if (strpos($line, 'Durée') !== false)  $data['duration'] = trim(explode(':', $line, 2)[1] ?? '');
        }
    }

    // List rush files in folder (anything that isn't session.txt)
    $files = [];
    foreach (scandir($sessionDir) as $file) {
        if ($file === '.' || $file === '..' || $file === 'session.txt') continue;
        if (is_file($sessionDir . '/' . $file)) {
            $files[] = ['name' => $file, 'url' => '/customers/' . $emailSafe . '/' . $entry . '/' . $file];
        }
    }
    $data['files'] = $files;
    $sessions[] = $data;
}

// Sort by ID descending (newest first)
usort($sessions, fn($a, $b) => strcmp($b['id'], $a['id']));

echo json_encode(['sessions' => $sessions]);
