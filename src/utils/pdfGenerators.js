import { jsPDF } from 'jspdf'

// ── Constantes A4 ─────────────────────────────────────────────────────────────
const W = 210
const H = 297
const M = 18           // marge
const CW = W - M * 2  // largeur utile

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  bg:      [6,   6,   6],
  card:    [17,  17,  17],
  border:  [35,  35,  35],
  white:   [255, 255, 255],
  grey:    [90,  90,  90],
  lgrey:   [160, 160, 160],
  cyan:    [136, 235, 255],
  pink:    [255, 137, 172],
  purple:  [234, 115, 251],
  client:  [0,   188, 212],
  chef:    [156, 39,  176],
  emp:     [96,  125, 139],
  admin:   [255, 152, 0],
  pub:     [232, 23,  93],
  green:   [39,  174, 96],
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const rgb  = (doc, type, c) => {
  if (type === 'fill') doc.setFillColor(c[0], c[1], c[2])
  else if (type === 'draw') doc.setDrawColor(c[0], c[1], c[2])
  else doc.setTextColor(c[0], c[1], c[2])
}

function arrow(doc, x1, y1, x2, y2, hs = 3.5) {
  doc.line(x1, y1, x2, y2)
  const a = Math.atan2(y2 - y1, x2 - x1)
  doc.line(x2, y2, x2 - hs * Math.cos(a - 0.45), y2 - hs * Math.sin(a - 0.45))
  doc.line(x2, y2, x2 - hs * Math.cos(a + 0.45), y2 - hs * Math.sin(a + 0.45))
}

function dashedLine(doc, x1, y1, x2, y2, dashLen = 3, gap = 2) {
  const dx = x2 - x1, dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)
  const nx = dx / dist, ny = dy / dist
  let d = 0, drawing = true
  while (d < dist) {
    const seg = Math.min(drawing ? dashLen : gap, dist - d)
    if (drawing) doc.line(x1 + nx * d, y1 + ny * d, x1 + nx * (d + seg), y1 + ny * (d + seg))
    d += seg
    drawing = !drawing
  }
}

function box(doc, x, y, w, h, r = 6, fill = P.card, stroke = P.border) {
  doc.setLineWidth(0.4)
  rgb(doc, 'fill', fill)
  rgb(doc, 'draw', stroke)
  doc.roundedRect(x, y, w, h, r, r, 'FD')
}

function badge(doc, x, y, label, color) {
  const fw = doc.getTextWidth(label) + 8
  rgb(doc, 'fill', color)
  rgb(doc, 'draw', color)
  doc.roundedRect(x, y - 4, fw, 6, 2, 2, 'F')
  rgb(doc, 'text', P.bg)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.text(label, x + 4, y, { baseline: 'middle' })
  return fw
}

function dot(doc, x, y, n, color) {
  const r = 4
  rgb(doc, 'fill', color)
  doc.circle(x, y, r, 'F')
  rgb(doc, 'text', P.bg)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.text(String(n), x, y + 0.5, { align: 'center', baseline: 'middle' })
}

function accentLine(doc, y, color) {
  rgb(doc, 'fill', color)
  doc.rect(0, y, W, 2, 'F')
}

function cover(doc, title, subtitle, acc) {
  // fond plein
  rgb(doc, 'fill', P.bg)
  doc.rect(0, 0, W, H, 'F')

  // barre accent top
  rgb(doc, 'fill', acc)
  doc.rect(0, 0, W, 3, 'F')

  // logo
  rgb(doc, 'text', P.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('LEVEL STUDIOS', M, 30)
  badge(doc, M + 2, 39, 'DOCUMENTATION', acc)

  // grand trait
  rgb(doc, 'draw', P.border)
  doc.setLineWidth(0.3)
  doc.line(M, 78, W - M, 78)

  // titre
  rgb(doc, 'text', P.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.text(title, M, 96)

  // sous-titre
  rgb(doc, 'text', P.lgrey)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(subtitle, M, 108)

  // trait bas
  doc.line(M, 122, W - M, 122)

  // info bas
  rgb(doc, 'text', P.grey)
  doc.setFontSize(8)
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, M, H - 18)
  doc.text('Level Studios — Espace Admin', W - M, H - 18, { align: 'right' })

  // numéro page décoratif
  rgb(doc, 'text', P.border)
  doc.setFontSize(80)
  doc.setFont('helvetica', 'bold')
  doc.text('01', W - M, H - 36, { align: 'right', baseline: 'bottom' })
}

function pageHeader(doc, title, pNum, acc) {
  rgb(doc, 'fill', P.bg)
  doc.rect(0, 0, W, H, 'F')

  rgb(doc, 'fill', acc)
  doc.rect(0, 0, W, 1.5, 'F')

  rgb(doc, 'text', P.lgrey)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('LEVEL STUDIOS — DOCUMENTATION', M, 10)
  doc.text(`Page ${pNum}`, W - M, 10, { align: 'right' })

  rgb(doc, 'draw', P.border)
  doc.setLineWidth(0.2)
  doc.line(M, 13, W - M, 13)

  rgb(doc, 'text', P.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, M, 24)

  rgb(doc, 'fill', acc)
  doc.rect(M, 28, 32, 1.5, 'F')
}


// ══════════════════════════════════════════════════════════════════════════════
// PDF 1 — DOCUMENTATION COMPLÈTE DU SITE
// ══════════════════════════════════════════════════════════════════════════════
const SITE_PAGES = [
  {
    group: 'Pages publiques', color: P.pub, badge: 'PUBLIC',
    desc: 'Accessibles sans connexion — front vitrine de Level Studios',
    pages: [
      { path: '/',                         label: 'Accueil',          desc: 'Landing page : présentation des studios, offres, galerie, CTA réservation' },
      { path: '/contact',                  label: 'Contact',          desc: 'Formulaire de contact, coordonnées, carte Google Maps' },
      { path: '/reservation',              label: 'Réservation',      desc: 'Tunnel de réservation multi-étapes : studio, service, date, options, paiement' },
      { path: '/loginteamlevelprivate',    label: 'Connexion Équipe', desc: 'Authentification sécurisée pour les comptes admin et employé' },
    ]
  },
  {
    group: 'Espace Client', color: P.client, badge: 'CLIENT',
    desc: 'Accessible après connexion client — deux vues disponibles (Classique et Neo)',
    pages: [
      { path: '/client/dashboard',    label: 'Dashboard',        desc: 'Vue principale : carrousel, stats, dernière réservation, pack d\'heures, historique' },
      { path: '/client/reservations', label: 'Réservations',     desc: 'Toutes les réservations : filtres, statuts, annulation, téléchargement facture' },
      { path: '/client/library',      label: 'Médiathèque',      desc: 'Fichiers livrés par projet : vidéos, photos, audio — téléchargement individuel/zip' },
      { path: '/client/subscription', label: 'Packs d\'heures',  desc: 'Achat et suivi des packs Bronze / Argent / Or, historique des achats' },
      { path: '/client/account',      label: 'Mon compte',       desc: 'Infos personnelles, changement de mot de passe, préférences' },
      { path: '/client/contact',      label: 'Support SAV',      desc: 'Ouverture de ticket SAV, suivi des échanges, notation de l\'équipe' },
    ]
  },
  {
    group: 'Espace Client — Vue Neo', color: P.purple, badge: 'NEO',
    desc: 'Interface cinématographique (style Netflix) — même contenu que la vue classique',
    pages: [
      { path: '/clienttest/dashboard',    label: 'Dashboard Neo',        desc: 'Version immersive du dashboard : hero plein écran, sections horizontales' },
      { path: '/clienttest/reservations', label: 'Réservations Neo',     desc: 'Liste des réservations avec fond sombre et cartes visuelles' },
      { path: '/clienttest/library',      label: 'Médiathèque Neo',      desc: 'Galerie médias en mode sombre, preview vidéo intégré' },
      { path: '/clienttest/invoices',     label: 'Factures Neo',         desc: 'Historique des factures et paiements' },
      { path: '/clienttest/account',      label: 'Compte Neo',           desc: 'Profil client dans l\'interface Neo' },
      { path: '/clienttest/contact',      label: 'Contact SAV Neo',      desc: 'SAV dans l\'interface sombre' },
    ]
  },
  {
    group: 'Chef de Projets', color: P.chef, badge: 'CHEF',
    desc: 'Rôle intermédiaire : supervise les projets et les employés',
    pages: [
      { path: '/chef/dashboard',    label: 'Dashboard',    desc: 'Vue d\'ensemble des projets actifs, alertes, KPIs équipe' },
      { path: '/chef/calendar',     label: 'Calendrier',   desc: 'Planning des sessions studio, vue semaine/mois, conflits de réservation' },
      { path: '/chef/reservations', label: 'Réservations', desc: 'Toutes les réservations clients à gérer, changement de statut' },
      { path: '/chef/projects',     label: 'Projets',      desc: 'Kanban des projets : To Do, En cours, Livré — drag & drop' },
      { path: '/chef/rushes',       label: 'Rushes',       desc: 'Upload et gestion des fichiers livrés par réservation' },
      { path: '/chef/messaging',    label: 'Messagerie',   desc: 'Messagerie interne avec les employés et l\'admin' },
      { path: '/chef/sav',          label: 'SAV',          desc: 'Suivi des tickets SAV clients assignés au chef' },
      { path: '/chef/perf',         label: 'Performance',  desc: 'KPIs personnels : sessions, heures, satisfaction clients' },
    ]
  },
  {
    group: 'Employé', color: P.emp, badge: 'EMPLOYÉ',
    desc: 'Technicien de plateau — accès opérationnel aux tâches quotidiennes',
    pages: [
      { path: '/employee/dashboard', label: 'Dashboard',  desc: 'Prochaines sessions, alertes non lues, planning de la semaine' },
      { path: '/employee/projects',  label: 'Projets',    desc: 'Projets assignés à cet employé, avancement, notes de production' },
      { path: '/employee/calendar',  label: 'Calendrier', desc: 'Calendrier personnel : sessions, congés, disponibilités' },
      { path: '/employee/check',     label: 'Pointage',   desc: 'Entrée / sortie, historique des pointages, récapitulatif mensuel' },
      { path: '/employee/messaging', label: 'Messagerie', desc: 'Messages reçus du chef de projet et de l\'admin' },
      { path: '/employee/leave',     label: 'Congés',     desc: 'Demandes de congé, suivi des validations, solde de congés' },
      { path: '/employee/rushes',    label: 'Rushes',     desc: 'Upload des fichiers de tournage liés à une réservation' },
    ]
  },
  {
    group: 'Administration', color: P.admin, badge: 'ADMIN',
    desc: 'Accès complet — gestion globale de la plateforme Level Studios',
    pages: [
      { path: '/admin/dashboard',     label: 'Dashboard',     desc: 'Vue globale : CA, réservations, alertes, satisfaction, activité récente' },
      { path: '/admin/accounts',      label: 'Comptes',       desc: 'Gestion des clients, employés, impersonation, suspension, corbeille' },
      { path: '/admin/calendar',      label: 'Calendrier',    desc: 'Planning complet de tous les studios, vue multi-ressources' },
      { path: '/admin/reservations',  label: 'Réservations',  desc: 'Toutes les réservations : statuts, validation, facturation, export' },
      { path: '/admin/projects',      label: 'Projets',       desc: 'Kanban global, assignation aux chefs, suivi des livraisons' },
      { path: '/admin/rushes',        label: 'Rushes',        desc: 'Gestionnaire de fichiers global, organisation par client/réservation' },
      { path: '/admin/messaging',     label: 'Messagerie',    desc: 'Messagerie interne complète, broadcast, pièces jointes' },
      { path: '/admin/sav',           label: 'SAV',           desc: 'Tickets SAV : ouverture, suivi, clôture, notation client' },
      { path: '/admin/satisfaction',  label: 'Satisfaction',  desc: 'Historique des notes SAV, moyenne, tendances par période' },
      { path: '/admin/communication', label: 'Communication', desc: 'Popups clients : création, ciblage, durée, types info/warning/success' },
      { path: '/admin/promo',         label: 'Promos',        desc: 'Codes promo : création, montant ou %, durée, usages, désactivation' },
      { path: '/admin/check',         label: 'Pointages',     desc: 'Tableau de bord des pointages employés, exports, anomalies' },
      { path: '/admin/boarding',      label: 'RH / Congés',   desc: 'Demandes de congé des employés, validation, planning RH' },
      { path: '/admin/pricing',       label: 'Tarifs',        desc: 'Configuration des prix Bronze/Argent/Or et options à la carte' },
      { path: '/admin/manual',        label: 'Manuel',        desc: 'Manuel interne : procédures, notes, wiki de l\'équipe' },
      { path: '/admin/tool',          label: 'Outils',        desc: 'Outils divers : reset données, exports, utilitaires' },
      { path: '/admin/index',         label: 'Index pages',   desc: 'Index de toutes les pages du site, activation/désactivation, éditeur' },
    ]
  },
]

export function generateSiteDoc() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const acc = P.cyan
  let pageNum = 1

  // ── Page 1 : Couverture ──────────────────────────────────────────────────
  cover(doc, 'Documentation\ndu site', 'Architecture complète — toutes les pages et fonctionnalités', acc)

  // ── Page 2 : Sommaire ─────────────────────────────────────────────────────
  doc.addPage()
  pageNum++
  pageHeader(doc, 'Sommaire', pageNum, acc)

  let sy = 38
  SITE_PAGES.forEach((g, gi) => {
    // group label
    rgb(doc, 'fill', g.color)
    doc.rect(M, sy, 3, 5, 'F')
    rgb(doc, 'text', P.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(g.group.toUpperCase(), M + 6, sy + 3.5)
    rgb(doc, 'text', P.grey)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    g.pages.forEach((p, pi) => {
      doc.text(`• ${p.label}`, M + 8, sy + 9 + pi * 6)
      rgb(doc, 'text', P.border)
      doc.text(p.path, W - M, sy + 9 + pi * 6, { align: 'right' })
      rgb(doc, 'text', P.grey)
    })
    sy += 12 + g.pages.length * 6 + 4
    if (sy > H - 25 && gi < SITE_PAGES.length - 1) {
      doc.addPage(); pageNum++
      pageHeader(doc, 'Sommaire (suite)', pageNum, acc)
      sy = 38
    }
  })

  // ── Pages groupes ─────────────────────────────────────────────────────────
  SITE_PAGES.forEach(g => {
    doc.addPage(); pageNum++
    pageHeader(doc, g.group, pageNum, g.color)

    // description groupe
    box(doc, M, 32, CW, 14, 4, [12, 12, 12], P.border)
    badge(doc, M + 6, 40, g.badge, g.color)
    rgb(doc, 'text', P.lgrey)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const descLines = doc.splitTextToSize(g.desc, CW - 20)
    doc.text(descLines, M + 6, 41, { baseline: 'top' })

    let cx = M
    let cy = 52
    const cardW = (CW - 6) / 2

    g.pages.forEach((p, i) => {
      if (i % 2 === 0 && i > 0) { cy += 52; cx = M }
      if (i % 2 === 1) cx = M + cardW + 6

      box(doc, cx, cy, cardW, 48, 5, P.card, P.border)

      // accent top
      rgb(doc, 'fill', g.color)
      doc.roundedRect(cx, cy, cardW, 2, 5, 5, 'F')
      doc.rect(cx, cy + 1, cardW, 1, 'F')

      // label
      rgb(doc, 'text', P.white)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(p.label, cx + 6, cy + 11)

      // path
      rgb(doc, 'text', g.color)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text(p.path, cx + 6, cy + 19)

      // séparateur
      rgb(doc, 'draw', P.border)
      doc.setLineWidth(0.2)
      doc.line(cx + 6, cy + 23, cx + cardW - 6, cy + 23)

      // description
      rgb(doc, 'text', P.lgrey)
      doc.setFontSize(7.5)
      const lines = doc.splitTextToSize(p.desc, cardW - 12)
      doc.text(lines.slice(0, 3), cx + 6, cy + 28)
    })
  })

  // footer sur toutes les pages déjà ajoutées au fur et à mesure — OK
  doc.save('Level-Studios_Documentation-site.pdf')
}


// ══════════════════════════════════════════════════════════════════════════════
// PDF 2 — SCHÉMA DE CONNEXION INTER-COMPTES
// ══════════════════════════════════════════════════════════════════════════════
const ACCOUNTS = [
  {
    id: 'client', label: 'Client', color: P.client, x: 30, y: 110,
    features: ['Dashboard', 'Réservations', 'Médiathèque', 'Packs d\'heures', 'SAV / Support', 'Chatbot'],
    desc: 'Accès front-end — vue Classique ou Neo'
  },
  {
    id: 'emp', label: 'Employé', color: P.emp, x: 30, y: 210,
    features: ['Planning personnel', 'Projets assignés', 'Pointage', 'Messagerie', 'Congés', 'Upload rushes'],
    desc: 'Technicien de plateau — accès opérationnel'
  },
  {
    id: 'chef', label: 'Chef de Projet', color: P.chef, x: 145, y: 210,
    features: ['Kanban projets', 'Calendrier global', 'SAV assigné', 'Gestion rushes', 'Perf & KPIs', 'Messagerie'],
    desc: 'Supervision des projets et de l\'équipe'
  },
  {
    id: 'admin', label: 'Admin', color: P.admin, x: 145, y: 110,
    features: ['Tous les modules', 'Impersonation', 'Tarifs & Promos', 'Comptes', 'Communication', 'Statistiques'],
    desc: 'Accès total — gestion de la plateforme'
  },
]

const CONNECTIONS = [
  { from: 'admin',  to: 'client', label: 'Impersonation / Vue client', style: 'solid' },
  { from: 'admin',  to: 'emp',    label: 'Crée & gère les comptes',    style: 'solid' },
  { from: 'admin',  to: 'chef',   label: 'Assigne les projets',         style: 'solid' },
  { from: 'chef',   to: 'emp',    label: 'Supervise les tâches',        style: 'solid' },
  { from: 'chef',   to: 'client', label: 'Accède aux réservations',     style: 'dashed' },
  { from: 'emp',    to: 'chef',   label: 'Upload rushes → projets',     style: 'dashed' },
  { from: 'client', to: 'admin',  label: 'Réservations → SAV → admin', style: 'dashed' },
]

function accountCenter(acc) {
  return { x: acc.x + 32, y: acc.y + 16 }
}

export function generateConnectionSchema() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const acc = P.purple
  let pageNum = 1

  // ── Cover ────────────────────────────────────────────────────────────────
  cover(doc, 'Schéma de\nconnexion', 'Relations inter-comptes — flux de données et interactions', acc)

  // ── Page 2 : Diagramme principal ─────────────────────────────────────────
  doc.addPage(); pageNum++
  pageHeader(doc, 'Cartographie des comptes & interactions', pageNum, acc)

  // Plateforme centrale
  box(doc, 82, 148, 46, 22, 6, [20, 20, 20], P.border)
  rgb(doc, 'fill', acc)
  doc.roundedRect(82, 148, 46, 2, 6, 6, 'F')
  doc.rect(82, 149, 46, 1, 'F')
  rgb(doc, 'text', P.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('PLATFORM', 105, 157, { align: 'center' })
  rgb(doc, 'text', P.lgrey)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.text('Level Studios', 105, 164, { align: 'center' })

  const platCenter = { x: 105, y: 159 }

  // Boxes des comptes
  ACCOUNTS.forEach(a => {
    box(doc, a.x, a.y, 64, 36, 6, P.card, a.color)

    // accent top
    rgb(doc, 'fill', a.color)
    doc.roundedRect(a.x, a.y, 64, 2, 6, 6, 'F')
    doc.rect(a.x, a.y + 1, 64, 1, 'F')

    // label
    rgb(doc, 'text', P.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(a.label, a.x + 32, a.y + 11, { align: 'center' })

    // desc
    rgb(doc, 'text', P.lgrey)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    const dlines = doc.splitTextToSize(a.desc, 54)
    doc.text(dlines, a.x + 5, a.y + 18)

    // features list
    rgb(doc, 'text', a.color)
    doc.setFontSize(5.8)
    a.features.slice(0, 3).forEach((f, i) => doc.text(`▪ ${f}`, a.x + 5, a.y + 27 + i * 4))

    // flèche vers plateforme
    const c = accountCenter(a)
    const dx = platCenter.x - c.x, dy = platCenter.y - c.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const nx = dx / dist, ny = dy / dist
    const gap = 6
    doc.setLineWidth(0.3)
    rgb(doc, 'draw', a.color)
    arrow(doc,
      c.x + nx * gap, c.y + ny * gap,
      platCenter.x - nx * gap, platCenter.y - ny * gap,
      2.5
    )
  })

  // Connexions inter-comptes
  CONNECTIONS.forEach(conn => {
    const fa = ACCOUNTS.find(a => a.id === conn.from)
    const ta = ACCOUNTS.find(a => a.id === conn.to)
    if (!fa || !ta) return
    const fc = accountCenter(fa)
    const tc = accountCenter(ta)

    doc.setLineWidth(0.25)
    rgb(doc, 'draw', P.grey)

    if (conn.style === 'dashed') {
      dashedLine(doc, fc.x, fc.y, tc.x, tc.y)
    } else {
      doc.line(fc.x, fc.y, tc.x, tc.y)
    }

    // label au milieu
    const mx = (fc.x + tc.x) / 2, my = (fc.y + tc.y) / 2
    rgb(doc, 'fill', P.bg)
    const lw = doc.getTextWidth(conn.label) + 4
    doc.rect(mx - lw / 2, my - 4, lw, 5, 'F')
    rgb(doc, 'text', P.lgrey)
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'italic')
    doc.text(conn.label, mx, my, { align: 'center', baseline: 'middle' })
  })

  // Légende
  const lx = M, ly = H - 40
  box(doc, lx, ly, CW, 26, 4, P.card, P.border)
  rgb(doc, 'text', P.lgrey)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('LÉGENDE', lx + 6, ly + 7)

  const items = [
    { label: 'Trait plein → Action directe / accès complet', style: 'solid' },
    { label: 'Trait pointillé → Interaction indirecte / lecture seule', style: 'dashed' },
    { label: 'Flèche → Plateforme : connexion de chaque compte au socle commun', style: 'arrow' },
  ]
  items.forEach((it, i) => {
    const liy = ly + 13 + i * 5.5
    doc.setLineWidth(it.style === 'dashed' ? 0.25 : 0.5)
    rgb(doc, 'draw', P.lgrey)
    if (it.style === 'dashed') {
      dashedLine(doc, lx + 6, liy, lx + 22, liy)
    } else if (it.style === 'arrow') {
      arrow(doc, lx + 6, liy, lx + 22, liy, 2)
    } else {
      doc.line(lx + 6, liy, lx + 22, liy)
    }
    rgb(doc, 'text', P.lgrey)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text(it.label, lx + 26, liy, { baseline: 'middle' })
  })

  // ── Pages 3-6 : Fiche détail par compte ──────────────────────────────────
  ACCOUNTS.forEach(a => {
    doc.addPage(); pageNum++
    pageHeader(doc, `Fiche compte — ${a.label}`, pageNum, a.color)

    // badge
    badge(doc, M, 35, a.label.toUpperCase(), a.color)

    // description
    rgb(doc, 'text', P.lgrey)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.text(a.desc, M, 44)

    // Section : accès directs
    rgb(doc, 'text', P.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Fonctionnalités accessibles', M, 56)
    rgb(doc, 'fill', a.color)
    doc.rect(M, 58, 40, 1, 'F')

    const cols = 2
    const fw = (CW - 6) / cols
    a.features.forEach((f, i) => {
      const col = i % cols, row = Math.floor(i / cols)
      const fx = M + col * (fw + 6)
      const fy = 63 + row * 14

      box(doc, fx, fy, fw, 10, 3, P.card, a.color)
      rgb(doc, 'text', a.color)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('▪', fx + 4, fy + 5.5, { baseline: 'middle' })
      rgb(doc, 'text', P.white)
      doc.setFont('helvetica', 'normal')
      doc.text(f, fx + 10, fy + 5.5, { baseline: 'middle' })
    })

    // Section : connexions avec les autres comptes
    const connY = 63 + Math.ceil(a.features.length / cols) * 14 + 10
    rgb(doc, 'text', P.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Interactions avec les autres comptes', M, connY)
    rgb(doc, 'fill', a.color)
    doc.rect(M, connY + 2, 55, 1, 'F')

    const myConns = CONNECTIONS.filter(c => c.from === a.id || c.to === a.id)
    myConns.forEach((c, i) => {
      const other = ACCOUNTS.find(ac => ac.id === (c.from === a.id ? c.to : c.from))
      if (!other) return
      const cy = connY + 8 + i * 12
      box(doc, M, cy, CW, 10, 3, P.card, P.border)

      // indicateur direction
      rgb(doc, 'fill', c.from === a.id ? a.color : other.color)
      doc.roundedRect(M, cy, 4, 10, 2, 2, 'F')

      // compte cible
      rgb(doc, 'text', other.color)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text(other.label, M + 8, cy + 5.5, { baseline: 'middle' })

      // flèche direction
      doc.setFont('helvetica', 'normal')
      rgb(doc, 'text', P.lgrey)
      doc.setFontSize(8)
      const dir = c.from === a.id ? '→' : '←'
      doc.text(dir, M + 36, cy + 5.5, { baseline: 'middle' })

      // label
      doc.setFontSize(7)
      doc.text(c.label, M + 44, cy + 5.5, { baseline: 'middle' })
    })
  })

  doc.save('Level-Studios_Schema-connexion.pdf')
}


// ══════════════════════════════════════════════════════════════════════════════
// PDF 3 — GUIDE VISUEL AVEC ANNOTATIONS
// ══════════════════════════════════════════════════════════════════════════════
const ANNOTATED = [
  {
    label: 'Dashboard Client (Vue Neo)', color: P.client,
    type: 'neo',
    annotations: [
      { n: 1, zone: 'navbar',   label: 'Barre de navigation',   desc: 'Logo, liens (Accueil, Réservations, Médiathèque), cloche notifications, profil utilisateur + chatbot' },
      { n: 2, zone: 'hero',     label: 'Carrousel hero',        desc: 'Diaporama des 3 studios (A, B, C) avec overlay sombre, texte de bienvenue, dots et flèches de navigation' },
      { n: 3, zone: 'stats',    label: 'Statistiques',          desc: 'CA dépensé, sessions du mois, studio favori, total heures réservées' },
      { n: 4, zone: 'lastresa', label: 'Dernière réservation',  desc: 'Photo du studio, statut coloré, date/heure, bouton Réserver à nouveau (réutilise les mêmes paramètres)' },
      { n: 5, zone: 'pack',     label: 'Pack d\'heures',        desc: 'Heures restantes avec barre de progression, bouton d\'achat rapide de nouveau pack' },
      { n: 6, zone: 'history',  label: 'Historique',            desc: 'Tableau des réservations avec recherche, pagination 8/page, boutons Payer / Annuler selon statut' },
      { n: 7, zone: 'chatbot',  label: 'Chatbot flottant',      desc: 'Assistant IA disponible sur toutes les pages client — répond aux questions sur les offres et réservations' },
    ]
  },
  {
    label: 'Compte Client — Vue Classique', color: P.client,
    type: 'classic',
    annotations: [
      { n: 1, zone: 'sidebar',  label: 'Sidebar navigation',    desc: 'Accueil, Réservations, Médiathèque, Packs d\'heures, Mon compte, Support — même design que l\'interface admin' },
      { n: 2, zone: 'logo',     label: 'Logo + badge Client',   desc: 'Logo Level Studios 56px, badge Client en cyan, bouton de thème clair/sombre' },
      { n: 3, zone: 'accent',   label: 'Ligne accent dégradée', desc: 'Dégradé rose → violet → cyan — identique au layout admin' },
      { n: 4, zone: 'header',   label: 'Header sticky',         desc: 'Titre de la page actuelle, bouton Communication (cloche) si messages actifs' },
      { n: 5, zone: 'ticker',   label: 'Ticker communications', desc: 'Défilement droite → gauche des communications actives créées par l\'admin' },
      { n: 6, zone: 'usercard', label: 'Carte utilisateur',     desc: 'Avatar dégradé, nom, email, toggle langue FR/EN, bouton déconnexion' },
    ]
  },
  {
    label: 'Admin — Dashboard', color: P.admin,
    type: 'admin',
    annotations: [
      { n: 1, zone: 'sidebar',  label: 'Sidebar admin (256px)', desc: 'Navigation complète : 15+ modules, badge rôle Admin, toggle thème, user card avec chat trigger' },
      { n: 2, zone: 'header',   label: 'Header avec alertes',   desc: 'Badges colorés en temps réel : Retard (jaune), Retour (bleu), Urgent (rouge) — cliquables vers /admin/alerts' },
      { n: 3, zone: 'kpi',      label: 'KPIs du jour',          desc: 'CA du mois, réservations actives, taux d\'occupation, satisfaction moyenne' },
      { n: 4, zone: 'calendar', label: 'Planning semaine',       desc: 'Vue compacte des sessions de la semaine par studio — cliquable vers le calendrier complet' },
      { n: 5, zone: 'resa',     label: 'Dernières réservations', desc: 'Liste des réservations récentes avec statut, client, studio, montant — accès rapide validation' },
      { n: 6, zone: 'sav',      label: 'SAV en attente',         desc: 'Tickets SAV non traités avec priorité, client, délai — indicateur rouge si urgent' },
    ]
  },
  {
    label: 'Admin — Gestion des comptes', color: P.admin,
    type: 'admin',
    annotations: [
      { n: 1, zone: 'tabs',     label: 'Onglets Clients / Employés / Corbeille', desc: 'Filtrage par type de compte, compteur par onglet, recherche globale' },
      { n: 2, zone: 'search',   label: 'Recherche + filtres',   desc: 'Recherche par nom, email, ID — filtre type client (particulier / professionnel)' },
      { n: 3, zone: 'table',    label: 'Tableau des comptes',   desc: 'Nom, email, type, ID — trié par création' },
      { n: 4, zone: 'eye',      label: 'Icône œil (visualiser)', desc: 'Impersonation : ouvre le compte en mode Classique, bandeau jaune avec bouton Vue Neo' },
      { n: 5, zone: 'suspend',  label: 'Suspension / Réactivation', desc: 'Bascule le compte entre actif et suspendu — le client ne peut plus se connecter' },
      { n: 6, zone: 'trash',    label: 'Corbeille',             desc: 'Mise à la corbeille (non définitive) — restauration ou suppression définitive possible' },
      { n: 7, zone: 'create',   label: 'Créer un compte',       desc: 'Formulaire de création : nom, email, type, mot de passe temporaire — email de bienvenue automatique' },
    ]
  },
  {
    label: 'Bandeau impersonation & Vue Neo', color: P.purple,
    type: 'banner',
    annotations: [
      { n: 1, zone: 'banner',   label: 'Bandeau jaune (36px fixe)', desc: 'Apparaît sur toutes les pages quand l\'admin visualise un compte client' },
      { n: 2, zone: 'who',      label: 'Identité affichée',       desc: '"Vue en tant que [Nom client] — [Nom admin]" pour rappeler le contexte d\'impersonation' },
      { n: 3, zone: 'neo',      label: 'Bouton Vue Neo',           desc: 'Depuis la vue Classique : navigue vers /clienttest/dashboard (style cinématographique sombre)' },
      { n: 4, zone: 'classic',  label: 'Bouton Vue Classique',     desc: 'Depuis la vue Neo : revient vers /client/dashboard (style identique au layout admin)' },
      { n: 5, zone: 'back',     label: 'Retour Admin',             desc: 'Stoppe l\'impersonation, restaure la session admin, redirige vers /admin/accounts' },
    ]
  },
  {
    label: 'Admin — Communication & Popups', color: P.admin,
    type: 'admin',
    annotations: [
      { n: 1, zone: 'create',   label: 'Créer un message popup', desc: 'Titre, message, type (info/warning/success/error), cible, durée en jours' },
      { n: 2, zone: 'target',   label: 'Ciblage',                desc: 'Tous, tous les clients, tous les employés, ou un client/employé individuel par email' },
      { n: 3, zone: 'duration', label: 'Durée de diffusion',     desc: 'Le message apparaît pendant N jours — expiré automatiquement, badge rouge "Expiré"' },
      { n: 4, zone: 'bubble',   label: 'Bulle client (Megaphone)', desc: 'Bouton pulsant dans le header client quand des communications actives existent' },
      { n: 5, zone: 'ticker',   label: 'Ticker défilant',        desc: 'Clic sur la bulle → bande dorée défilant de droite à gauche sous le header avec tous les messages actifs' },
    ]
  },
  {
    label: 'Tunnel de réservation', color: P.pub,
    type: 'public',
    annotations: [
      { n: 1, zone: 'step1',    label: 'Étape 1 — Studio',        desc: 'Choix du studio parmi A, B ou C — photos, capacité, équipement' },
      { n: 2, zone: 'step2',    label: 'Étape 2 — Formule',       desc: 'Bronze (149 CAD/h), Argent (199 CAD/h), Or (499 CAD/h) avec détail des inclusions' },
      { n: 3, zone: 'step3',    label: 'Étape 3 — Date & horaire', desc: 'Calendrier interactif, sélection créneau, durée en heures' },
      { n: 4, zone: 'step4',    label: 'Étape 4 — Options',        desc: 'Photo, Short vidéo, Miniature, Live stream, Community Manager, Coaching' },
      { n: 5, zone: 'step5',    label: 'Étape 5 — Récapitulatif', desc: 'Détail complet, prix total, codes promo, validation et envoi email de confirmation' },
    ]
  },
  {
    label: 'Employé — Dashboard & Pointage', color: P.emp,
    type: 'admin',
    annotations: [
      { n: 1, zone: 'planning', label: 'Planning de la semaine',  desc: 'Sessions assignées avec studio, horaire, client — code couleur par statut' },
      { n: 2, zone: 'checkin',  label: 'Pointage entrée/sortie', desc: 'Un bouton unique pour enregistrer l\'arrivée ou le départ — horodatage automatique' },
      { n: 3, zone: 'projects', label: 'Projets en cours',        desc: 'Liste des projets assignés avec progression, notes de production, upload de fichiers' },
      { n: 4, zone: 'alerts',   label: 'Alertes non lues',        desc: 'Notifications de retard, retour client, messages urgents du chef de projet' },
      { n: 5, zone: 'leave',    label: 'Congés',                  desc: 'Formulaire de demande, solde restant, statut des demandes en attente de validation' },
    ]
  },
]

// Dessine le wireframe correspondant au type de page
function drawWireframe(doc, type, x, y, w, h) {
  const lineW = 0.25

  if (type === 'neo') {
    // Navbar
    rgb(doc, 'fill', [25, 25, 25])
    doc.rect(x, y, w, h * 0.12, 'F')
    rgb(doc, 'fill', [40, 40, 40])
    doc.rect(x, y + h * 0.12, w, h * 0.33, 'F')  // hero
    rgb(doc, 'fill', [18, 18, 18])
    doc.rect(x, y + h * 0.45, w, h * 0.55, 'F')  // content

    // Détails navbar
    rgb(doc, 'fill', [60, 60, 60])
    doc.rect(x + 4, y + h * 0.04, 12, 4, 'F')   // logo
    doc.rect(x + 20, y + h * 0.04, 8, 3, 'F')   // nav item
    doc.rect(x + 30, y + h * 0.04, 8, 3, 'F')
    doc.rect(x + w - 10, y + h * 0.04, 6, 6, 'F') // avatar

    // Hero text mockup
    rgb(doc, 'fill', [70, 70, 70])
    doc.rect(x + 4, y + h * 0.35, 30, 4, 'F')
    doc.rect(x + 4, y + h * 0.40, 20, 2.5, 'F')

    // Content cards
    const cardH = h * 0.12
    const cardW = (w - 10) / 3
    ;[0, 1, 2].forEach(i => {
      rgb(doc, 'fill', [28, 28, 28])
      doc.roundedRect(x + 3 + i * (cardW + 2), y + h * 0.48, cardW, cardH, 2, 2, 'F')
    })
    rgb(doc, 'fill', [28, 28, 28])
    doc.roundedRect(x + 3, y + h * 0.66, w - 6, h * 0.28, 2, 2, 'F')

    // Chatbot bubble
    rgb(doc, 'fill', P.purple)
    doc.circle(x + w - 8, y + h - 6, 5, 'F')

  } else if (type === 'classic' || type === 'admin') {
    const sideW = w * 0.30
    // Sidebar
    rgb(doc, 'fill', [8, 8, 8])
    doc.rect(x, y, sideW, h, 'F')
    // Logo zone
    rgb(doc, 'fill', [6, 6, 6])
    doc.rect(x, y, sideW, h * 0.14, 'F')
    // Logo mockup
    rgb(doc, 'fill', [40, 40, 40])
    doc.rect(x + 3, y + 3, 10, 10, 'F')
    rgb(doc, 'fill', [30, 30, 30])
    doc.rect(x + 15, y + 4, 14, 3, 'F')
    doc.rect(x + 15, y + 9, 10, 2, 'F')
    // Accent line
    rgb(doc, 'fill', P.cyan)
    doc.rect(x, y + h * 0.14, sideW, 1, 'F')
    // Nav items
    ;[0, 1, 2, 3, 4, 5].forEach(i => {
      const ny = y + h * 0.18 + i * (h * 0.10)
      if (i === 0) { rgb(doc, 'fill', P.cyan); doc.roundedRect(x + 3, ny, sideW - 6, h * 0.08, 2, 2, 'F') }
      else { rgb(doc, 'fill', [20, 20, 20]); doc.roundedRect(x + 3, ny, sideW - 6, h * 0.08, 2, 2, 'F') }
      rgb(doc, 'fill', i === 0 ? [6, 6, 6] : [50, 50, 50])
      doc.rect(x + 7, ny + h * 0.025, 6, 2.5, 'F')
      doc.rect(x + 15, ny + h * 0.025, 14, 2.5, 'F')
    })
    // User card bottom
    rgb(doc, 'fill', [6, 6, 6])
    doc.rect(x, y + h * 0.86, sideW, h * 0.14, 'F')
    rgb(doc, 'fill', [25, 25, 25])
    doc.roundedRect(x + 3, y + h * 0.88, sideW - 6, h * 0.09, 2, 2, 'F')
    // Header
    rgb(doc, 'fill', [10, 10, 10])
    doc.rect(x + sideW, y, w - sideW, h * 0.12, 'F')
    // Content
    rgb(doc, 'fill', [6, 6, 6])
    doc.rect(x + sideW, y + h * 0.12, w - sideW, h * 0.88, 'F')
    // Cards in content
    const cw2 = (w - sideW - 8) / 4
    ;[0, 1, 2, 3].forEach(i => {
      rgb(doc, 'fill', [17, 17, 17])
      doc.roundedRect(x + sideW + 3 + i * (cw2 + 1.5), y + h * 0.15, cw2, h * 0.14, 2, 2, 'F')
    })
    rgb(doc, 'fill', [17, 17, 17])
    doc.roundedRect(x + sideW + 3, y + h * 0.32, (w - sideW - 8) * 0.45, h * 0.20, 2, 2, 'F')
    doc.roundedRect(x + sideW + 3 + (w - sideW - 8) * 0.47, y + h * 0.32, (w - sideW - 8) * 0.53 - 2, h * 0.20, 2, 2, 'F')
    doc.roundedRect(x + sideW + 3, y + h * 0.55, w - sideW - 8, h * 0.39, 2, 2, 'F')

  } else if (type === 'public') {
    // Topbar
    rgb(doc, 'fill', [6, 6, 6])
    doc.rect(x, y, w, h * 0.10, 'F')
    // Hero
    rgb(doc, 'fill', [20, 20, 20])
    doc.rect(x, y + h * 0.10, w, h * 0.30, 'F')
    // Steps
    const sw = (w - 8) / 5
    ;[0, 1, 2, 3, 4].forEach(i => {
      rgb(doc, 'fill', i === 0 ? P.pub : [20, 20, 20])
      doc.roundedRect(x + 3 + i * (sw + 1), y + h * 0.43, sw, h * 0.14, 2, 2, 'F')
    })
    // Summary
    rgb(doc, 'fill', [17, 17, 17])
    doc.roundedRect(x + 3, y + h * 0.60, w - 6, h * 0.35, 2, 2, 'F')

  } else if (type === 'banner') {
    // Bandeau jaune
    rgb(doc, 'fill', [30, 20, 0])
    doc.rect(x, y, w, h * 0.10, 'F')
    rgb(doc, 'draw', P.admin)
    doc.setLineWidth(0.3)
    doc.rect(x, y, w, h * 0.10, 'D')
    // Texte mockup dans bandeau
    rgb(doc, 'fill', P.admin)
    doc.rect(x + 4, y + h * 0.04, 25, 2, 'F')
    rgb(doc, 'fill', [60, 40, 0])
    doc.roundedRect(x + w - 28, y + h * 0.025, 12, h * 0.05, 1, 1, 'F')
    doc.roundedRect(x + w - 14, y + h * 0.025, 10, h * 0.05, 1, 1, 'F')
    // Contenu dessous (vue classique)
    rgb(doc, 'fill', [8, 8, 8])
    doc.rect(x, y + h * 0.10, w * 0.30, h * 0.90, 'F')
    rgb(doc, 'fill', [6, 6, 6])
    doc.rect(x + w * 0.30, y + h * 0.10, w * 0.70, h * 0.90, 'F')
    // Sidebar mini
    ;[0, 1, 2, 3].forEach(i => {
      rgb(doc, 'fill', i === 0 ? P.cyan : [20, 20, 20])
      doc.roundedRect(x + 3, y + h * 0.15 + i * h * 0.12, w * 0.25, h * 0.09, 2, 2, 'F')
    })
  }

  // Bordure générale
  rgb(doc, 'draw', P.border)
  doc.setLineWidth(lineW)
  doc.rect(x, y, w, h, 'D')
}

// Position des zones de chaque type pour placer les dots
function getZonePos(zone, type, fx, fy, fw, fh) {
  const sideW = fw * 0.30
  const positions = {
    neo: {
      navbar:   { x: fx + fw * 0.5,  y: fy + fh * 0.06 },
      hero:     { x: fx + fw * 0.5,  y: fy + fh * 0.28 },
      stats:    { x: fx + fw * 0.25, y: fy + fh * 0.52 },
      lastresa: { x: fx + fw * 0.75, y: fy + fh * 0.52 },
      pack:     { x: fx + fw * 0.25, y: fy + fh * 0.68 },
      history:  { x: fx + fw * 0.5,  y: fy + fh * 0.82 },
      chatbot:  { x: fx + fw - 8,    y: fy + fh - 6 },
    },
    classic: {
      sidebar:  { x: fx + sideW * 0.5, y: fy + fh * 0.50 },
      logo:     { x: fx + sideW * 0.5, y: fy + fh * 0.07 },
      accent:   { x: fx + sideW * 0.5, y: fy + fh * 0.14 },
      header:   { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.06 },
      ticker:   { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.13 },
      usercard: { x: fx + sideW * 0.5, y: fy + fh * 0.92 },
    },
    admin: {
      sidebar:  { x: fx + sideW * 0.5, y: fy + fh * 0.50 },
      header:   { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.06 },
      kpi:      { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.22 },
      calendar: { x: fx + sideW + (fw - sideW) * 0.3, y: fy + fh * 0.42 },
      resa:     { x: fx + sideW + (fw - sideW) * 0.7, y: fy + fh * 0.42 },
      sav:      { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.74 },
      tabs:     { x: fx + sideW + (fw - sideW) * 0.3, y: fy + fh * 0.16 },
      search:   { x: fx + sideW + (fw - sideW) * 0.8, y: fy + fh * 0.16 },
      table:    { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.45 },
      eye:      { x: fx + sideW + (fw - sideW) * 0.88, y: fy + fh * 0.35 },
      suspend:  { x: fx + sideW + (fw - sideW) * 0.88, y: fy + fh * 0.50 },
      trash:    { x: fx + sideW + (fw - sideW) * 0.88, y: fy + fh * 0.65 },
      create:   { x: fx + sideW + (fw - sideW) * 0.85, y: fy + fh * 0.06 },
      planning: { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.22 },
      checkin:  { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.40 },
      projects: { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.55 },
      alerts:   { x: fx + sideW + (fw - sideW) * 0.85, y: fy + fh * 0.06 },
      leave:    { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.74 },
      create_comm: { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.22 },
      target:   { x: fx + sideW + (fw - sideW) * 0.7, y: fy + fh * 0.40 },
      duration: { x: fx + sideW + (fw - sideW) * 0.3, y: fy + fh * 0.40 },
      bubble:   { x: fx + sideW + (fw - sideW) * 0.85, y: fy + fh * 0.06 },
      ticker:   { x: fx + sideW + (fw - sideW) * 0.5, y: fy + fh * 0.14 },
    },
    banner: {
      banner:  { x: fx + fw * 0.5, y: fy + fh * 0.05 },
      who:     { x: fx + fw * 0.25, y: fy + fh * 0.05 },
      neo:     { x: fx + fw * 0.75, y: fy + fh * 0.05 },
      classic: { x: fx + fw * 0.80, y: fy + fh * 0.05 },
      back:    { x: fx + fw * 0.92, y: fy + fh * 0.05 },
    },
    public: {
      step1:   { x: fx + fw * 0.13, y: fy + fh * 0.50 },
      step2:   { x: fx + fw * 0.30, y: fy + fh * 0.50 },
      step3:   { x: fx + fw * 0.47, y: fy + fh * 0.50 },
      step4:   { x: fx + fw * 0.64, y: fy + fh * 0.50 },
      step5:   { x: fx + fw * 0.81, y: fy + fh * 0.50 },
    },
  }
  return positions[type]?.[zone] || { x: fx + fw * 0.5, y: fy + fh * 0.5 }
}

export function generateAnnotatedGuide() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const acc = P.pink
  let pageNum = 1

  // ── Cover ──────────────────────────────────────────────────────────────────
  cover(doc, 'Guide visuel\ndes fonctionnalités', 'Chaque page annotée avec ses fonctionnalités clés', acc)

  // ── Une page PDF par page annotée ─────────────────────────────────────────
  ANNOTATED.forEach(pg => {
    doc.addPage(); pageNum++
    pageHeader(doc, pg.label, pageNum, pg.color)

    // Badge type
    badge(doc, M, 35, pg.type.toUpperCase(), pg.color)

    // Wireframe zone
    const wireY = 42
    const wireH = 130
    const wireW = CW * 0.62
    drawWireframe(doc, pg.type, M, wireY, wireW, wireH)

    // Légende à droite du wireframe
    const legX = M + wireW + 5
    const legW = CW - wireW - 5

    pg.annotations.forEach((an, i) => {
      const zp = getZonePos(an.zone, pg.type, M, wireY, wireW, wireH)
      const dotColor = pg.color

      // Dot sur le wireframe
      dot(doc, zp.x, zp.y, an.n, dotColor)

      // Entrée dans la légende
      const ley = wireY + i * 20
      if (ley + 18 < wireY + wireH + 20) {
        box(doc, legX, ley, legW, 18, 3, P.card, P.border)

        // Numéro
        rgb(doc, 'fill', dotColor)
        doc.circle(legX + 6, ley + 9, 4, 'F')
        rgb(doc, 'text', P.bg)
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'bold')
        doc.text(String(an.n), legX + 6, ley + 9, { align: 'center', baseline: 'middle' })

        // Label
        rgb(doc, 'text', P.white)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.text(an.label, legX + 12, ley + 6)

        // Description
        rgb(doc, 'text', P.lgrey)
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(an.desc, legW - 14)
        doc.text(lines.slice(0, 2), legX + 12, ley + 11)

        // Ligne de liaison (dot → légende) dashed
        doc.setLineWidth(0.18)
        rgb(doc, 'draw', [35, 35, 35])
        dashedLine(doc, zp.x, zp.y, legX, ley + 9, 1.5, 1.5)
      }
    })

    // Note bas de page
    rgb(doc, 'text', P.grey)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.text(`Les numéros correspondent aux zones annotées sur le wireframe ci-contre.`, M, H - 12)
  })

  doc.save('Level-Studios_Guide-fonctionnalites.pdf')
}
