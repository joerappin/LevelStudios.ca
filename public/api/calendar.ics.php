<?php
header('Content-Type: text/calendar; charset=utf-8');
header('Content-Disposition: inline; filename="level-studios.ics"');
header('Access-Control-Allow-Origin: *');

$root = dirname(__DIR__);

function readActiveReservations($root) {
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
        if ($data && empty($data['trashed'])) $reservations[] = $data;
      }
    }
  }
  return $reservations;
}

function escapeICS($str) {
  return str_replace(['\\', ';', ',', "\n", "\r"], ['\\\\', '\\;', '\\,', '\\n', ''], (string)$str);
}

function fmtDT($date, $time) {
  return str_replace('-', '', $date) . 'T' . str_replace(':', '', $time) . '00';
}

function calcEndTime($startTime, $duration) {
  list($h, $m) = explode(':', $startTime);
  return sprintf('%02d:%02d', (int)$h + (int)$duration, (int)$m);
}

function statusToICS($status) {
  if (in_array($status, ['validee', 'tournee', 'post-prod', 'livree'])) return 'CONFIRMED';
  if (in_array($status, ['annulee', 'rembourse']))                      return 'CANCELLED';
  return 'TENTATIVE';
}

function statusLabel($status) {
  return [
    'a_payer'   => 'À payer',
    'en_attente'=> 'En attente',
    'validee'   => 'Validée',
    'tournee'   => 'Tournée',
    'post-prod' => 'Post-production',
    'livree'    => 'Livrée',
    'annulee'   => 'Annulée',
    'rembourse' => 'Remboursée',
    'absent'    => 'Absent',
  ][$status] ?? $status;
}

$reservations = readActiveReservations($root);
$now = gmdate('Ymd\THis\Z');

$out = [];
$out[] = 'BEGIN:VCALENDAR';
$out[] = 'VERSION:2.0';
$out[] = 'PRODID:-//Level Studios//Réservations//FR';
$out[] = 'CALSCALE:GREGORIAN';
$out[] = 'METHOD:PUBLISH';
$out[] = 'X-WR-CALNAME:Level Studios — Réservations';
$out[] = 'X-WR-TIMEZONE:America/Toronto';
$out[] = 'X-WR-CALDESC:Réservations de studios Level Studios';
$out[] = 'BEGIN:VTIMEZONE';
$out[] = 'TZID:America/Toronto';
$out[] = 'BEGIN:STANDARD';
$out[] = 'DTSTART:19701101T020000';
$out[] = 'RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11';
$out[] = 'TZOFFSETFROM:-0400';
$out[] = 'TZOFFSETTO:-0500';
$out[] = 'TZNAME:EST';
$out[] = 'END:STANDARD';
$out[] = 'BEGIN:DAYLIGHT';
$out[] = 'DTSTART:19700308T020000';
$out[] = 'RRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3';
$out[] = 'TZOFFSETFROM:-0500';
$out[] = 'TZOFFSETTO:-0400';
$out[] = 'TZNAME:EDT';
$out[] = 'END:DAYLIGHT';
$out[] = 'END:VTIMEZONE';

foreach ($reservations as $r) {
  if (empty($r['date']) || empty($r['start_time'])) continue;

  $endTime = !empty($r['end_time'])
    ? $r['end_time']
    : calcEndTime($r['start_time'], $r['duration'] ?? 1);

  $dtstart = fmtDT($r['date'], $r['start_time']);
  $dtend   = fmtDT($r['date'], $endTime);

  $clientName = trim(($r['client_name'] ?? '') ?: (($r['client_first_name'] ?? '') . ' ' . ($r['client_last_name'] ?? '')));
  $summary    = escapeICS(($r['studio'] ?? 'Studio') . ' — ' . $clientName);

  $desc  = 'Formule: ' . ($r['service'] ?? '');
  $desc .= '\nStatut: ' . statusLabel($r['status'] ?? '');
  $desc .= '\nPrix: ' . ($r['price'] ?? '0') . ' CAD';
  $desc .= '\nPersonnes: ' . ($r['persons'] ?? '1');
  if (!empty($r['additional_services']) && is_array($r['additional_services'])) {
    $desc .= '\nOptions: ' . escapeICS(implode(', ', $r['additional_services']));
  }
  if (!empty($r['company'])) $desc .= '\nSociété: ' . escapeICS($r['company']);
  $desc .= '\nID: ' . $r['id'];

  $out[] = 'BEGIN:VEVENT';
  $out[] = 'UID:res-' . $r['id'] . '@levelstudios.ca';
  $out[] = 'DTSTAMP:' . $now;
  $out[] = 'DTSTART;TZID=America/Toronto:' . $dtstart;
  $out[] = 'DTEND;TZID=America/Toronto:' . $dtend;
  $out[] = 'SUMMARY:' . $summary;
  $out[] = 'DESCRIPTION:' . $desc;
  $out[] = 'LOCATION:Level Studios — ' . escapeICS($r['studio'] ?? '');
  $out[] = 'STATUS:' . statusToICS($r['status'] ?? '');
  $out[] = 'END:VEVENT';
}

$out[] = 'END:VCALENDAR';

echo implode("\r\n", $out) . "\r\n";
