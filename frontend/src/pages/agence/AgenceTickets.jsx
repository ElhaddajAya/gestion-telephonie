import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft, HiChevronUp, HiChevronDown } from "react-icons/hi";
import api from "../../services/apiPublic";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";

function AgenceTickets() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreEtat, setFiltreEtat] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [filtrePriorite, setFiltrePriorite] = useState("");
  const [tri, setTri] = useState("desc");
  const [page, setPage] = useState(1);
  const [taillePage, setTaillePage] = useState(10);

  useEffect(() => {
    // premierChargement = true : affiche "Chargement..." (montage, changement de filtre/tri).
    // Les rafraichissements automatiques suivants se font en silence, sans faire clignoter la liste
    // ni ramener l'utilisateur a la page 1 pendant qu'il consulte la sienne.
    async function charger(premierChargement) {
      if (premierChargement) setChargement(true);
      try {
        const res = await api.get(`/espace-agence/${code}/tickets`, {
          params: {
            recherche: recherche || undefined,
            etat: filtreEtat || undefined,
            type: filtreType || undefined,
            priorite: filtrePriorite || undefined,
            tri,
          },
        });
        setTickets(res.data);
        if (premierChargement) setPage(1);
      } catch (error) {
        console.error("Erreur chargement tickets :", error);
      } finally {
        if (premierChargement) setChargement(false);
      }
    }
    charger(true);
    const intervalle = setInterval(() => charger(false), 15000);
    return () => clearInterval(intervalle);
  }, [code, recherche, filtreEtat, filtreType, filtrePriorite, tri]);

  const ticketsPage = tickets.slice((page - 1) * taillePage, page * taillePage);

  const conteneurStyle = {
    minHeight: "100vh",
    background: "#f4f4f4",
    fontFamily: "'Montserrat', sans-serif",
    padding: "clamp(28px, 3vw, 56px) clamp(32px, 4vw, 80px)",
  };

  const inputStyle = {
    padding: "clamp(8px, 0.6vw, 11px) clamp(10px, 0.8vw, 14px)",
    border: "1px solid #d9d7cc",
    borderRadius: "6px",
    fontSize: "clamp(13px, 0.85vw, 15px)",
    fontFamily: "'Montserrat', sans-serif",
    background: "#fff",
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
          Mes tickets
        </h1>
        <p
          style={{
            fontSize: "clamp(13px, 0.9vw, 17px)",
            color: "#8a887e",
            margin: "0 0 clamp(24px, 1.8vw, 36px)",
          }}
        >
          Historique complet des tickets déclarés par votre agence
        </p>

        {/* Filtres */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <input
            type='text'
            placeholder='Rechercher un titre...'
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: "200px" }}
          />
          <select
            value={filtreEtat}
            onChange={(e) => setFiltreEtat(e.target.value)}
            style={inputStyle}
          >
            <option value=''>Tous les états</option>
            <option value='ouvert'>Ouvert</option>
            <option value='en_cours'>En cours</option>
            <option value='resolu'>Résolu</option>
          </select>
          <select
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
            style={inputStyle}
          >
            <option value=''>Tous les types</option>
            <option value='interne'>Interne</option>
            <option value='externe'>Externe</option>
          </select>
          <select
            value={filtrePriorite}
            onChange={(e) => setFiltrePriorite(e.target.value)}
            style={inputStyle}
          >
            <option value=''>Toutes les priorités</option>
            <option value='normale'>Normale</option>
            <option value='haute'>Haute</option>
            <option value='urgente'>Urgente</option>
          </select>
        </div>

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
                  Titre
                </th>
                <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  Type
                </th>
                <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  Priorité
                </th>
                <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  État
                </th>
                <th
                  onClick={() => setTri(tri === "asc" ? "desc" : "asc")}
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    Déclaré le
                    {tri === "asc" ? (
                      <HiChevronUp size={14} />
                    ) : (
                      <HiChevronDown size={14} />
                    )}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ticketsPage.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/agence/${code}/tickets/${t.id}`)}
                  style={{
                    cursor: "pointer",
                    borderTop: "1px solid #eee",
                    fontSize: "clamp(13px, 0.9vw, 16px)",
                    color: "#2b2a26",
                  }}
                >
                  <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      {t.titre}
                      {!!t.nouveau && (
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
                  <td
                    colSpan={5}
                    style={{ padding: "20px", textAlign: "center", color: "#8a887e" }}
                  >
                    Aucun ticket trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {!chargement && tickets.length > 0 && (
          <Pagination
            page={page}
            totalItems={tickets.length}
            pageSize={taillePage}
            onPageChange={setPage}
            onPageSizeChange={setTaillePage}
          />
        )}
      </div>
    </div>
  );
}

export default AgenceTickets;
