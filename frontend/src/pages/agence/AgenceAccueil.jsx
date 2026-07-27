import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/apiPublic";
import Badge from "../../components/Badge";

function AgenceAccueil() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [agence, setAgence] = useState(null);
  const [stats, setStats] = useState(null);
  const [recents, setRecents] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    // premierChargement = true : affiche "Chargement..." (montage de la page).
    // Les rafraichissements automatiques suivants se font en silence, pour faire apparaitre/
    // disparaitre le point rouge "nouveau" sans faire clignoter toute la page.
    async function charger(premierChargement) {
      if (premierChargement) {
        setChargement(true);
        setErreur(false);
      }
      try {
        const [agenceRes, statsRes, recentsRes] = await Promise.all([
          api.get(`/espace-agence/${code}`),
          api.get(`/espace-agence/${code}/stats`),
          api.get(`/espace-agence/${code}/incidents-recents`),
        ]);
        setAgence(agenceRes.data);
        setStats(statsRes.data);
        setRecents(recentsRes.data);
      } catch (error) {
        console.error("Erreur chargement espace agence :", error);
        if (premierChargement) setErreur(true);
      } finally {
        if (premierChargement) setChargement(false);
      }
    }
    charger(true);
    const intervalle = setInterval(() => charger(false), 15000);
    return () => clearInterval(intervalle);
  }, [code]);

  // Meme cardStyle que Dashboard.jsx (admin), pour une taille de contenu identique
  const cardStyle = {
    flex: 1,
    background: "#fff",
    borderRadius: "10px",
    padding: "clamp(16px, 1.4vw, 24px) clamp(18px, 1.6vw, 26px)",
    border: "1px solid #eee",
    boxShadow: "0 4px 10px rgba(43,42,38,0.06)",
    minWidth: "clamp(160px, 14vw, 220px)",
  };

  // Meme padding que la zone de contenu de Layout.jsx (admin)
  const conteneurStyle = {
    minHeight: "100vh",
    background: "#f4f4f4",
    fontFamily: "'Montserrat', sans-serif",
    padding: "clamp(28px, 3vw, 56px) clamp(32px, 4vw, 80px)",
  };

  if (chargement) {
    return (
      <div style={conteneurStyle}>
        <p style={{ color: "#8a887e" }}>Chargement...</p>
      </div>
    );
  }

  if (erreur || !agence) {
    return (
      <div style={conteneurStyle}>
        <p style={{ color: "#b91c1c" }}>
          Agence introuvable. Vérifiez le lien utilisé ou contactez le siège.
        </p>
      </div>
    );
  }

  return (
    <div style={conteneurStyle}>
      <div style={{ maxWidth: "1800px", margin: "0 auto" }}>
        {/* En-tete : memes tailles que le logo BP / TELETRACK de l'espace admin */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "clamp(28px, 2.4vw, 48px)",
          }}
        >
          <div
            style={{
              fontSize: "clamp(25px, 1.8vw, 32px)",
              fontWeight: 700,
              color: "#f77100",
              letterSpacing: "0.01em",
              fontFamily: "'Syncopate', sans-serif",
            }}
          >
            TELETRACK
          </div>
          <img
            src='/logo_bp.png'
            alt='Banque Populaire'
            style={{ height: "clamp(44px, 3.3vw, 58px)" }}
          />
        </div>

        {/* Identite de l'agence */}
        <div
          style={{
            fontSize: "clamp(12px, 0.85vw, 15px)",
            fontWeight: 600,
            color: "#f77100",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          Agence {agence.nom} · {agence.code_agence}
        </div>
        <h1
          style={{
            fontSize: "clamp(20px, 1.4vw, 32px)",
            color: "#2b2a26",
            margin: "0 0 6px",
            fontWeight: 600,
          }}
        >
          Gestion des incidents téléphonie
        </h1>
        <p
          style={{
            fontSize: "clamp(13px, 0.9vw, 17px)",
            color: "#8a887e",
            margin: "0 0 clamp(24px, 1.8vw, 36px)",
          }}
        >
          {agence.succursale} · Banque Populaire Rabat-Kénitra
        </p>

        {/* Apercu chiffre — meme cardStyle que Dashboard.jsx */}
        <div
          style={{
            display: "flex",
            gap: "clamp(16px, 1.2vw, 24px)",
            flexWrap: "wrap",
            marginBottom: "26px",
          }}
        >
          <div style={cardStyle}>
            <div style={{ fontSize: "clamp(24px, 1.8vw, 36px)", fontWeight: 700, color: "#f77100" }}>
              {stats.ouverts}
            </div>
            <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
              Ticket(s) ouvert(s)
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: "clamp(24px, 1.8vw, 36px)", fontWeight: 700, color: "#f77100" }}>
              {stats.en_cours}
            </div>
            <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
              En cours de traitement
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: "clamp(24px, 1.8vw, 36px)", fontWeight: 700, color: "#1e7d34" }}>
              {stats.resolus}
            </div>
            <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
              Résolu(s)
            </div>
          </div>
        </div>

        {/* Actions principales */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
            marginBottom: "clamp(32px, 2.4vw, 48px)",
          }}
        >
          <button
            onClick={() => navigate(`/agence/${code}/declarer`)}
            style={{
              padding: "clamp(12px, 1vw, 18px) clamp(24px, 2vw, 34px)",
              background: "#f77100",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "clamp(13px, 0.9vw, 16px)",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Déclarer un incident
          </button>
          <button
            onClick={() => navigate(`/agence/${code}/tickets`)}
            style={{
              padding: "clamp(12px, 1vw, 18px) clamp(24px, 2vw, 34px)",
              background: "#fff",
              color: "#f77100",
              border: "1.5px solid #f77100",
              borderRadius: "6px",
              fontSize: "clamp(13px, 0.9vw, 16px)",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Voir mes tickets
          </button>
        </div>

        {/* Tickets recents — meme h3 et memes tailles de ligne que le tableau de Dashboard.jsx */}
        <h3
          style={{
            fontSize: "clamp(13px, 0.9vw, 16px)",
            textTransform: "uppercase",
            color: "#8a887e",
            marginBottom: "14px",
            fontWeight: 600,
          }}
        >
          Tickets récents
        </h3>

        {recents.length === 0 ? (
          <p style={{ color: "#8a887e", fontSize: "13px" }}>
            Aucun ticket déclaré pour l'instant.
          </p>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              border: "1px solid #eee",
              boxShadow: "0 4px 10px rgba(43,42,38,0.06)",
              overflow: "hidden",
            }}
          >
            {recents.map((inc, index) => (
              <div
                key={inc.id}
                onClick={() => navigate(`/agence/${code}/tickets/${inc.id}`)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  borderTop: index === 0 ? "none" : "1px solid #eee",
                  cursor: "pointer",
                  fontSize: "clamp(13px, 0.9vw, 16px)",
                  color: "#2b2a26",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  {inc.titre}
                  {!!inc.nouveau && (
                    <span
                      title='Nouveau'
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#e41e3f",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Badge valeur={inc.priorite} />
                  <Badge valeur={inc.etat} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AgenceAccueil;
