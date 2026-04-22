# Level Studios — Contexte projet

## Business

- **Nom** : Level Studios
- **Site** : https://levelstudios.ca
- **Activité** : Location de studios de production et post-production audiovisuelle
- **Cible** : B2B, B2C
- **Positionnement** : Studios entièrement équipés, livraison rapide des rushes, service de post-production

---

## Identité visuelle

- **Couleurs principales** : Bleu et blanc
- **Fond** : Noir
- **Police** : Élégante et moderne, jamais fantaisie
- **Ton** : Professionnel, chaleureux, vouvoiement, inspirant sans être prétentieux

---

## Règles de communication

- Toujours vouvoyer le client
- Jamais de jargon technique incompréhensible
- Mettre en avant le lieu et la technique
- Permettre au client de se projeter dans son studio

---

## Offres & Tarifs

> **3 formules** : BRONZE · ARGENT · OR (id interne GOLD)

### 🥉 Offre BRONZE — Enregistrement clé en main

**Tarif : 149 CAD HT / heure**

#### Studio & encadrement
- Accès à un studio podcast entièrement équipé (décor au choix)
- Opérateur dédié pendant toute la session
- Préparation technique du plateau

#### Équipement inclus
- 3 caméras Sony FX30 (captation multi-angles 4K)
- Jusqu'à 4 micros Shure SM7B
- Éclairage Godox SL300III-K2
- Studio acoustiquement traité

#### Livraison
- Envoi des fichiers bruts audio et vidéo sous 24h
- Export WAV (qualité studio)
- Sauvegarde 7 jours

---

### 💳 Packs d'heures — Offre BRONZE

| Formule | Prix CAD/h | Total CAD |
|---------|-----------|-----------|
| 1h | 149 CAD | 149 CAD |
| 4h (-10%) | 134 CAD | 536 CAD |
| 10h (-15%) | 127 CAD | 1 270 CAD |
| 20h (-20%) | 119 CAD | 2 380 CAD |

---

### 🎙️ Offre ARGENT — Bronze + post-production

**Tarif : 199 CAD HT / heure**

Tout ce qui est inclus dans la formule Bronze, plus :

#### Post-production incluse
- Pré-montage
- Montage multicaméra & synchronisation audio/vidéo
- Suppression des silences et des parties indésirables
- Sauvegarde 14 jours (au lieu de 7)

---

### 💳 Packs d'heures — Offre ARGENT

| Formule | Prix CAD/h | Total CAD |
|---------|-----------|-----------|
| 1h | 199 CAD | 199 CAD |
| 4h (-10%) | 179 CAD | 716 CAD |
| 10h (-15%) | 169 CAD | 1 690 CAD |
| 20h (-20%) | 159 CAD | 3 180 CAD |

---

### 🥇 Offre OR (id interne : GOLD)

**Tarif : 499 CAD HT / heure**

Prestation premium avec accompagnement renforcé et personnalisation avancée.

#### Contenu OR
- Formule Argent complète
- Introduction dynamique
- Motion design
- Sound design & sound effects
- 1 révision incluse
- Sauvegarde des fichiers pendant 2 mois

#### Packs OR

| Formule | Prix CAD/h | Total CAD |
|---------|-----------|-----------|
| 1h | 499 CAD | 499 CAD |
| 4h (-10%) | 449 CAD | 1 796 CAD |
| 10h (-15%) | 424 CAD | 4 240 CAD |
| 20h (-20%) | 399 CAD | 7 980 CAD |

---

### ➕ Options supplémentaires

#### Options de base
| Option | Prix |
|--------|------|
| Photo | 44 CAD |
| Short vidéo | 44 CAD |
| Miniature | 44 CAD |

#### Option Live
| Option | Prix |
|--------|------|
| Live stream | 662 CAD |
| Briefing live (obligatoire) | 118 CAD |
| Replay | 74 CAD |

#### Option accompagnement
| Option | Prix |
|--------|------|
| Community manager | 147 CAD |
| Coaching | 588 CAD |

---

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | joe.rappin@gmail.com | *(voir config locale)* |
| Employé | employe@levelstudio.fr | *(voir config locale)* |
| Client | client@test.fr | *(voir config locale)* |

---

## Stack technique

- **Framework** : React 18 + Vite
- **Routing** : React Router 6
- **Style** : Tailwind CSS
- **Icônes** : Lucide React
- **Données** : localStorage (Store — `src/data/store.js`)
- **Auth** : Context API + localStorage (`src/contexts/AuthContext.jsx`)
- **PWA** : `public/manifest.json`

## Lancer le projet

```bash
npm install
npm run dev
```

## Page de maintenance

Une page de maintenance s'affiche **avant** la landing page à chaque nouvelle session navigateur.

- **Fichier** : `src/pages/MaintenancePage.jsx`
- **Intégration** : `src/App.jsx` via `AppWithMaintenance` + `useMaintenanceBypass`
- **Bypass** : stocké en `sessionStorage` (clé `level_maintenance_bypass`)
- **Visuel** : fond noir, girophares animés, barrières rouge/blanc, panneau jaune cliquable ⚠️
- **Accès** : clic sur le panneau → popup → identifiant `Revs` + mot de passe `Mandrier88`

---

## Dossiers de sauvegarde comptes

Ces dossiers sont dans `public/` (copiés automatiquement dans `dist/` à chaque build par Vite). **Ils doivent toujours être présents.**

| Dossier source | Copié vers | Contenu |
|----------------|-----------|---------|
| `public/customers/` | `dist/customers/` | Sauvegardes des comptes clients créés |
| `public/workers/` | `dist/workers/` | Sauvegardes des comptes employés / workers |
| `public/admin/` | `dist/admin/` | Sauvegardes des comptes administrateurs |

---

## Gestion des tarifs

Les prix sont configurables depuis l'interface admin → **`/admin/pricing`**.

- **Stockage** : `localStorage` clé `ls_custom_prices` — **non effacée par les mises à jour du seed**
- **Fallback** : constante `DEFAULT_PRICES` dans `src/data/store.js`
- **Référence** : `$/prices.json` — fichier JSON à la racine du projet, à mettre à jour manuellement pour ancrer de nouveaux tarifs dans le code

### Dossier `$`

| Fichier | Rôle |
|---------|------|
| `$/prices.json` | Référence des tarifs par défaut — source de vérité pour les déploiements frais |

**Workflow prix** : Admin modifie via UI → sauvegardé en localStorage immédiatement → pour pérenniser après un déploiement sur un nouveau navigateur, mettre à jour `$/prices.json` et rebuilder.

---

## Architecture des pages

```
/ (Home)              → Landing page publique
/contact              → Formulaire de contact
/reservation          → Tunnel de réservation multi-étapes

/admin/dashboard      → Dashboard admin (joe.rappin@gmail.com / level88)
/admin/accounts       → Gestion comptes
/admin/calendar       → Calendrier réservations
/admin/reservations   → Liste réservations
/admin/projects       → Kanban projets
/admin/rushes         → Fichiers médias
/admin/messaging      → Messagerie interne
/admin/sav            → SAV clients
/admin/communication  → Popups clients
/admin/promo          → Codes promo
/admin/check          → Pointages employés
/admin/boarding       → RH / congés
/admin/manual         → Manuel interne
/admin/tool           → Outils divers
/admin/pricing        → Gestion des tarifs (admin uniquement)

/employee/dashboard   → Dashboard employé
/employee/projects    → Projets assignés
/employee/messaging   → Messages reçus
/employee/check       → Pointage entrée/sortie
/employee/calendar    → Calendrier sessions
/employee/leave       → Demandes de congé

/client/dashboard     → Dashboard client
/client/account       → Profil
/client/reservations  → Historique réservations
/client/library       → Fichiers livrés
/client/subscription  → Packs d'heures
/client/contact       → SAV
```
