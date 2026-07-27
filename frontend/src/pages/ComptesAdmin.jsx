import { useState, useEffect } from "react";
import api from "../services/api";
import Layout from "../components/Layout";

function ComptesAdmin({ user, onLogout }) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      try {
        const res = await api.get("/utilisateurs", {
          params: { recherche: recherche || undefined },
        });
        setUtilisateurs(res.data);
      } catch (error) {
        console.error("Erreur chargement des comptes admin :", error);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, [recherche]);

  const inputStyle = {
    padding: "clamp(8px, 0.6vw, 11px) clamp(10px, 0.8vw, 14px)",
    border: "1px solid #d9d7cc",
    borderRadius: "6px",
    fontSize: "clamp(13px, 0.85vw, 15px)",
    fontFamily: "'Montserrat', sans-serif",
    background: "#fff",
  };

  return (
    <Layout
      user={user}
      onLogout={onLogout}
    >
      <h1
        style={{
          fontSize: "clamp(20px, 1.4vw, 32px)",
          color: "#2b2a26",
          margin: "0 0 6px",
          fontWeight: 600,
        }}
      >
        Comptes admin
      </h1>
      <p
        style={{
          fontSize: "clamp(13px, 0.9vw, 17px)",
          color: "#8a887e",
          marginBottom: "clamp(20px, 1.6vw, 30px)",
        }}
      >
        Liste des comptes admin et superadmin
      </p>

      <input
        type='text'
        placeholder='Rechercher un nom, prénom, matricule...'
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{ ...inputStyle, width: "100%", maxWidth: "360px", marginBottom: "20px" }}
      />

      {chargement ? (
        <p style={{ color: "#8a887e" }}>Chargement...</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
            borderRadius: "10px",
            overflow: "hidden",
            border: "1px solid #eee",
            boxShadow: "0 4px 10px rgba(43,42,38,0.06)",
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: "left",
                fontSize: "clamp(11px, 0.8vw, 14px)",
                textTransform: "uppercase",
                color: "#8a887e",
              }}
            >
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Nom
              </th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Matricule
              </th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Rôle
              </th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <tr
                key={u.id}
                style={{
                  borderTop: "1px solid #eee",
                  fontSize: "clamp(13px, 0.9vw, 16px)",
                  color: "#2b2a26",
                }}
              >
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  {u.prenom} {u.nom}
                </td>
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  {u.matricule}
                </td>
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: u.role === "superadmin" ? "#4b0700" : "#8a887e",
                      background: "#f4f4f4",
                      padding: "3px 10px",
                      borderRadius: "10px",
                      textTransform: "uppercase",
                    }}
                  >
                    {u.role === "superadmin" ? "Superadmin" : "Admin"}
                  </span>
                </td>
              </tr>
            ))}
            {utilisateurs.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  style={{ padding: "20px", textAlign: "center", color: "#8a887e" }}
                >
                  Aucun compte trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </Layout>
  );
}

export default ComptesAdmin;
