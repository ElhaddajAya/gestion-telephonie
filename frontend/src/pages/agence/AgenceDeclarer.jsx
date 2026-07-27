import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import api from "../../services/apiPublic";

function AgenceDeclarer() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [titre, setTitre] = useState("");
  const [type, setType] = useState("interne");
  const [priorite, setPriorite] = useState("normale");
  const [description, setDescription] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const conteneurStyle = {
    minHeight: "100vh",
    background: "#f4f4f4",
    fontFamily: "'Montserrat', sans-serif",
    padding: "clamp(28px, 3vw, 56px) clamp(32px, 4vw, 80px)",
  };

  const toggleStyle = (actif) => ({
    flex: 1,
    textAlign: "center",
    padding: "clamp(10px, 0.8vw, 13px)",
    border: `1.5px solid ${actif ? "#f77100" : "#d9d7cc"}`,
    background: actif ? "#fdeade" : "#fff",
    color: actif ? "#f77100" : "#4a483f",
    borderRadius: "6px",
    fontSize: "clamp(13px, 0.9vw, 15px)",
    fontWeight: 600,
    cursor: "pointer",
  });

  const prioriteCouleurs = {
    normale: { bg: "#f4f4f4", color: "#4a483f" },
    haute: { bg: "#fdece0", color: "#c25400" },
    urgente: { bg: "#fbe4e4", color: "#b91c1c" },
  };

  const prioriteStyle = (valeur) => {
    const actif = priorite === valeur;
    const couleurs = prioriteCouleurs[valeur];
    return {
      flex: 1,
      textAlign: "center",
      padding: "clamp(9px, 0.7vw, 12px)",
      borderRadius: "6px",
      fontSize: "clamp(12px, 0.85vw, 14px)",
      fontWeight: 600,
      cursor: "pointer",
      background: couleurs.bg,
      color: couleurs.color,
      border: actif ? `1.5px solid ${couleurs.color}` : "1.5px solid transparent",
    };
  };

  const envoyer = async () => {
    setErreur("");
    if (!titre.trim()) {
      setErreur("Le titre de l'incident est obligatoire.");
      return;
    }

    setEnvoi(true);
    try {
      const res = await api.post("/incidents", {
        code_agence: code,
        titre,
        type,
        priorite,
        description: description || undefined,
      });
      navigate(`/agence/${code}/tickets/${res.data.incident_id}`);
    } catch (error) {
      setErreur(
        error.response?.data?.message || "Erreur lors de la déclaration.",
      );
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div style={conteneurStyle}>
      <div style={{ maxWidth: "1800px", margin: "0 auto" }}>
        {/* En-tete */}
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

        <div
          onClick={() => navigate(`/agence/${code}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "clamp(13px, 0.9vw, 15px)",
            color: "#8a887e",
            cursor: "pointer",
            marginBottom: "14px",
          }}
        >
          <HiOutlineArrowLeft size={16} />
          Retour à l'accueil
        </div>

        <h1
          style={{
            fontSize: "clamp(20px, 1.4vw, 32px)",
            color: "#2b2a26",
            margin: "0 0 6px",
            fontWeight: 600,
          }}
        >
          Déclarer un incident téléphonie
        </h1>
        <p
          style={{
            fontSize: "clamp(13px, 0.9vw, 17px)",
            color: "#8a887e",
            margin: "0 0 clamp(24px, 1.8vw, 36px)",
          }}
        >
          Le siège sera notifié immédiatement de votre déclaration.
        </p>

        {/* Formulaire */}
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            border: "1px solid #eee",
            boxShadow: "0 4px 10px rgba(43,42,38,0.06)",
            padding: "clamp(20px, 1.8vw, 32px)",
            maxWidth: "620px",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: "clamp(12px, 0.85vw, 14px)",
              fontWeight: 600,
              color: "#4a483f",
              marginBottom: "6px",
            }}
          >
            Titre de l'incident
          </label>
          <input
            type='text'
            placeholder='Ex : Ligne fixe coupée'
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d9d7cc",
              borderRadius: "6px",
              fontSize: "clamp(13px, 0.9vw, 15px)",
              boxSizing: "border-box",
              fontFamily: "'Montserrat', sans-serif",
              marginBottom: "18px",
            }}
          />

          <label
            style={{
              display: "block",
              fontSize: "clamp(12px, 0.85vw, 14px)",
              fontWeight: 600,
              color: "#4a483f",
              marginBottom: "6px",
            }}
          >
            Type d'incident
          </label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
            <div
              onClick={() => setType("interne")}
              style={toggleStyle(type === "interne")}
            >
              Interne
            </div>
            <div
              onClick={() => setType("externe")}
              style={toggleStyle(type === "externe")}
            >
              Externe
            </div>
          </div>

          <label
            style={{
              display: "block",
              fontSize: "clamp(12px, 0.85vw, 14px)",
              fontWeight: 600,
              color: "#4a483f",
              marginBottom: "6px",
            }}
          >
            Priorité
          </label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
            <div
              onClick={() => setPriorite("normale")}
              style={prioriteStyle("normale")}
            >
              Normale
            </div>
            <div
              onClick={() => setPriorite("haute")}
              style={prioriteStyle("haute")}
            >
              Haute
            </div>
            <div
              onClick={() => setPriorite("urgente")}
              style={prioriteStyle("urgente")}
            >
              Urgente
            </div>
          </div>

          <label
            style={{
              display: "block",
              fontSize: "clamp(12px, 0.85vw, 14px)",
              fontWeight: 600,
              color: "#4a483f",
              marginBottom: "6px",
            }}
          >
            Description
          </label>
          <textarea
            rows={4}
            placeholder='Décrivez le problème rencontré...'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d9d7cc",
              borderRadius: "6px",
              fontSize: "clamp(13px, 0.9vw, 15px)",
              boxSizing: "border-box",
              fontFamily: "'Montserrat', sans-serif",
              resize: "none",
            }}
          />

          {erreur && (
            <p style={{ color: "#b91c1c", fontSize: "13px", marginTop: "10px" }}>
              {erreur}
            </p>
          )}

          <button
            onClick={envoyer}
            disabled={envoi}
            style={{
              width: "100%",
              marginTop: "22px",
              padding: "clamp(12px, 1vw, 15px)",
              background: "#f77100",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "clamp(14px, 0.95vw, 16px)",
              fontWeight: 600,
              cursor: envoi ? "default" : "pointer",
              opacity: envoi ? 0.7 : 1,
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            {envoi ? "Envoi..." : "Déclarer l'incident"}
          </button>

          <div
            style={{
              marginTop: "14px",
              padding: "10px 12px",
              background: "#f4f4f4",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#8a887e",
            }}
          >
            Le service informatique sera notifié immédiatement. Vous pourrez suivre
            l'évolution du traitement et échanger avec l'admin directement depuis
            la page du ticket.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgenceDeclarer;
