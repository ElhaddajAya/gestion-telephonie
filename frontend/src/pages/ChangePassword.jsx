import { useState } from "react";
import api from "../services/api";

function ChangePassword({ onSuccess }) {
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    if (nouveauMdp !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (nouveauMdp.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    try {
      await api.put("/auth/change-password", {
        nouveau_mot_de_passe: nouveauMdp,
      });

      // On met a jour l'utilisateur stocke localement : il n'a plus besoin de changer son mdp
      const user = JSON.parse(localStorage.getItem("user"));
      user.doit_changer_mot_de_passe = false;
      localStorage.setItem("user", JSON.stringify(user));

      onSuccess(user);
    } catch (error) {
      setErreur(error.response?.data?.message || "Erreur lors du changement.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f4f4f4",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "clamp(32px, 3vw, 56px)",
          borderRadius: "10px",
          width: "clamp(380px, 22vw, 520px)",
          boxSizing: "content-box",
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          border: "1px solid #eee",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <div style={{ marginBottom: "clamp(28px, 2vw, 40px)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "clamp(16px, 1.1vw, 20px)",
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
              style={{ height: "clamp(44px, 3vw, 56px)" }}
            />
          </div>

          <h1
            style={{
              color: "#2b2a26",
              fontSize: "clamp(17px, 1.2vw, 22px)",
              margin: "clamp(18px, 1.2vw, 24px) 0 0",
              textAlign: "center",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            Changement de mot de passe
          </h1>
          <p
            style={{
              fontSize: "clamp(13px, 0.9vw, 15px)",
              color: "#8a887e",
              marginBottom: "clamp(20px, 1.4vw, 28px)",
              textAlign: "center",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Première connexion : vous devez choisir un nouveau mot de passe
            avant de continuer.
          </p>
        </div>

        <label
          style={{
            display: "block",
            marginTop: "clamp(16px, 1.1vw, 20px)",
            fontSize: "clamp(13px, 0.85vw, 15px)",
            fontWeight: 600,
            color: "#4a483f",
          }}
        >
          Nouveau mot de passe
        </label>
        <input
          type='password'
          value={nouveauMdp}
          onChange={(e) => setNouveauMdp(e.target.value)}
          style={{
            width: "100%",
            padding: "clamp(10px, 0.8vw, 13px) clamp(12px, 0.9vw, 16px)",
            marginTop: "clamp(6px, 0.6vw, 10px)",
            border: "1px solid #d9d7cc",
            borderRadius: "6px",
            fontSize: "clamp(14px, 0.9vw, 16px)",
            boxSizing: "border-box",
            fontFamily: "'Montserrat', sans-serif",
          }}
        />

        <label
          style={{
            display: "block",
            marginTop: "clamp(16px, 1.1vw, 20px)",
            fontSize: "clamp(13px, 0.85vw, 15px)",
            fontWeight: 600,
            color: "#4a483f",
          }}
        >
          Confirmer le mot de passe
        </label>
        <input
          type='password'
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          style={{
            width: "100%",
            padding: "clamp(10px, 0.8vw, 13px) clamp(12px, 0.9vw, 16px)",
            marginTop: "clamp(6px, 0.6vw, 10px)",
            border: "1px solid #d9d7cc",
            borderRadius: "6px",
            fontSize: "clamp(14px, 0.9vw, 16px)",
            boxSizing: "border-box",
            fontFamily: "'Montserrat', sans-serif",
          }}
        />

        {erreur && (
          <p style={{ color: "#b91c1c", fontSize: "13px", marginTop: "10px" }}>
            {erreur}
          </p>
        )}

        <button
          type='submit'
          style={{
            width: "100%",
            marginTop: "clamp(22px, 1.5vw, 28px)",
            padding: "clamp(12px, 0.9vw, 15px)",
            background: "#f77100",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "clamp(14px, 0.9vw, 16px)",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Valider
        </button>
      </form>
    </div>
  );
}

export default ChangePassword;
