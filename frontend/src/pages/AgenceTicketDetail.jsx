import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import api from "../services/apiPublic";
import Badge from "../components/Badge";

function AgenceTicketDetail() {
  const { code, id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function charger() {
    try {
      const res = await api.get(`/espace-agence/${code}/tickets/${id}`);
      setIncident(res.data);
    } catch (error) {
      console.error("Erreur chargement ticket :", error);
      setErreur(true);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // rafraichissement automatique du fil de discussion, comme cote admin
    const intervalle = setInterval(charger, 5000);
    return () => clearInterval(intervalle);
  }, [code, id]);

  const envoyerCommentaire = async () => {
    if (!nouveauCommentaire.trim()) return;
    setEnvoi(true);
    try {
      await api.post(`/incidents/${id}/commentaires`, {
        contenu: nouveauCommentaire,
        code_agence: code,
      });
      setNouveauCommentaire("");
      charger();
    } catch (error) {
      console.error("Erreur ajout commentaire :", error);
    } finally {
      setEnvoi(false);
    }
  };

  const changerEtat = async (nouvelEtat) => {
    try {
      await api.put(`/espace-agence/${code}/tickets/${id}/etat`, {
        etat: nouvelEtat,
      });
      charger();
    } catch (error) {
      console.error("Erreur changement état :", error);
    }
  };

  const conteneurStyle = {
    minHeight: "100vh",
    background: "#f4f4f4",
    fontFamily: "'Montserrat', sans-serif",
    padding: "clamp(28px, 3vw, 56px) clamp(32px, 4vw, 80px)",
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: "10px",
    padding: "clamp(18px, 1.4vw, 26px)",
    border: "1px solid #eee",
    boxShadow: "0 4px 10px rgba(43,42,38,0.06)",
    marginBottom: "18px",
  };

  const labelStyle = {
    fontSize: "12px",
    textTransform: "uppercase",
    color: "#8a887e",
    fontWeight: 600,
    marginBottom: "12px",
  };

  if (chargement) {
    return (
      <div style={conteneurStyle}>
        <p style={{ color: "#8a887e" }}>Chargement...</p>
      </div>
    );
  }

  if (erreur || !incident) {
    return (
      <div style={conteneurStyle}>
        <p style={{ color: "#b91c1c" }}>
          Ticket introuvable, ou n'appartenant pas à cette agence.
        </p>
      </div>
    );
  }

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
          onClick={() => navigate(`/agence/${code}/tickets`)}
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
          Retour à mes tickets · #{incident.id}
        </div>

        <h1
          style={{
            fontSize: "clamp(20px, 1.4vw, 32px)",
            color: "#2b2a26",
            margin: "0 0 12px",
            fontWeight: 600,
          }}
        >
          {incident.titre}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "22px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <Badge valeur={incident.type} />
            <Badge valeur={incident.priorite} />
            <Badge valeur={incident.etat} />
          </div>
          {incident.etat === "resolu" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {incident.date_resolution && (
                <span style={{ fontSize: "13px", color: "#1e7d34" }}>
                  Résolu le{" "}
                  {new Date(incident.date_resolution).toLocaleDateString("fr-FR")}
                </span>
              )}
              <button
                onClick={() => changerEtat("ouvert")}
                style={{
                  padding: "10px 18px",
                  background: "#fff",
                  color: "#f77100",
                  border: "1.5px solid #f77100",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                Rouvrir ce ticket
              </button>
            </div>
          ) : (
            <button
              onClick={() => changerEtat("resolu")}
              style={{
                padding: "10px 18px",
                background: "#1e7d34",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Marquer comme résolu
            </button>
          )}
        </div>

        {/* Description */}
        <div style={cardStyle}>
          <div style={labelStyle}>Description</div>
          <p
            style={{
              fontSize: "clamp(13px, 0.9vw, 15px)",
              color: "#2b2a26",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {incident.description || "Aucune description fournie."}
          </p>
        </div>

        {/* Fil de discussion */}
        <div style={cardStyle}>
          <div style={labelStyle}>Fil de discussion</div>
          <div
            style={{
              maxHeight: "clamp(280px, 40vh, 520px)",
              overflowY: "auto",
              overflowX: "hidden",
              padding: "0 12px",
              margin: "0 -12px",
            }}
          >
            {incident.commentaires.length === 0 && (
              <p style={{ color: "#8a887e", fontSize: "13px" }}>
                Aucun commentaire pour l'instant.
              </p>
            )}
            {incident.commentaires.map((c) => {
              // Vue cote agence : nos propres messages sont "sortants" (a droite),
              // ceux de l'admin sont "entrants" (a gauche) — inverse de la vue admin
              const estNotreMessage = !!c.auteur_agence_code;
              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: estNotreMessage ? "flex-end" : "flex-start",
                    marginBottom: "22px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#8a887e",
                      marginBottom: "8px",
                    }}
                  >
                    <b style={{ color: "#4b0700" }}>
                      {estNotreMessage
                        ? `Vous — ${c.nom_agence_auteur}`
                        : `Admin — ${c.prenom_admin} ${c.nom_admin}`}
                    </b>{" "}
                    · {new Date(c.date_creation).toLocaleString("fr-FR")}
                  </div>
                  <div
                    className={`chat-bubble ${estNotreMessage ? "chat-bubble-out" : "chat-bubble-in"}`}
                    style={{
                      fontSize: "13px",
                      maxWidth: "75%",
                      background: estNotreMessage ? "#fdeade" : "#f4f4f4",
                      color: "#2b2a26",
                      padding: "10px 12px",
                      borderRadius: estNotreMessage
                        ? "12px 12px 0 12px"
                        : "12px 12px 12px 0",
                    }}
                  >
                    {c.contenu}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <textarea
              rows={3}
              placeholder='Écrire un commentaire...'
              value={nouveauCommentaire}
              onChange={(e) => setNouveauCommentaire(e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #d9d7cc",
                borderRadius: "6px",
                fontFamily: "inherit",
                fontSize: "13px",
                resize: "none",
              }}
            />
            <button
              onClick={envoyerCommentaire}
              disabled={envoi}
              style={{
                background: "#f77100",
                color: "#fff",
                border: "none",
                height: "40px",
                borderRadius: "6px",
                padding: "0 20px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: envoi ? "default" : "pointer",
                opacity: envoi ? 0.7 : 1,
              }}
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgenceTicketDetail;
