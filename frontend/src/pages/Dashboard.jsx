import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";

function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [chargement, setChargement] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function chargerDonnees() {
      try {
        const [statsRes, incidentsRes] = await Promise.all([
          api.get("/incidents/stats"),
          api.get("/incidents", { params: { etat: "ouvert" } }),
        ]);
        setStats(statsRes.data);
        setIncidents(incidentsRes.data);
      } catch (error) {
        console.error("Erreur chargement dashboard :", error);
      } finally {
        setChargement(false);
      }
    }
    chargerDonnees();
  }, []);

  if (chargement)
    return (
      <Layout
        user={user}
        onLogout={onLogout}
      >
        <p style={{ fontFamily: "'Montserrat', sans-serif", color: "#8a887e" }}>
          Chargement...
        </p>
      </Layout>
    );

  const cardStyle = {
    flex: 1,
    background: "#fff",
    borderRadius: "10px",
    padding: "clamp(16px, 1.4vw, 24px) clamp(18px, 1.6vw, 26px)",
    border: "1px solid #eee",
    boxShadow: "0 4px 10px rgba(43,42,38,0.06)",
    minWidth: "clamp(160px, 14vw, 220px)",
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
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 600,
        }}
      >
        Tableau de bord
      </h1>
      <p
        style={{
          fontSize: "clamp(13px, 0.9vw, 17px)",
          color: "#8a887e",
          marginBottom: "clamp(24px, 1.8vw, 36px)",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        Vue d'ensemble et nouveaux incidents
      </p>

      <div
        style={{
          display: "flex",
          gap: "clamp(16px, 1.2vw, 24px)",
          flexWrap: "wrap",
          marginBottom: "26px",
        }}
      >
        <div style={cardStyle}>
          <div
            style={{
              fontSize: "clamp(24px, 1.8vw, 36px)",
              fontWeight: 700,
              color: "#f77100",
            }}
          >
            {stats.incidents_ouverts}
          </div>
          <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
            Incidents ouverts
          </div>
        </div>
        <div style={cardStyle}>
          <div
            style={{
              fontSize: "clamp(24px, 1.8vw, 36px)",
              fontWeight: 700,
              color: "#f77100",
            }}
          >
            {stats.en_cours}
          </div>
          <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
            En cours de traitement
          </div>
        </div>
        <div style={cardStyle}>
          <div
            style={{
              fontSize: "clamp(24px, 1.8vw, 36px)",
              fontWeight: 700,
              color: "#b91c1c",
            }}
          >
            {stats.priorite_urgente}
          </div>
          <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
            Priorité urgente
          </div>
        </div>
        <div style={cardStyle}>
          <div
            style={{
              fontSize: "clamp(24px, 1.8vw, 36px)",
              fontWeight: 700,
              color: "#f77100",
            }}
          >
            {stats.resolus_ce_mois}
          </div>
          <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
            Résolus ce mois
          </div>
        </div>
      </div>

      <h3
        style={{
          fontSize: "clamp(13px, 0.9vw, 16px)",
          textTransform: "uppercase",
          color: "#8a887e",
          marginBottom: "14px",
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 600,
        }}
      >
        Nouveaux incidents (non traités)
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #eee",
          boxShadow: "0 4px 10px rgba(43,42,38,0.06)",
          fontFamily: "'Montserrat', sans-serif",
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
              Agence
            </th>
            <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
              Titre
            </th>
            <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
              Type
            </th>
            <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
              Priorité
            </th>
            <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
              Déclaré le
            </th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc) => (
            <tr
              key={inc.id}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              style={{
                cursor: "pointer",
                borderTop: "1px solid #eee",
                fontSize: "clamp(13px, 0.9vw, 16px)",
                color: "#2b2a26",
              }}
            >
              <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                {inc.nom_agence} ({inc.code_agence})
              </td>
              <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                {inc.titre}
              </td>
              <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                {inc.type}
              </td>
              <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                {inc.priorite}
              </td>
              <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                {new Date(inc.date_creation).toLocaleDateString("fr-FR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

export default Dashboard;
