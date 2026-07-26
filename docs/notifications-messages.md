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

| Route | Rôle |
|---|---|
| `PUT /api/incidents/:id/lu` | Met `derniere_lecture = NOW()`, uniquement si l'appelant est bien `traite_par` de ce ticket. |
| `GET /api/incidents/commentaires-recents` | Renvoie les messages d'agence **non lus** sur les tickets de l'admin connecté : `traite_par = user.id` ET (`derniere_lecture IS NULL` OU message plus récent que `derniere_lecture`). |
| `PUT /api/incidents/:id/assigner` | Remet `derniere_lecture = NULL` à chaque (ré)assignation, pour que le nouvel admin voie tout comme non lu. |
| `POST /api/incidents/:id/commentaires` | Refuse (403) qu'un admin commente un ticket qui n'est pas le sien — il doit d'abord se l'assigner. |

## Le flux frontend

1. **`IncidentDetail.jsx`** : à chaque chargement du ticket (ouverture + rafraîchissement auto toutes les 5s), appelle `PUT /incidents/:id/lu` en arrière-plan ("fire and forget", sans bloquer l'affichage).
2. **`Layout.jsx`** (la cloche) : appelle `GET /incidents/commentaires-recents` toutes les 15s — reçoit déjà uniquement les messages non lus, aucun filtre supplémentaire nécessaire côté React.
3. **Zone de commentaire désactivée** : si `incident.traite_par !== user.id`, le champ de réponse est remplacé par un message ("Assignez-vous ce ticket" ou "Assigné à X").

## Pourquoi pas de `localStorage` ?

Une première version stockait la date de dernière visite dans le navigateur (`localStorage`). Limite : ça ne fonctionne que sur un seul poste/navigateur. En déplaçant l'info en base de données (`derniere_lecture`), le statut lu/non lu est le même partout où l'admin se connecte — une seule source de vérité.
