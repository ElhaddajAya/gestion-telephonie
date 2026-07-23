import { useState } from "react";
import api from "../services/api";

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
        background: "#fffcfb",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "10px",
          width: "360px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          border: "1px solid #eee",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "16px",
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
              style={{ height: "48px" }}
            />
          </div>

          <h1
            style={{
              color: "#2b2a26",
              fontSize: "17px",
              margin: "20px 0 0",
              textAlign: "center",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            Connexion admin
          </h1>
          <div
            style={{
              fontSize: "12px",
              color: "#8a887e",
              marginTop: "4px",
              textAlign: "center",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Gestion des incidents téléphonie — BP Rabat-Kénitra
          </div>
        </div>

        <label
          style={{
            display: "block",
            marginTop: "16px",
            fontSize: "13px",
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
            padding: "10px 12px",
            marginTop: "6px",
            border: "1px solid #d9d7cc",
            borderRadius: "6px",
            fontSize: "14px",
            boxSizing: "border-box",
            fontFamily: "'Montserrat', sans-serif",
          }}
        />

        <label
          style={{
            display: "block",
            marginTop: "16px",
            fontSize: "13px",
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
            padding: "10px 12px",
            marginTop: "6px",
            border: "1px solid #d9d7cc",
            borderRadius: "6px",
            fontSize: "14px",
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
            marginTop: "22px",
            padding: "12px",
            background: "#f77100",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
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
