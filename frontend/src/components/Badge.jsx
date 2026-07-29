const STYLES = {
  interne: { bg: "#e3e1d8", color: "#4b0700" },
  externe: { bg: "#fdece0", color: "#f77100" },
  normale: { bg: "#e3e1d8", color: "#6b6a60" },
  haute: { bg: "#fdece0", color: "#c25400" },
  urgente: { bg: "#fbe4e4", color: "#b91c1c" },
  ouvert: { bg: "#fbe4e4", color: "#b91c1c" },
  en_cours: { bg: "#fdece0", color: "#c25400" },
  resolu: { bg: "#e6f4ea", color: "#1e7d34" },
};

const LABELS = {
  interne: "Interne",
  externe: "Externe",
  normale: "Normale",
  haute: "Haute",
  urgente: "Urgente",
  ouvert: "Ouvert",
  en_cours: "En cours",
  resolu: "Résolu",
};

function Badge({ valeur }) {
  const style = STYLES[valeur] || { bg: "#f4f4f4", color: "#6b6a60" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 13px",
        borderRadius: "20px",
        fontSize: "clamp(11px, 0.8vw, 13px)",
        fontWeight: 600,
        background: style.bg,
        color: style.color,
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {LABELS[valeur] || valeur}
    </span>
  );
}

export default Badge;
