import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { HiChevronUp, HiChevronDown } from "react-icons/hi";
import Layout from "../../components/admin/Layout";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";

function Incidents({ user, onLogout }) {
  const [incidents, setIncidents] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [taillePage, setTaillePage] = useState(10);
  const navigate = useNavigate();
  // Les filtres/tri/page vivent dans l'URL (?etat=...&page=...) plutot que dans le state du
  // composant : ainsi, revenir en arriere depuis le detail d'un ticket (bouton "Retour" ou
  // bouton natif du navigateur) retombe exactement sur la meme liste filtree, au lieu de tout
  // reinitialiser.
  const [searchParams, setSearchParams] = useSearchParams();
  const recherche = searchParams.get("recherche") || "";
  const filtreEtat = searchParams.get("etat") || "";
  const filtreType = searchParams.get("type") || "";
  const filtrePriorite = searchParams.get("priorite") || "";
  const filtreDate = searchParams.get("date") || "";
  const tri = searchParams.get("tri") || "desc";
  const page = Number(searchParams.get("page")) || 1;

  // Met a jour un filtre dans l'URL ; revient a la page 1 des qu'un filtre change
  // (sauf quand c'est justement la page qu'on change)
  const definirFiltre = (cle, valeur) => {
    const params = new URLSearchParams(searchParams);
    if (valeur) params.set(cle, valeur);
    else params.delete(cle);
    params.delete("page");
    setSearchParams(params, { replace: true });
  };

  const changerPage = (nouvellePage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", nouvellePage);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    async function charger() {
      setChargement(true);
      try {
        const res = await api.get("/incidents", {
          params: {
            agence: recherche || undefined,
            etat: filtreEtat || undefined,
            type: filtreType || undefined,
            priorite: filtrePriorite || undefined,
            date: filtreDate || undefined,
            tri,
          },
        });
        setIncidents(res.data);
      } catch (error) {
        console.error("Erreur chargement incidents :", error);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, [recherche, filtreEtat, filtreType, filtrePriorite, filtreDate, tri]);

  const incidentsPage = incidents.slice(
    (page - 1) * taillePage,
    page * taillePage,
  );

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
        Tous les tickets
      </h1>
      <p
        style={{
          fontSize: "clamp(13px, 0.9vw, 17px)",
          color: "#8a887e",
          marginBottom: "clamp(20px, 1.6vw, 30px)",
        }}
      >
        Liste complète des tickets déclarés sur le réseau
      </p>

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
          placeholder='Rechercher une agence, un code, un titre...'
          value={recherche}
          onChange={(e) => definirFiltre("recherche", e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: "200px" }}
        />
        <select
          value={filtreEtat}
          onChange={(e) => definirFiltre("etat", e.target.value)}
          style={inputStyle}
        >
          <option value=''>Tous les états</option>
          <option value='ouvert'>Ouvert</option>
          <option value='en_cours'>En cours</option>
          <option value='resolu'>Résolu</option>
        </select>
        <select
          value={filtreType}
          onChange={(e) => definirFiltre("type", e.target.value)}
          style={inputStyle}
        >
          <option value=''>Tous les types</option>
          <option value='interne'>Interne</option>
          <option value='externe'>Externe</option>
        </select>
        <select
          value={filtrePriorite}
          onChange={(e) => definirFiltre("priorite", e.target.value)}
          style={inputStyle}
        >
          <option value=''>Toutes les priorités</option>
          <option value='normale'>Normale</option>
          <option value='haute'>Haute</option>
          <option value='urgente'>Urgente</option>
        </select>
        <input
          type='date'
          value={filtreDate}
          onChange={(e) => definirFiltre("date", e.target.value)}
          title='Filtrer par date de déclaration'
          style={inputStyle}
        />
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
                État
              </th>
              <th
                style={{
                  padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                }}
              >
                Traité par
              </th>
              <th
                onClick={() => definirFiltre("tri", tri === "asc" ? "desc" : "asc")}
                style={{
                  padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
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
            {incidentsPage.map((inc) => (
              <tr
                key={inc.id}
                onClick={() =>
                  navigate(`/incidents/${inc.id}`, {
                    state: {
                      from: searchParams.toString()
                        ? `/incidents?${searchParams.toString()}`
                        : "/incidents",
                    },
                  })
                }
                style={{
                  cursor: "pointer",
                  borderTop: "1px solid #eee",
                  fontSize: "clamp(13px, 0.9vw, 16px)",
                  color: "#2b2a26",
                }}
              >
                <td
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  {inc.nom_agence} ({inc.code_agence})
                </td>
                <td
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  {inc.titre}
                </td>
                <td
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  <Badge valeur={inc.type} />
                </td>
                <td
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  <Badge valeur={inc.priorite} />
                </td>
                <td
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  <Badge valeur={inc.etat} />
                </td>
                <td
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  {inc.nom_admin ? `${inc.prenom_admin} ${inc.nom_admin}` : "—"}
                </td>
                <td
                  style={{
                    padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)",
                  }}
                >
                  {new Date(inc.date_creation).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#8a887e",
                  }}
                >
                  Aucun ticket trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {!chargement && incidents.length > 0 && (
        <Pagination
          page={page}
          totalItems={incidents.length}
          pageSize={taillePage}
          onPageChange={changerPage}
          onPageSizeChange={setTaillePage}
        />
      )}
    </Layout>
  );
}

export default Incidents;
