import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Layout from "../../components/admin/Layout";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formaterDuree(minutes) {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [statsAvancees, setStatsAvancees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [page, setPage] = useState(1);
  const [taillePage, setTaillePage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    async function chargerDonnees() {
      try {
        // un seul appel Promise.all, avec les 3 requetes
        const [statsRes, incidentsRes, statsAvanceesRes] = await Promise.all([
          api.get("/incidents/stats"),
          api.get("/incidents", { params: { etat: "ouvert" } }),
          api.get("/incidents/stats-detaillees"),
        ]);
        setStats(statsRes.data);
        setIncidents(incidentsRes.data);
        setStatsAvancees(statsAvanceesRes.data);
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

  if (!stats)
    return (
      <Layout
        user={user}
        onLogout={onLogout}
      >
        <p style={{ fontFamily: "'Montserrat', sans-serif", color: "#8a887e" }}>
          Impossible de charger le tableau de bord.
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
        Vue d'ensemble et nouveaux tickets
      </p>

      <h3
        style={{
          fontSize: "clamp(13px, 0.9vw, 16px)",
          textTransform: "uppercase",
          color: "#8a887e",
          marginBottom: "14px",
          fontWeight: 600,
        }}
      >
        Réseau
      </h3>
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
          <div
            style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}
          >
            Tickets ouverts (non assignés)
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
          <div
            style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}
          >
            Priorité urgente
          </div>
        </div>
        {statsAvancees && (
          <div style={cardStyle}>
            <div
              style={{
                fontSize: "clamp(24px, 1.8vw, 36px)",
                fontWeight: 700,
                color: "#f77100",
              }}
            >
              {formaterDuree(statsAvancees.temps_resolution_minutes)}
            </div>
            <div
              style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}
            >
              Temps moyen de résolution
            </div>
          </div>
        )}
      </div>

      <h3
        style={{
          fontSize: "clamp(13px, 0.9vw, 16px)",
          textTransform: "uppercase",
          color: "#8a887e",
          marginBottom: "14px",
          fontWeight: 600,
        }}
      >
        Vos tickets
      </h3>
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
              color: "#4b0700",
            }}
          >
            {stats.mes_tickets_en_cours}
          </div>
          <div
            style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}
          >
            En cours de traitement par vous
          </div>
        </div>
        <div style={cardStyle}>
          <div
            style={{
              fontSize: "clamp(24px, 1.8vw, 36px)",
              fontWeight: 700,
              color: "#4b0700",
            }}
          >
            {stats.mes_tickets_resolus_ce_mois}
          </div>
          <div
            style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}
          >
            Résolus par vous ce mois
          </div>
        </div>
      </div>

      {statsAvancees && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.4fr",
              gap: "clamp(16px, 1.2vw, 24px)",
            }}
          >
            <div style={cardStyle}>
              <h3
                style={{
                  fontSize: "13px",
                  textTransform: "uppercase",
                  color: "#8a887e",
                  marginBottom: "14px",
                  fontWeight: 600,
                }}
              >
                Répartition par type
              </h3>
              <ResponsiveContainer
                width='100%'
                height={statsAvancees.par_type.length * 60 + 20}
              >
                <BarChart
                  data={statsAvancees.par_type}
                  layout='vertical'
                  margin={{ left: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    horizontal={false}
                    stroke='#d7d7d7'
                  />
                  <XAxis
                    type='number'
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#8a887e" }}
                  />
                  <YAxis
                    type='category'
                    dataKey='type'
                    tick={{
                      fontSize: 13,
                      fill: "#2b2a26",
                      textTransform: "capitalize",
                    }}
                    tickFormatter={(v) =>
                      v.charAt(0).toUpperCase() + v.slice(1)
                    }
                    width={70}
                  />
                  <Tooltip />
                  <Bar
                    dataKey='total'
                    fill='#f77100'
                    radius={[0, 6, 6, 0]}
                    barSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={cardStyle}>
              <h3
                style={{
                  fontSize: "13px",
                  textTransform: "uppercase",
                  color: "#8a887e",
                  marginBottom: "14px",
                  fontWeight: 600,
                }}
              >
                Répartition par succursale
              </h3>
              <ResponsiveContainer
                width='100%'
                height={statsAvancees.par_succursale.length * 32 + 20}
              >
                <BarChart
                  data={statsAvancees.par_succursale}
                  layout='vertical'
                  margin={{ left: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    horizontal={false}
                    stroke='#d7d7d7'
                  />
                  <XAxis
                    type='number'
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#8a887e" }}
                  />
                  <YAxis
                    type='category'
                    dataKey='succursale'
                    tick={{ fontSize: 12, fill: "#2b2a26" }}
                    width={140}
                  />
                  <Tooltip />
                  <Bar
                    dataKey='total'
                    fill='#4b0700'
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
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
            Nouveaux tickets (non traités)
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
                <th
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  Agence
                </th>
                <th
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  Titre
                </th>
                <th
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  Priorité
                </th>
                <th
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  Déclaré le
                </th>
              </tr>
            </thead>
            <tbody>
              {incidents
                .slice((page - 1) * taillePage, page * taillePage)
                .map((inc) => (
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
                  <td
                    style={{
                      padding:
                        "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                    }}
                  >
                    {inc.nom_agence} ({inc.code_agence})
                  </td>
                  <td
                    style={{
                      padding:
                        "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                    }}
                  >
                    {inc.titre}
                  </td>
                  <td
                    style={{
                      padding:
                        "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                    }}
                  >
                    <Badge valeur={inc.type} />
                  </td>
                  <td
                    style={{
                      padding:
                        "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                    }}
                  >
                    <Badge valeur={inc.priorite} />
                  </td>
                  <td
                    style={{
                      padding:
                        "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                    }}
                  >
                    {new Date(inc.date_creation).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#8a887e",
                      fontSize: "13px",
                    }}
                  >
                    Aucun ticket pour l'instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {incidents.length > 0 && (
            <Pagination
              page={page}
              totalItems={incidents.length}
              pageSize={taillePage}
              onPageChange={setPage}
              onPageSizeChange={setTaillePage}
            />
          )}
        </>
      )}
    </Layout>
  );
}

export default Dashboard;
