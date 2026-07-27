import { useState } from "react";
import api from "../../services/api";

function Login({ onLoginSuccess }) {
  const [matricule, setMatricule] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    try {
      const response = await api.post("/auth/login", {
        matricule,
        mot_de_passe: motDePasse,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      onLoginSuccess(response.data.user);
    } catch (error) {
      if (error.response) {
        setErreur(error.response.data.message);
      } else {
        setErreur("Impossible de contacter le serveur.");
      }
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
          boxShadow: "0 4px 14px rgba(43,42,38,0.06)",
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
            Connexion admin
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
            Gestion des tickets téléphonie — BP Rabat-Kénitra
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
          Matricule
        </label>
        <input
          type='text'
          value={matricule}
          onChange={(e) => setMatricule(e.target.value)}
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
          Mot de passe
        </label>
        <input
          type='password'
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
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
          Se connecter
        </button>
      </form>
    </div>
  );
}

export default Login;
