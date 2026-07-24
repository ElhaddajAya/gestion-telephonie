import { Link, useLocation } from "react-router-dom";
import { HiOutlineLogout } from "react-icons/hi";

function Layout({ children, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItemStyle = (active) => ({
    padding: "clamp(10px, 0.7vw, 14px) clamp(12px, 0.9vw, 18px)",
    borderRadius: "6px",
    fontSize: "clamp(13px, 0.85vw, 16px)",
    marginBottom: "6px",
    cursor: "pointer",
    color: "#fff",
    background: active ? "#f77100" : "transparent",
    fontWeight: active ? 600 : 400,
    textDecoration: "none",
    display: "block",
    fontFamily: "'Montserrat', sans-serif",
  });

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <div
        style={{
          width: "clamp(260px, 16vw, 320px)",
          background: "#4b0700",
          padding: "clamp(24px, 2vw, 40px) clamp(18px, 1.4vw, 28px)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "36px",
          }}
        >
          <div
            style={{
              color: "#f77100",
              fontWeight: 700,
              fontSize: "clamp(15px, 1vw, 19px)",
              letterSpacing: "0.01em",
              fontFamily: "'Syncopate', sans-serif",
            }}
          >
            TELETRACK
          </div>
          <img
            src='/logo_bp_small.jpg'
            alt='Banque Populaire'
            style={{
              height: "clamp(22px, 1.6vw, 28px)",
              width: "clamp(22px, 1.6vw, 28px)",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        </div>
        <Link
          to='/'
          style={navItemStyle(isActive("/"))}
        >
          Tableau de bord
        </Link>
        <Link
          to='/incidents'
          style={navItemStyle(isActive("/incidents"))}
        >
          Incidents
        </Link>
        <Link
          to='/agences'
          style={navItemStyle(isActive("/agences"))}
        >
          Agences
        </Link>
        <Link
          to='/profil'
          style={navItemStyle(isActive("/profil"))}
        >
          Mon profil
        </Link>
        <div
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "40px",
            padding: "clamp(10px, 0.7vw, 14px) clamp(12px, 0.9vw, 18px)",
            fontSize: "clamp(12px, 0.8vw, 15px)",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          <HiOutlineLogout size={16} />
          Se déconnecter
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: "clamp(28px, 3vw, 56px) clamp(32px, 4vw, 80px)",
          background: "#f4f4f4",
          minWidth: 0,
        }}
      >
        <div style={{ maxWidth: "1800px", margin: "0 auto" }}>{children}</div>
      </div>
    </div>
  );
}

export default Layout;
