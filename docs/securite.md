# Sécurité de l'application TeleTrack

Résumé de tous les aspects de sécurité mis en place dans le code, et de ce qui reste à faire.

## 1. Authentification (qui es-tu ?)

- **Mots de passe** : jamais stockés en clair — hachés avec `bcrypt` (10 rounds) à la création/changement de mot de passe.
- **Connexion** (`POST /api/auth/login`) : compare le mot de passe envoyé avec le hash stocké via `bcrypt.compare()`, jamais de comparaison directe de texte.
- **Token JWT** : signé avec `JWT_SECRET` (dans `.env`, jamais commité — vérifié dans `.gitignore`), expire après **8h**.
- Le mot de passe n'est **jamais renvoyé** au frontend, même dans la réponse de login — on reconstruit un objet `user` propre sans le champ `mot_de_passe`.

## 2. Protection des routes (qui a le droit d'entrer ?)

`backend/middleware/auth.js` (`verifyToken`) vérifie le token JWT sur chaque requête et rejette avec `401` si absent, invalide ou expiré.

| Route | Protégée ? | Pourquoi |
|---|---|---|
| `POST /api/incidents` | ❌ Publique | Formulaire de déclaration d'une agence — pas de compte agence (volontaire, voir CDC) |
| `POST /api/incidents/:id/commentaires` | ⚠️ Mixte | Accepte un token (admin) OU pas de token + `code_agence` (agence) — voir section 3 |
| Toutes les autres routes (`stats`, listes, détail, `/etat`, `/assigner`, `/lu`, `agences/*`, `utilisateurs/*`, `change-password`) | ✅ Protégée | `verifyToken` obligatoire |

## 3. Autorisation fine (as-tu le droit sur CETTE ressource précise ?)

Être connecté ne suffit pas toujours — certaines actions sont limitées à la bonne personne :

- Une agence **ne peut commenter que son propre incident** (vérifie `code_agence === incident.code_agence`, sinon `403`).
- Un admin **ne peut commenter que s'il est l'admin assigné** au ticket (`traite_par === decoded.id`, sinon `403`) — il doit d'abord se l'assigner.
- `PUT /:id/lu` (marquer comme lu) ne met à jour que si l'appelant est bien `traite_par` de ce ticket.
- `PUT /:id/assigner` réinitialise `derniere_lecture` à chaque réassignation, pour que le nouvel admin ne rate pas les anciens messages.

## 4. Contre l'injection SQL

Toutes les requêtes utilisent des **requêtes paramétrées** (`?` + tableau de valeurs, via `mysql2`) — jamais de concaténation de texte SQL avec des valeurs venant de l'utilisateur.

## 5. Frontend

- `App.jsx` : chaque route vérifie la présence de `user` et redirige vers `/login` sinon — pas d'accès direct par URL sans session valide.
- `services/api.js` : un intercepteur ajoute automatiquement le token sur chaque requête ; un autre déconnecte automatiquement l'utilisateur si le serveur répond `401` (token expiré), pour éviter de rester coincé sur une page cassée.

## 6. Secrets et configuration

- `.env` (mots de passe DB, `JWT_SECRET`) : jamais commité, listé dans `.gitignore`.
- `.env.example` : sert de modèle sans valeurs sensibles, pour que le projet reste installable par quelqu'un d'autre.

## 7. Durcissements récents

| Correction | Fichier | Détail |
|---|---|---|
| **CORS restreint** | `server.js` | `cors()` sans options acceptait n'importe quel site web. Remplacé par `cors({ origin: process.env.FRONTEND_URL })` — seul le frontend (`http://localhost:5173`) peut appeler l'API. |
| **Import Excel limité en taille** | `routes/agences.js` | `multer` limité à 5 Mo (`limits: { fileSize: ... }`), pour éviter qu'un fichier énorme sature le serveur. |
| **Import Excel limité en type** | `routes/agences.js` | Seuls les fichiers `.xlsx`/`.xls` (vérifiés via `mimetype`) sont acceptés, sinon `400` avec message clair. |
| **Gestion d'erreur Multer** | `server.js` | Middleware d'erreur global (4 arguments `(err, req, res, next)`, reconnu automatiquement par Express) — renvoie une erreur JSON propre au lieu de la page HTML par défaut si le fichier dépasse la limite. |

## 8. Points ouverts (pas des failles urgentes, à garder en tête)

- **Rôle superadmin pas encore différencié en code** : le CDC précise que seul le superadmin doit pouvoir créer des comptes admin, mais cette route (`Epic 5`) n'existe pas encore — à vérifier avec un contrôle de rôle (`req.user.role === 'superadmin'`) quand elle sera construite.
- **Colonne `utilisateur.code_agence`** : legacy, plus utilisée depuis que les agences n'ont plus de compte — à supprimer proprement (`DROP FOREIGN KEY` puis `DROP COLUMN`).
- **Pas de limite sur les tentatives de connexion** (`POST /api/auth/login`) : rien n'empêche un enchaînement de tentatives de mot de passe sur un compte admin (brute-force). Même en réseau interne, c'est le genre de contrôle attendu dans un contexte bancaire — une librairie comme `express-rate-limit` (bloquer après X échecs) réglerait ça simplement.
- **HTTPS** : rien dans le code ne gère le chiffrement du trafic. Comme l'appli tourne en réseau interne, c'est probablement à gérer par un reverse proxy côté infra plutôt que dans le code — à vérifier avec M. Sebbar que ce n'est pas oublié.
