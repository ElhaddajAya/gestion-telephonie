import { useState, useEffect } from "react";
import api from "../services/api";

function ModalReassigner({ ouvert, onFermer, onSelectionner }) {
  const [admins, setAdmins] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    setRecherche("");
    setChargement(true);
    api
      .get("/utilisateurs")
      .then((res) => setAdmins(res.data))
      .catch((error) => console.error("Erreur chargement admins :", error))
      .finally(() => setChargement(false));
  }, [ouvert]);

  if (!ouvert) return null;

  const rechercheNorm = recherche.trim().toLowerCase();
  const adminsFiltres = admins.filter((a) => {
    if (!rechercheNorm) return true;
    return (
      a.nom?.toLowerCase().includes(rechercheNorm) ||
      a.prenom?.toLowerCase().includes(rechercheNorm) ||
      a.matricule?.toLowerCase().includes(rechercheNorm)
    );
  });

  return (
    <div
      onClick={onFermer}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(43,42,38,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "12px",
          width: "clamp(380px, 28vw, 480px)",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 12px 32px rgba(43,42,38,0.18)",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <div style={{ padding: "clamp(18px, 1.4vw, 26px) clamp(18px, 1.4vw, 26px) clamp(12px, 1vw, 16px)" }}>
          <div
            style={{
              fontSize: "clamp(14px, 1vw, 17px)",
              fontWeight: 600,
              color: "#2b2a26",
              marginBottom: "clamp(12px, 1vw, 16px)",
            }}
          >
            Réassigner à un admin
          </div>
          <input
            autoFocus
            type='text'
            placeholder='Rechercher par nom ou matricule...'
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              width: "100%",
              padding: "clamp(9px, 0.8vw, 12px) clamp(12px, 1vw, 15px)",
              border: "1px solid #d9d7cc",
              borderRadius: "6px",
              fontSize: "clamp(13px, 0.9vw, 15px)",
              boxSizing: "border-box",
              fontFamily: "'Montserrat', sans-serif",
            }}
          />
        </div>

        <div style={{ overflowY: "auto", padding: "0 clamp(8px, 0.8vw, 12px) clamp(8px, 0.8vw, 12px)" }}>
          {chargement && (
            <div style={{ padding: "16px", fontSize: "clamp(13px, 0.9vw, 15px)", color: "#8a887e" }}>
              Chargement...
            </div>
          )}
          {!chargement && adminsFiltres.length === 0 && (
            <div style={{ padding: "16px", fontSize: "clamp(13px, 0.9vw, 15px)", color: "#8a887e" }}>
              Aucun admin trouvé.
            </div>
          )}
          {!chargement &&
            adminsFiltres.map((admin) => (
              <div
                key={admin.id}
                onClick={() => onSelectionner(admin)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "clamp(10px, 0.9vw, 13px) clamp(10px, 0.9vw, 13px)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "clamp(13px, 0.9vw, 15px)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f4")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ color: "#2b2a26", fontWeight: 600 }}>
                  {admin.prenom} {admin.nom}
                </span>
                <span style={{ color: "#8a887e", fontSize: "clamp(12px, 0.85vw, 14px)" }}>
                  {admin.matricule}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default ModalReassigner;
