<?php

// 🔹 Utilisateur connecté (session)
session_start();
$user = $_SESSION['user'] ?? null;

if (!$user) {
    http_response_code(401);
    echo "Non autorisé.";
    exit;
}

// 🔹 Charger TOUTES les réservations de TOUS les clients
function loadAllReservations($baseDir = "customers") {
    $reservations = [];

    foreach (glob($baseDir . "/*", GLOB_ONLYDIR) as $clientDir) {

        foreach (glob($clientDir . "/*", GLOB_ONLYDIR) as $reservationDir) {

            $file = $reservationDir . "/reservation.json";

            if (file_exists($file)) {
                $data = json_decode(file_get_contents($file), true);
                if (!$data) continue; // guard JSON malformé
                $reservations[] = $data;
            }
        }
    }

    return $reservations;
}

// 🔹 Filtrer selon rôle
function getReservationsByRole($user, $reservations) {

    // 👑 ADMIN → tout voir
    if ($user["role"] === "admin") {
        return $reservations;
    }

    // 👤 CLIENT → ses réservations
    if ($user["role"] === "client") {
        return array_values(array_filter($reservations, function($r) use ($user) {
            return strtolower($r["client_email"] ?? "") === strtolower($user["email"]);
        }));
    }

    // 👷 EMPLOYÉ → son planning
    if ($user["role"] === "employee") {
        return array_values(array_filter($reservations, function($r) use ($user) {
            return strtolower($r["employee"] ?? "") === strtolower($user["email"]);
        }));
    }

    return [];
}

// 🔹 Affichage
function afficherReservations($reservations, $user) {

    if (empty($reservations)) {
        echo "<p>Aucune réservation.</p>";
        return;
    }

    foreach ($reservations as $r) {

        echo "<div style='border:1px solid #ccc; padding:10px; margin:10px;'>";

        echo "<strong>ID:</strong> "      . htmlspecialchars($r["id"]           ?? "N/A") . "<br>";
        echo "<strong>Client:</strong> "  . htmlspecialchars($r["client_email"] ?? "-")   . "<br>";
        echo "<strong>Employé:</strong> " . htmlspecialchars($r["employee"]     ?? "-")   . "<br>";
        echo "<strong>Date:</strong> "    . htmlspecialchars($r["date"]         ?? "-")   . "<br>";
        echo "<strong>Heure:</strong> "   . htmlspecialchars($r["start_time"]   ?? "-")   . "<br>";
        echo "<strong>Statut:</strong> "  . htmlspecialchars($r["status"]       ?? "-")   . "<br>";

        // 💰 visible seulement admin
        if ($user["role"] === "admin") {
            echo "<strong>Montant:</strong> " . htmlspecialchars($r["price"] ?? "0") . " CAD<br>";
        }

        echo "</div>";
    }
}

// 🔹 EXECUTION
$root         = dirname(__DIR__);
$reservations = loadAllReservations($root . "/customers");
$resFiltrees  = getReservationsByRole($user, $reservations);

afficherReservations($resFiltrees, $user);
