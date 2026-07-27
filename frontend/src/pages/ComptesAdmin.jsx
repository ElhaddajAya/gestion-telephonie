import { useState, useEffect } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import ModalAjouterAdmin from "../components/ModalAjouterAdmin";
import ModalModifierAdmin from "../components/ModalModifierAdmin";

function ComptesAdmin({ user, onLogout }) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);

  const [modalAjoutOuvert, setModalAjoutOuvert] = useState(false);
  const [adminAModifier, setAdminAModifier] = useState(null);
  const [motDePasseAffiche, setMotDePasseAffiche] = useState(null);

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

  useEffect(() => {
    charger();
  }, [recherche]);

  const changerStatut = async (admin) => {
    const action = admin.actif ? "désactiver" : "réactiver";
    if (!window.confirm(`Confirmer : ${action} le compte de ${admin.prenom} ${admin.nom} ?`)) {
      return;
    }
    try {
      await api.put(`/utilisateurs/${admin.id}/statut`, { actif: !admin.actif });
      charger();
    } catch (error) {
      alert(error.response?.data?.message || "Erreur lors du changement de statut.");
    }
  };

  const reinitialiserMotDePasse = async (admin) => {
    if (
      !window.confirm(
        `Générer un nouveau mot de passe temporaire pour ${admin.prenom} ${admin.nom} ?`,
      )
    ) {
      return;
    }
    try {
      const res = await api.put(`/utilisateurs/${admin.id}/reinitialiser-mot-de-passe`);
      setMotDePasseAffiche({
        nom: `${admin.prenom} ${admin.nom}`,
        motDePasse: res.data.mot_de_passe_temporaire,
      });
    } catch (error) {
      alert(error.response?.data?.message || "Erreur lors de la réinitialisation.");
    }
  };

  const inputStyle = {
    padding: "clamp(8px, 0.6vw, 11px) clamp(10px, 0.8vw, 14px)",
    border: "1px solid #d9d7cc",
    borderRadius: "6px",
    fontSize: "clamp(13px, 0.85vw, 15px)",
    fontFamily: "'Montserrat', sans-serif",
    background: "#fff",
  };

  const actionLinkStyle = {
    fontSize: "12px",
    color: "#f77100",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    marginRight: "16px",
  };

  return (
    <Layout
      user={user}
      onLogout={onLogout}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "clamp(20px, 1.6vw, 30px)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
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
          <p style={{ fontSize: "clamp(13px, 0.9vw, 17px)", color: "#8a887e", margin: 0 }}>
            Personnel du siège ayant accès à la plateforme
          </p>
        </div>
        <button
          onClick={() => setModalAjoutOuvert(true)}
          style={{
            padding: "clamp(10px, 0.85vw, 13px) clamp(20px, 1.6vw, 26px)",
            background: "#f77100",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "clamp(13px, 0.9vw, 15px)",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Montserrat', sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          + Ajouter un admin
        </button>
      </div>

      {motDePasseAffiche && (
        <div
          style={{
            background: "#fdeade",
            border: "1px solid #f7a35c",
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#4a483f",
          }}
        >
          <b>Mot de passe temporaire pour {motDePasseAffiche.nom} :</b>{" "}
          <span style={{ fontFamily: "monospace", fontSize: "14px" }}>
            {motDePasseAffiche.motDePasse}
          </span>
          <div style={{ marginTop: "6px", color: "#8a887e" }}>
            Communiquez-le à l'admin — il ne sera plus affiché ensuite.{" "}
            <span
              onClick={() => setMotDePasseAffiche(null)}
              style={{ textDecoration: "underline", cursor: "pointer" }}
            >
              Fermer
            </span>
          </div>
        </div>
      )}

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
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>Nom</th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Matricule
              </th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>Rôle</th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Statut
              </th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Actions
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
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: u.actif ? "#1e7d34" : "#b91c1c",
                      background: u.actif ? "#e6f4ea" : "#fbe4e4",
                      padding: "3px 10px",
                      borderRadius: "10px",
                    }}
                  >
                    {u.actif ? "Actif" : "Désactivé"}
                  </span>
                </td>
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  <span
                    onClick={() => reinitialiserMotDePasse(u)}
                    style={actionLinkStyle}
                  >
                    ⟳ Réinitialiser mdp
                  </span>
                  <span
                    onClick={() => setAdminAModifier(u)}
                    style={actionLinkStyle}
                  >
                    ✎ Modifier
                  </span>
                  {u.id !== user.id && (
                    <span
                      onClick={() => changerStatut(u)}
                      style={{ ...actionLinkStyle, color: u.actif ? "#b91c1c" : "#1e7d34" }}
                    >
                      {u.actif ? "✕ Désactiver" : "✓ Réactiver"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {utilisateurs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{ padding: "20px", textAlign: "center", color: "#8a887e" }}
                >
                  Aucun compte trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <ModalAjouterAdmin
        ouvert={modalAjoutOuvert}
        onFermer={() => setModalAjoutOuvert(false)}
        onCree={(res) => {
          setModalAjoutOuvert(false);
          setMotDePasseAffiche({
            nom: `${res.utilisateur.prenom} ${res.utilisateur.nom}`,
            motDePasse: res.mot_de_passe_temporaire,
          });
          charger();
        }}
      />

      <ModalModifierAdmin
        admin={adminAModifier}
        utilisateurConnecteId={user.id}
        onFermer={() => setAdminAModifier(null)}
        onSauvegarde={() => {
          setAdminAModifier(null);
          charger();
        }}
      />
    </Layout>
  );
}

export default ComptesAdmin;
