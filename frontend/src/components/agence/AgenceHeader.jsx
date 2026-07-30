// Bandeau blanc pleine largeur (comme l'en-tete de Layout.jsx cote admin) : ancre visuellement
// le logo TELETRACK/BP en haut de la page, meme sur les tres grands ecrans ou le contenu
// (limite a 1800px) laisse beaucoup de vide gris autour.
function AgenceHeader() {
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #eee" }}>
      <div
        style={{
          maxWidth: "1800px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "clamp(12px, 1vw, 18px) clamp(32px, 4vw, 80px)",
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
    </div>
  );
}

export default AgenceHeader;
