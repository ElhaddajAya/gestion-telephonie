import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft, HiChevronUp, HiChevronDown } from "react-icons/hi";
import api from "../../services/api";
import Layout from "../../components/admin/Layout";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";

function formaterDuree(minutes) {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function AgenceHistorique({ user, onLogout }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const [historique, setHistorique] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [page, setPage] = useState(1);
  const [taillePage, setTaillePage] = useState(10);
  const [tri, setTri] = useState("desc");

  useEffect(() => {
    async function charger() {
      setChargement(true);
      setErreur(false);
      try {
        const [historiqueRes, ticketsRes] = await Promise.all([
          api.get(`/agences/${code}/historique`),
          api.get("/incidents", { params: { code_agence: code, tri } }),
        ]);
        setHistorique(historiqueRes.data);
        setTickets(ticketsRes.data);
        setPage(1);
      } catch (error) {
        console.error("Erreur chargement historique agence :", error);
        setErreur(true);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, [code, tri]);

  const ticketsPage = tickets.slice((page - 1) * taillePage, page * taillePage);

  const cardStyle = {
    flex: 1,
    background: "#fff",
    borderRadius: "10px",
    padding: "clamp(16px, 1.4vw, 24px) clamp(18px, 1.6vw, 26px)",
    border: "1px solid #eee",
    boxShadow: "0 4px 10px rgba(43,42,38,0.06)",
    minWidth: "clamp(160px, 14vw, 220px)",
  };

  if (chargement) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <p style={{ color: "#8a887e" }}>Chargement...</p>
      </Layout>
    );
  }

  if (erreur || !historique) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <p style={{ color: "#b91c1c" }}>Impossible de charger l'historique de cette agence.</p>
      </Layout>
    );
  }

  const compteEtat = (etat) =>
    historique.par_etat.find((e) => e.etat === etat)?.total || 0;

  return (
    <Layout user={user} onLogout={onLogout}>
      <div
        onClick={() => navigate("/agences")}
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
        Retour aux agences
      </div>

      <div
        style={{
          fontSize: "clamp(12px, 0.85vw, 15px)",
          fontWeight: 600,
          color: "#f77100",
          textTransform: "uppercase",
          marginBottom: "6px",
        }}
      >
        Agence {historique.agence.nom} · {historique.agence.code_agence}
      </div>
      <h1
        style={{
          fontSize: "clamp(20px, 1.4vw, 32px)",
          color: "#2b2a26",
          margin: "0 0 6px",
          fontWeight: 600,
        }}
      >
        Historique des incidents
      </h1>
      <p
        style={{
          fontSize: "clamp(13px, 0.9vw, 17px)",
          color: "#8a887e",
          margin: "0 0 clamp(24px, 1.8vw, 36px)",
        }}
      >
        {historique.agence.succursale} · Banque Populaire Rabat-Kénitra
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
          <div style={{ fontSize: "clamp(24px, 1.8vw, 36px)", fontWeight: 700, color: "#f77100" }}>
            {historique.total}
          </div>
          <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
            Incidents au total
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: "clamp(24px, 1.8vw, 36px)", fontWeight: 700, color: "#f77100" }}>
            {compteEtat("ouvert")}
          </div>
          <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
            Ouverts
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: "clamp(24px, 1.8vw, 36px)", fontWeight: 700, color: "#c25400" }}>
            {compteEtat("en_cours")}
          </div>
          <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
            En cours de traitement
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: "clamp(24px, 1.8vw, 36px)", fontWeight: 700, color: "#1e7d34" }}>
            {compteEtat("resolu")}
          </div>
          <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
            Résolus
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: "clamp(24px, 1.8vw, 36px)", fontWeight: 700, color: "#f77100" }}>
            {formaterDuree(historique.temps_resolution_minutes)}
          </div>
          <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
            Temps moyen de résolution — cette agence
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: "clamp(24px, 1.8vw, 36px)", fontWeight: 700, color: "#8a887e" }}>
            {formaterDuree(historique.temps_resolution_reseau_minutes)}
          </div>
          <div style={{ fontSize: "clamp(12px, 0.85vw, 15px)", color: "#8a887e" }}>
            Temps moyen de résolution — tout le réseau
          </div>
        </div>
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
        Tous les tickets de cette agence
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
            <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>Titre</th>
            <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>Type</th>
            <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>Priorité</th>
            <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>État</th>
            <th
              onClick={() => setTri(tri === "asc" ? "desc" : "asc")}
              style={{
                padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                Déclaré le
                {tri === "asc" ? <HiChevronUp size={14} /> : <HiChevronDown size={14} />}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ticketsPage.map((t) => (
            <tr
              key={t.id}
              onClick={() =>
                navigate(`/incidents/${t.id}`, {
                  state: { from: `/agences/${code}/historique` },
                })
              }
              style={{
                cursor: "pointer",
                borderTop: "1px solid #eee",
                fontSize: "clamp(13px, 0.9vw, 16px)",
                color: "#2b2a26",
              }}
            >
              <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                {t.titre}
              </td>
              <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                <Badge valeur={t.type} />
              </td>
              <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                <Badge valeur={t.priorite} />
              </td>
              <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                <Badge valeur={t.etat} />
              </td>
              <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                {new Date(t.date_creation).toLocaleDateString("fr-FR")}
              </td>
            </tr>
          ))}
          {tickets.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#8a887e" }}>
                Aucun ticket pour cette agence.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {tickets.length > 0 && (
        <Pagination
          page={page}
          totalItems={tickets.length}
          pageSize={taillePage}
          onPageChange={setPage}
          onPageSizeChange={setTaillePage}
        />
      )}
    </Layout>
  );
}

export default AgenceHistorique;
