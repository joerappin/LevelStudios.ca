# Level Studios — Contexte projet

## Business

- **Nom** : Level Studios
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

### 🎙️ Offre ARGENT — Enregistrement clé en main

**Tarif : 221 CAD / heure**

#### Studio & encadrement
- Accès à un studio podcast entièrement équipé (décor au choix)
- Opérateur dédié pendant toute la session
- Préparation technique du plateau

#### Équipement inclus
- 3 caméras Sony FX30 (captation multi-angles 4K)
- Jusqu'à 4 micros Shure SM7B
- Éclairage Godox SL300III-K2
- Studio acoustiquement traité

#### Post-production
- Pré-montage (cut + synchro audio/vidéo)
- Export WAV (qualité studio)
- Envoi des fichiers sous 24h

#### Sauvegarde & suivi
- Sauvegarde 14 jours
- Lien de téléchargement
- Assistance technique

---

### 💳 Packs d'heures — Offre ARGENT

| Formule | Prix CAD/h | Total CAD |
|---------|-----------|-----------|
| 1h | 221 CAD | 221 CAD |
| 4h (-10%) | 198 CAD | 794 CAD |
| 10h (-15%) | 187 CAD | 1 874 CAD |
| 20h (-20%) | 176 CAD | 3 528 CAD |

---

### 🥇 Offre GOLD

**Tarif : 587 CAD / heure**

Prestation premium avec accompagnement renforcé et personnalisation avancée.

#### Packs GOLD

| Formule | Prix CAD/h | Total CAD |
|---------|-----------|-----------|
| 1h | 587 CAD | 587 CAD |
| 4h (-10%) | 462 CAD | 1 847 CAD |
| 10h (-15%) | 436 CAD | 4 361 CAD |
| 20h (-20%) | 410 CAD | 8 210 CAD |

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
