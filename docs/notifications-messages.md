# Notifications de messages — statut lu / non lu

## Le problème

La cloche de notifications signale les nouveaux tickets, mais aussi les nouvelles réponses d'agence sur les tickets qu'un admin traite. Il fallait pouvoir marquer un message comme "lu" dès que l'admin ouvre le ticket concerné, pour qu'il n'apparaisse plus dans la cloche.

## La règle retenue

Un ticket n'a qu'**un seul admin responsable** à la fois (`incident.traite_par`). Donc pas besoin d'un système compliqué (table séparée par admin) : une seule colonne suffit.

## Le schéma

```sql
ALTER TABLE incident
ADD COLUMN derniere_lecture DATETIME NULL;
```

- `NULL` = jamais lu depuis que ce ticket est assigné à son admin actuel.
- Une date = la dernière fois où l'admin assigné a ouvert ce ticket.

## Les routes backend (`backend/routes/incidents.js`)

| Route                                       | Rôle                                                                                                                                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUT /api/incidents/:id/lu`               | Met`derniere_lecture = NOW()`, uniquement si l'appelant est bien `traite_par` de ce ticket.                                                                                                      |
| `GET /api/incidents/commentaires-recents` | Renvoie les messages d'agence **non lus** sur les tickets de l'admin connecté : `traite_par = user.id` ET (`derniere_lecture IS NULL` OU message plus récent que `derniere_lecture`). |
| `PUT /api/incidents/:id/assigner`         | Remet`derniere_lecture = NULL` à chaque (ré)assignation, pour que le nouvel admin voie tout comme non lu.                                                                                        |
| `POST /api/incidents/:id/commentaires`    | Refuse (403) qu'un admin commente un ticket qui n'est pas le sien — il doit d'abord se l'assigner.                                                                                                  |

## Le flux frontend

1. **`IncidentDetail.jsx`** : à chaque chargement du ticket (ouverture + rafraîchissement auto toutes les 5s), appelle `PUT /incidents/:id/lu` en arrière-plan ("fire and forget", sans bloquer l'affichage).
2. **`Layout.jsx`** (la cloche) : appelle `GET /incidents/commentaires-recents` toutes les 15s — reçoit déjà uniquement les messages non lus, aucun filtre supplémentaire nécessaire côté React.
3. **Zone de commentaire désactivée** : si `incident.traite_par !== user.id`, le champ de réponse est remplacé par un message ("Assignez-vous ce ticket" ou "Assigné à X").

## Pourquoi pas de `localStorage` ?

Une première version stockait la date de dernière visite dans le navigateur (`localStorage`). Limite : ça ne fonctionne que sur un seul poste/navigateur. En déplaçant l'info en base de données (`derniere_lecture`), le statut lu/non lu est le même partout où l'admin se connecte — une seule source de vérité.

## Et côté agence ?

Même besoin, même logique, mais l'agence n'a pas de compte (donc pas de `traite_par` pour elle). On suit ça avec deux colonnes supplémentaires sur `incident` :

```sql
ALTER TABLE incident
ADD COLUMN derniere_maj DATETIME NULL,
ADD COLUMN derniere_lecture_agence DATETIME NULL;
```

- `derniere_maj` = la dernière fois qu'un **événement marquant** s'est produit sur le ticket pour l'agence : un admin a posté un message, ou un admin s'est assigné le ticket (donc l'état passe à "en cours"). Mise à jour dans `POST /api/incidents/:id/commentaires` (cas admin) et `PUT /api/incidents/:id/assigner`.
- `derniere_lecture_agence` = la dernière fois que l'agence a ouvert ce ticket. Mise à jour par `PUT /api/espace-agence/:code/tickets/:id/lu`, appelée en "fire and forget" par `AgenceTicketDetail.jsx` à chaque chargement.
- Le badge "Nouveau" (liste "Mes tickets" et accueil) s'affiche si `derniere_maj` est plus récente que `derniere_lecture_agence` (calculé directement en SQL dans `GET /api/espace-agence/:code/tickets` et `.../incidents-recents`).

**Pourquoi pas un email à chaque message ?** Pour éviter de solliciter le SMTP à chaque échange du fil de discussion (et d'inonder l'agence de mails), l'email (une fois le SMTP débloqué) est réservé aux événements marquants comme l'assignation — pas aux messages un par un, qui restent couverts uniquement par ce badge in-app, sans coût d'envoi.

## Le même point rouge côté admin ("Mes tickets")

Même logique, mais l'info existe déjà : `derniere_lecture` (lu/non lu par l'admin assigné) et les commentaires d'agence sont déjà en base, donc pas de nouvelle colonne nécessaire.

`GET /api/incidents` (utilisée par `MesTickets.jsx`) calcule un champ `nouveau` par ticket :

```sql
EXISTS (
  SELECT 1 FROM commentaire c
  WHERE c.incident_id = i.id
    AND c.auteur_agence_code IS NOT NULL
    AND (i.derniere_lecture IS NULL OR c.date_creation > i.derniere_lecture)
) AS nouveau
```

C'est exactement la même condition que `/commentaires-recents` (la cloche), juste calculée ticket par ticket plutôt qu'en liste globale.

**Uniquement sur "Mes tickets", pas sur "Tous les tickets"** : sur "Mes tickets", chaque ligne appartient à l'admin connecté, donc `derniere_lecture` le concerne directement. Sur "Tous les tickets", certaines lignes appartiennent à d'autres admins — afficher un point basé sur leur lecture à eux serait trompeur pour la personne qui regarde l'écran.
