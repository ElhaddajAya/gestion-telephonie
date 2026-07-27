# Changements récents

Résumé des dernières fonctionnalités ajoutées, pour garder une trace de ce qui a été fait et pourquoi.

## 1. Formulaire de déclaration d'incident (espace agence)

Dernière page manquante du plan de l'espace agence (accueil → liste → détail → déclaration).

- **`frontend/src/pages/AgenceDeclarer.jsx`** (`/agence/:code/declarer`) : titre, type (Interne/Externe), priorité (Normale/Haute/Urgente), description — mêmes tailles/couleurs que le reste de l'espace agence.
- Utilise la route existante `POST /api/incidents` (aucun changement backend nécessaire).
- Une fois le ticket créé, redirection directe vers sa page de détail (`/agence/:code/tickets/:id`) pour que l'agence suive tout de suite son évolution.

## 2. Notifications in-app (point rouge), des deux côtés

Voir `docs/notifications-messages.md` pour le détail technique complet. Résumé :

| Côté | Où | Condition d'affichage |
|---|---|---|
| **Agence** | Liste "Mes tickets" + accueil (tickets récents) | `derniere_maj` (dernier message admin ou assignation) plus récente que `derniere_lecture_agence` (dernière visite de l'agence) |
| **Admin** | Liste "Mes tickets" | Un message d'agence plus récent que `derniere_lecture` (même condition que la cloche, calculée ticket par ticket) |

- **2 nouvelles colonnes** sur `incident` : `derniere_maj`, `derniere_lecture_agence` (voir SQL dans `docs/notifications-messages.md`).
- **Nouvelle route** : `PUT /api/espace-agence/:code/tickets/:id/lu` (marque un ticket comme vu par l'agence).
- Les trois listes concernées (`AgenceTickets.jsx`, `AgenceAccueil.jsx`, `MesTickets.jsx`) se rafraîchissent maintenant automatiquement toutes les 15s, en silence (pas de clignotement de l'écran de chargement, pas de retour forcé à la page 1).
- **Choix volontaire** : pas d'email envoyé à chaque message, pour ne pas solliciter le SMTP à chaque échange du fil de discussion — l'email (une fois débloqué) sera réservé aux événements marquants (assignation), les messages restant couverts uniquement par ce point rouge, sans coût d'envoi.
- **Le point n'apparaît que sur "Mes tickets"**, pas sur "Tous les tickets" côté admin : sur "Tous les tickets", certaines lignes appartiennent à d'autres admins, donc un point basé sur leur lecture à eux serait trompeur pour la personne qui regarde l'écran.

## 3. Fil de discussion admin : "Vous" au lieu du nom

Dans `IncidentDetail.jsx`, un message écrit par l'admin actuellement connecté affiche désormais **"Vous"** au lieu de son propre nom. Les messages des **autres** admins restent affichés avec leur nom complet ("Admin — Prénom Nom") — utile si le ticket a été réassigné et qu'un ancien message reste visible dans l'historique.

## 4. Distinction admin / superadmin + page "Mon profil"

Préparation avant de construire la gestion complète des comptes admin (Epic 5) par le superadmin.

- **Badge "Superadmin"** dans l'en-tête (`Layout.jsx`) quand `user.role === 'superadmin'`.
- **Lien "Comptes admin"** dans la sidebar, visible uniquement pour les superadmins, vers une nouvelle page `ComptesAdmin.jsx` : liste en lecture seule (nom, matricule, rôle), réutilise la route déjà existante `GET /api/utilisateurs`. La création/suppression de comptes viendra avec l'Epic 5.
- **Protection de la route** : `/comptes-admin` redirige vers `/` si l'utilisateur connecté n'est pas superadmin (vérifié côté frontend dans `App.jsx` — la route `GET /api/utilisateurs` elle-même reste accessible à tous les admins, car elle sert aussi à la réassignation de tickets).
- **Page "Mon profil"** (`/profil`, accessible à tout admin connecté) :
  - Lecture : matricule et rôle (non modifiables).
  - Modification : nom, prénom, email (`PUT /api/auth/profil`).
  - Changement de mot de passe volontaire (réutilise `PUT /api/auth/change-password`, déjà existant pour le changement forcé à la première connexion).
  - Photo de profil : upload via `POST /api/auth/photo` (multer, stockage sur disque dans `backend/uploads/avatars/`, limité à 2 Mo, formats JPEG/PNG/WEBP uniquement). L'ancienne photo est supprimée automatiquement au remplacement. Le dossier `backend/uploads/` est ignoré par git (fichiers uploadés, pas du code).
  - Après modification, `App.jsx` met à jour le `user` en mémoire et dans `localStorage` (`onUserUpdate`), pour que l'en-tête reflète immédiatement le changement sans reconnexion.

### SQL à exécuter (phpMyAdmin)

```sql
ALTER TABLE utilisateur
ADD COLUMN photo VARCHAR(255) NULL;
```

## Reste à confirmer / faire

- Exécuter en base (phpMyAdmin) les `ALTER TABLE` pour `derniere_maj` / `derniere_lecture_agence` (voir `docs/notifications-messages.md`) et pour `photo` (ci-dessus), sans quoi l'assignation, les notifications et l'upload de photo échouent.
- Deux anciens changements SQL toujours en attente : `DROP COLUMN statut_installation` sur `agence`, et `DROP FOREIGN KEY` + `DROP COLUMN code_agence` sur `utilisateur`.
- Notifications par email réelles : bloquées en attendant les identifiants SMTP (Mme Fatima Zahra / M. Sebbar).
- Gestion complète des comptes admin par le superadmin (créer/supprimer un compte, Epic 5) : la liste en lecture seule existe (`ComptesAdmin.jsx`), le CRUD reste à construire.
