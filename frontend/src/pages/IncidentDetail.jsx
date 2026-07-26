import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { HiOutlineArrowLeft } from "react-icons/hi";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import ModalReassigner from "../components/ModalReassigner";
import { marquerVisite } from "../services/notifications";

function IncidentDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [chargement, setChargement] = useState(true);
  const [modalReassignerOuvert, setModalReassignerOuvert] = useState(false);

  async function charger() {
    try {
      const res = await api.get(`/incidents/${id}`);
      setIncident(res.data);
      marquerVisite(id);
    } catch (error) {
      console.error("Erreur chargement incident :", error);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // rafraichissement automatique du fil de discussion (effet "temps reel")
    const intervalle = setInterval(charger, 5000);
    return () => clearInterval(intervalle);
  }, [id]);

  const changerEtat = async (nouvelEtat) => {
    try {
      await api.put(`/incidents/${id}/etat`, { etat: nouvelEtat });
      charger();
    } catch (error) {
      console.error("Erreur changement état :", error);
    }
  };

  const sAssigner = async () => {
    try {
      await api.put(`/incidents/${id}/assigner`, {});
      charger();
    } catch (error) {
      console.error("Erreur assignation :", error);
    }
  };

  const modifierPlateforme = async () => {
    const nouvelle = prompt(
      "Modifier la plateforme téléphonique :",
      incident.plateforme_telephonie || "",
    );
    if (!nouvelle) return;
    try {
      await api.put(`/agences/${incident.code_agence}`, {
        plateforme_telephonie: nouvelle,
      });
      charger();
    } catch (error) {
      console.error("Erreur modification plateforme :", error);
    }
  };

  const reassigner = async (admin) => {
    try {
      await api.put(`/incidents/${id}/assigner`, { admin_id: admin.id });
      setModalReassignerOuvert(false);
      charger();
    } catch (error) {
      console.error("Erreur réassignation :", error);
    }
  };

  const envoyerCommentaire = async () => {
    if (!nouveauCommentaire.trim()) return;
    try {
      await api.post(`/incidents/${id}/commentaires`, {
        contenu: nouveauCommentaire,
      });
      setNouveauCommentaire("");
      charger();
    } catch (error) {
      console.error("Erreur ajout commentaire :", error);
    }
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
  const infoLine = {
    display: "flex",
    justifyContent: "space-between",
    padding: "9px 0",
    borderTop: "1px solid #f3f4f6",
    fontSize: "clamp(13px, 0.9vw, 15px)",
  };

  if (chargement)
    return (
      <Layout
        user={user}
        onLogout={onLogout}
      >
        <p style={{ color: "#8a887e" }}>Chargement...</p>
      </Layout>
    );
  if (!incident)
    return (
      <Layout
        user={user}
        onLogout={onLogout}
      >
        <p>Ticket introuvable.</p>
      </Layout>
    );

  return (
    <Layout
      user={user}
      onLogout={onLogout}
    >
      <div
        onClick={() => navigate("/incidents")}
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
        Retour aux tickets · #{incident.id}
      </div>
      <h1
        style={{
          fontSize: "clamp(20px, 1.4vw, 30px)",
          color: "#2b2a26",
          margin: "0 0 12px",
          fontWeight: 600,
        }}
      >
        {incident.titre}
      </h1>
      <div style={{ display: "flex", gap: "8px", marginBottom: "22px" }}>
        <Badge valeur={incident.type} />
        <Badge valeur={incident.priorite} />
        <Badge valeur={incident.etat} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div>
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
                const estAgence = !!c.auteur_agence_code;
                return (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: estAgence ? "flex-start" : "flex-end",
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
                        {estAgence
                          ? `Agence — ${c.nom_agence_auteur}`
                          : `Admin — ${c.prenom_admin} ${c.nom_admin}`}
                      </b>{" "}
                      · {new Date(c.date_creation).toLocaleString("fr-FR")}
                    </div>
                    <div
                      className={`chat-bubble ${estAgence ? "chat-bubble-in" : "chat-bubble-out"}`}
                      style={{
                        fontSize: "13px",
                        maxWidth: "75%",
                        background: estAgence ? "#f4f4f4" : "#fdeade",
                        color: "#2b2a26",
                        padding: "10px 12px",
                        borderRadius: estAgence
                          ? "12px 12px 12px 0"
                          : "12px 12px 0 12px",
                      }}
                    >
                      {c.contenu}
                    </div>
                  </div>
                );
              })}
            </div>

            {incident.traite_par === user?.id ? (
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
                  style={{
                    background: "#f77100",
                    color: "#fff",
                    border: "none",
                    height: "40px",
                    borderRadius: "6px",
                    padding: "0 20px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Envoyer
                </button>
              </div>
            ) : (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px 16px",
                  background: "#f4f4f4",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#8a887e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                {incident.nom_admin ? (
                  <span>
                    Ce ticket est assigné à{" "}
                    <b style={{ color: "#2b2a26" }}>
                      {incident.prenom_admin} {incident.nom_admin}
                    </b>
                    , seul cet admin peut répondre.
                  </span>
                ) : (
                  <>
                    <span>Assignez-vous ce ticket pour pouvoir répondre.</span>
                    <span
                      onClick={sAssigner}
                      style={{
                        color: "#f77100",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      S'assigner à moi
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* agence */}
        <div>
          <div style={cardStyle}>
            <div style={labelStyle}>Agence</div>
            <div style={infoLine}>
              <span>Nom</span>
              <b>{incident.nom_agence}</b>
            </div>
            <div style={infoLine}>
              <span>Code</span>
              <b>{incident.code_agence}</b>
            </div>
            <div style={infoLine}>
              <span>Succursale</span>
              <b>{incident.succursale}</b>
            </div>
            <div style={infoLine}>
              <span>Téléphone fixe</span>
              <b>{incident.telephone || "—"}</b>
            </div>
            <div style={infoLine}>
              <span>Email agence</span>
              <b>{incident.email_agence || "—"}</b>
            </div>
            <div style={infoLine}>
              <span>Plateforme</span>
              <span
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <b>{incident.plateforme_telephonie || "—"}</b>
                <span
                  onClick={modifierPlateforme}
                  style={{
                    color: "#f77100",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ✎ Modifier
                </span>
              </span>
            </div>
          </div>

          {/* admin */}
          <div style={cardStyle}>
            <div style={labelStyle}>Traitement</div>
            <div style={infoLine}>
              <span>Assigné à</span>
              {incident.nom_admin ? (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <b>
                    {incident.prenom_admin} {incident.nom_admin}
                  </b>
                  <span
                    onClick={() => setModalReassignerOuvert(true)}
                    style={{
                      color: "#f77100",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    ⇄ Réassigner
                  </span>
                </span>
              ) : (
                <span
                  onClick={sAssigner}
                  style={{
                    color: "#f77100",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  S'assigner à moi
                </span>
              )}
            </div>
            <div style={infoLine}>
              <span>Déclaré le</span>
              <b>
                {new Date(incident.date_creation).toLocaleDateString("fr-FR")}
              </b>
            </div>

            <label
              style={{
                fontSize: "14px",
                color: "#8a887e",
                display: "block",
                marginTop: "14px",
                marginBottom: "6px",
              }}
            >
              Changer l'état
            </label>
            <select
              value={incident.etat}
              onChange={(e) => changerEtat(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #d9d7cc",
                fontSize: "13px",
              }}
            >
              <option value='ouvert'>Ouvert</option>
              <option value='en_cours'>En cours</option>
              <option value='resolu'>Résolu</option>
            </select>
          </div>
        </div>
      </div>

      <ModalReassigner
        ouvert={modalReassignerOuvert}
        onFermer={() => setModalReassignerOuvert(false)}
        onSelectionner={reassigner}
      />
    </Layout>
  );
}

export default IncidentDetail;
