# TeleTrack

Application de gestion des incidents téléphonie pour le réseau d'agences de la **Banque Populaire Rabat-Kénitra** (216 agences, 14 succursales).

Développée dans le cadre d'un stage au Département Informatique (juillet–août 2026).

## Le projet en une phrase

Une agence déclare un incident téléphonique (ligne coupée, standard inaccessible...) via un lien dédié sans authentification ; un admin du siège le suit, le traite et communique avec l'agence via un fil de discussion, depuis un tableau de bord centralisé.

## Stack technique

|                      |                                                                   |
| -------------------- | ----------------------------------------------------------------- |
| **Frontend**         | React (Vite), react-router-dom, axios, recharts, react-icons      |
| **Backend**          | Node.js / Express                                                 |
| **Base de données**  | MySQL                                                             |
| **Authentification** | JWT (admin/superadmin uniquement) + mots de passe hachés (bcrypt) |
| **Autres**           | ExcelJS + xlsx + multer (import/export Excel des agences)         |

## Rôles

- **Agence** — pas de compte : accède à son formulaire de déclaration via un lien unique (`teletrack.bcp.ma/agence/<code_agence>`), sans mot de passe. Justifié par l'absence de données confidentielles et un accès réseau strictement interne.
- **Admin** — connexion par matricule/mot de passe, traite les incidents, dispose d'un tableau de bord.
- **Superadmin** — en plus des droits admin, gère les comptes admin.

## Structure du projet

```text
gestion-telephonie/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # login, changement de mot de passe, profil (infos + photo)
│   │   ├── incidents.js     # CRUD incidents, commentaires, stats, notifications
│   │   ├── agences.js       # liste, détail, modification, import/export/modèle Excel
│   │   ├── utilisateurs.js  # liste des admins (réassignation, page "Comptes admin")
│   │   └── espaceAgence.js  # espace agence PUBLIC (infos, stats, tickets, détail — pas de token)
│   ├── middleware/auth.js   # verification du token JWT
│   ├── services/mailer.js   # envoi d'email (no-op tant que le SMTP n'est pas configuré)
│   ├── uploads/avatars/     # photos de profil uploadées (ignoré par git)
│   ├── db.js                # pool de connexion MySQL
│   └── server.js
└── frontend/
    └── src/
        ├── pages/           # Login, ChangePassword, Dashboard, Incidents,
        │                    # MesTickets, IncidentDetail, Agences, Profil, ComptesAdmin,
        │                    # AgenceAccueil, AgenceTickets, AgenceTicketDetail,
        │                    # AgenceDeclarer
        ├── components/      # Layout (sidebar + header), Badge, Pagination,
        │                    # ModalReassigner, ModalModifierAgence
        └── services/        # api.js (admin, avec token) ; apiPublic.js (espace agence, sans token)
```

## Fonctionnalités principales

- **Espace agence** (`/agence/:code`, public, sans compte) : page d'accueil (identité, aperçu chiffré, tickets récents), liste complète "Mes tickets" avec filtres (état, type, priorité) et tri par date de déclaration, détail d'un ticket avec fil de discussion (l'agence peut répondre), et formulaire de déclaration (`/agence/:code/declarer`) — le tout scopé à sa propre agence. L'agence peut aussi marquer un ticket comme résolu ou le rouvrir (le passage à "en cours" reste réservé à l'admin).
- **Déclaration d'incident** par l'agence (titre, type interne/externe, priorité, description) — redirige vers la page de suivi du ticket une fois créé.
- **Tableau de bord** : statistiques (tickets ouverts, en cours, urgents, résolus), répartition par type/succursale, temps moyen de résolution.
- **Liste des tickets** (tous / "Mes tickets") avec recherche, filtres (état, type, priorité, date) et tri.
- **Détail d'un ticket** : fil de discussion en bulles de chat (admin ↔ agence), rafraîchi automatiquement, informations agence modifiables, changement d'état, assignation/réassignation.
- **Notifications** : cloche avec badge pour les nouveaux tickets et les nouvelles réponses sur les tickets assignés à l'admin connecté (statut lu/non-lu suivi en base, pas de compte requis pour l'agence). Un point rouge signale aussi les tickets avec du nouveau, ligne par ligne : sur "Mes tickets" côté admin, et sur la liste/l'accueil côté agence (réponse d'admin ou assignation depuis sa dernière visite) — sans email pour l'instant (voir `docs/notifications-messages.md`).
- **Gestion des agences** : liste, export Excel, import/mise à jour en masse via fichier Excel.
- **Mon profil** (`/profil`) : consultation et modification de son nom/prénom/email, changement de mot de passe, upload d'une photo de profil (JPEG/PNG/WEBP, 2 Mo max).
- **Distinction admin / superadmin** : badge "Superadmin" affiché dans l'en-tête et lien "Comptes admin" visible uniquement pour les superadmins (liste en lecture seule pour l'instant — la gestion complète des comptes, Epic 5, reste à construire).

## Installation

### Prérequis

- Node.js
- MySQL (ou MariaDB / WAMP)

### Base de données

Importer le dump SQL le plus récent dans une base `gestion_telephonie` (via phpMyAdmin ou `mysql < fichier.sql`).

### Backend

```bash
cd backend
npm install
cp .env.example .env   # renseigner DB_PASSWORD, JWT_SECRET, etc.
npm run dev
```

Démarre sur `http://localhost:5000` (configurable via `PORT`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Démarre sur `http://localhost:5173`.

### Variables d'environnement (`backend/.env`)

| Variable                                                        | Rôle                                                                                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                                                          | Port du serveur Express                                                                                                     |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`                  | Connexion MySQL                                                                                                             |
| `JWT_SECRET`                                                    | Clé de signature des tokens JWT                                                                                             |
| `FRONTEND_URL`                                                  | Origine autorisée par CORS (URL du frontend)                                                                                |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Notifications par email — optionnel, laissé vide tant que l'accès SMTP n'est pas fourni (voir`docs/changements-recents.md`) |

## Développeuse

**Aya EL HADDAJ** — étudiante en 4ème année ingénieur informatique, spécialité Développement Digital et Systèmes d'Information à l'Ecole Marocaine des Sciences de l'Ingénieur (EMSI Rabat)

- Email : [ayaelhaddaj619@gmail.com](mailto:ayaelhaddaj619@gmail.com)
- LinkedIn : [www.linkedin.com/in/aya-el-haddaj-308378395](https://www.linkedin.com/in/aya-el-haddaj-308378395)
