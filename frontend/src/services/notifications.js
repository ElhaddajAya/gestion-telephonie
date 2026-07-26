// Suivi local (par navigateur) de la derniere visite de chaque ticket,
// utilise pour savoir quels nouveaux messages doivent encore apparaitre
// dans la cloche de notifications.

const CLE = "teletrack_tickets_vus";

function lireTout() {
    try {
        return JSON.parse(localStorage.getItem(CLE)) || {};
    } catch {
        return {};
    }
}

export function marquerVisite(incidentId) {
    const tout = lireTout();
    tout[incidentId] = new Date().toISOString();
    localStorage.setItem(CLE, JSON.stringify(tout));
}

export function estNonVu(incidentId, dateCreation) {
    const tout = lireTout();
    const derniereVisite = tout[incidentId];
    if (!derniereVisite) return true;
    return new Date(dateCreation) > new Date(derniereVisite);
}
