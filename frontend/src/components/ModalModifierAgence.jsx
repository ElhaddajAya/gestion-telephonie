import { useState, useEffect } from "react";
import api from "../services/api";

function ModalModifierAgence({ agence, onFermer, onSauvegarde }) {
  const [form, setForm] = useState({
    nom: "",
    succursale: "",
    email: "",
    telephone: "",
    plateforme_telephonie: "",
  });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!agence) return;
    setForm({
      nom: agence.nom || "",
      succursale: agence.succursale || "",
      email: agence.email || "",
      telephone: agence.telephone || "",
      plateforme_telephonie: agence.plateforme_telephonie || "",
    });
    setErreur("");
  }, [agence]);

  if (!agence) return null;

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

  const sauvegarder = async () => {
    setEnvoi(true);
    setErreur("");
    try {
      await api.put(`/agences/${agence.code_agence}`, form);
      onSauvegarde();
    } catch (error) {
      setErreur(
        error.response?.data?.message || "Erreur lors de la mise à jour.",
      );
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
            marginBottom: "4px",
          }}
        >
          Modifier l'agence
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#8a887e",
            marginBottom: "18px",
          }}
        >
          {agence.nom} · {agence.code_agence}
        </div>

        {champ("Nom", "nom")}
        {champ("Succursale", "succursale")}
        {champ("Email", "email", "email")}
        {champ("Téléphone fixe", "telephone")}
        {champ("Plateforme téléphonique", "plateforme_telephonie")}

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
            onClick={sauvegarder}
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
            {envoi ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalModifierAgence;
