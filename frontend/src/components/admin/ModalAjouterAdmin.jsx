import { useState } from "react";
import api from "../../services/api";

function ModalAjouterAdmin({ ouvert, onFermer, onCree }) {
  const [form, setForm] = useState({
    matricule: "",
    prenom: "",
    nom: "",
    email: "",
    role: "admin",
  });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  if (!ouvert) return null;

  const champ = (label, cle, type = "text") => (
    <div style={{ marginBottom: "14px" }}>
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 600,
          color: "#4a483f",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={form[cle]}
        onChange={(e) => setForm({ ...form, [cle]: e.target.value })}
        style={{
          width: "100%",
          padding: "9px 12px",
          border: "1px solid #d9d7cc",
          borderRadius: "6px",
          fontSize: "13px",
          boxSizing: "border-box",
          fontFamily: "'Montserrat', sans-serif",
        }}
      />
    </div>
  );

  const creer = async () => {
    setEnvoi(true);
    setErreur("");
    try {
      const res = await api.post("/utilisateurs", form);
      onCree(res.data);
      setForm({ matricule: "", prenom: "", nom: "", email: "", role: "admin" });
    } catch (error) {
      setErreur(error.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div
      onClick={onFermer}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(43,42,38,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "12px",
          width: "clamp(380px, 28vw, 460px)",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "clamp(20px, 1.6vw, 28px)",
          boxShadow: "0 12px 32px rgba(43,42,38,0.18)",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#2b2a26",
            marginBottom: "18px",
          }}
        >
          Ajouter un admin
        </div>

        {champ("Matricule", "matricule")}
        {champ("Prénom", "prenom")}
        {champ("Nom", "nom")}
        {champ("Email", "email", "email")}

        <div style={{ marginBottom: "14px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "#4a483f",
              marginBottom: "6px",
            }}
          >
            Rôle
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1px solid #d9d7cc",
              borderRadius: "6px",
              fontSize: "13px",
              fontFamily: "'Montserrat', sans-serif",
              background: "#fff",
            }}
          >
            <option value='admin'>Admin</option>
            <option value='superadmin'>Superadmin</option>
          </select>
        </div>

        <p style={{ fontSize: "12px", color: "#8a887e", margin: "0 0 10px" }}>
          Un mot de passe temporaire sera généré automatiquement — l'admin devra le changer à sa
          première connexion.
        </p>

        {erreur && (
          <p style={{ color: "#b91c1c", fontSize: "13px", marginBottom: "10px" }}>
            {erreur}
          </p>
        )}

        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <button
            onClick={onFermer}
            style={{
              flex: 1,
              padding: "11px",
              background: "#f4f4f4",
              color: "#2b2a26",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Annuler
          </button>
          <button
            onClick={creer}
            disabled={envoi}
            style={{
              flex: 1,
              padding: "11px",
              background: "#f77100",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: envoi ? "default" : "pointer",
              opacity: envoi ? 0.7 : 1,
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            {envoi ? "Création..." : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalAjouterAdmin;
