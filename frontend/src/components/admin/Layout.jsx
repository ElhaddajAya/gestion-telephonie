import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HiOutlineLogout, HiOutlineBell } from "react-icons/hi";
import api from "../../services/api";

function Layout({ user, children, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [nouveaux, setNouveaux] = useState([]);
  const [nouveauxMessages, setNouveauxMessages] = useState([]);
  const [ouvertBell, setOuvertBell] = useState(false);

  const initiales = user
    ? `${(user.prenom || "").charAt(0)}${(user.nom || "").charAt(0)}`.toUpperCase()
    : "";

  // Origine du backend (sans le "/api" final), pour construire l'URL des photos de profil
  const origineApi = (import.meta.env.VITE_API_URL || "").replace(
    /\/api\/?$/,
    "",
  );
  const urlPhoto = user?.photo
    ? `${origineApi}/uploads/avatars/${user.photo}`
    : null;

  useEffect(() => {
    async function chargerAlertes() {
      try {
        const [ticketsRes, messagesRes] = await Promise.all([
          api.get("/incidents", { params: { etat: "ouvert" } }),
          api.get("/incidents/commentaires-recents"),
        ]);
        setNouveaux(ticketsRes.data);
        setNouveauxMessages(messagesRes.data);
      } catch (error) {
        console.error("Erreur chargement alertes :", error);
      }
    }
    chargerAlertes();
    // on rafraichit periodiquement pour un effet "temps reel"
    const intervalle = setInterval(chargerAlertes, 15000);
    return () => clearInterval(intervalle);
  }, [location.pathname]); // on rafraichit le badge a chaque changement de page

  // Sur une page de detail (/incidents/12), l'URL seule ne dit pas si on vient de
  // "Tous les tickets" ou "Mes tickets" : on utilise l'info transmise par navigate(..., { state })
  // pour savoir quel lien de la sidebar doit rester actif (orange).
  const cheminEffectif = location.pathname.startsWith("/incidents/")
    ? location.state?.from || "/incidents"
    : location.pathname;

  const isActive = (path) =>
    path === "/" ? cheminEffectif === "/" : cheminEffectif.startsWith(path);

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
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            color: "#f77100",
            fontWeight: 700,
            fontSize: "clamp(25px, 1vw, 32px)",
            letterSpacing: "0.01em",
            textAlign: "center",
            fontFamily: "'Syncopate', sans-serif",
            marginBottom: "40px",
          }}
        >
          TELETRACK
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
          Tous les tickets
        </Link>
        <Link
          to='/mes-tickets'
          style={navItemStyle(isActive("/mes-tickets"))}
        >
          Mes tickets
        </Link>
        <Link
          to='/agences'
          style={navItemStyle(isActive("/agences"))}
        >
          Agences
        </Link>
        {user?.role === "superadmin" && (
          <Link
            to='/comptes-admin'
            style={navItemStyle(isActive("/comptes-admin"))}
          >
            Comptes utilisateurs
          </Link>
        )}
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
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Header fixe : avatar, cloche de notification, bienvenue */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fff",
            borderBottom: "1px solid #eee",
            padding: "clamp(12px, 1vw, 18px) clamp(32px, 4vw, 80px)",
          }}
        >
          <img
            src='/logo_bp.png'
            alt='Banque Populaire'
            style={{ height: "clamp(44px, 3.3vw, 58px)" }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(16px, 1.2vw, 24px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(14px, 0.98vw, 16px)",
                  color: "#2b2a26",
                  fontFamily: "'Montserrat', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Bienvenue,{" "}
                <strong>
                  {user?.prenom} {user?.nom}
                </strong>
                {user?.role === "superadmin" && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#4b0700",
                      background: "#f4f4f4",
                      padding: "3px 9px",
                      borderRadius: "10px",
                      textTransform: "uppercase",
                    }}
                  >
                    Superadmin
                  </span>
                )}
              </div>
              <div
                style={{
                  width: "clamp(37px, 2.6vw, 44px)",
                  height: "clamp(37px, 2.6vw, 44px)",
                  borderRadius: "50%",
                  background: "#f77100",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "clamp(14px, 0.98vw, 16px)",
                  fontFamily: "'Montserrat', sans-serif",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {urlPhoto ? (
                  <img
                    src={urlPhoto}
                    alt='Photo de profil'
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  initiales
                )}
              </div>
            </div>

            <div
              onClick={() => setOuvertBell(!ouvertBell)}
              style={{
                position: "relative",
                cursor: "pointer",
                background: "#f4f4f4",
                borderRadius: "10px",
                padding: "clamp(10px, 0.78vw, 13px)",
              }}
            >
              <HiOutlineBell
                size={22}
                color='#4b0700'
              />
              {nouveaux.length + nouveauxMessages.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#f77100",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "50%",
                    width: "17px",
                    height: "17px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {nouveaux.length + nouveauxMessages.length}
                </span>
              )}

              {ouvertBell && (
                <div
                  style={{
                    position: "absolute",
                    top: "44px",
                    right: 0,
                    width: "320px",
                    maxHeight: "70vh",
                    overflowY: "auto",
                    background: "#fff",
                    borderRadius: "10px",
                    border: "1px solid #eee",
                    boxShadow: "0 8px 24px rgba(43,42,38,0.12)",
                    padding: "10px 0",
                    zIndex: 20,
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#8a887e",
                      textTransform: "uppercase",
                      padding: "4px 16px 8px",
                    }}
                  >
                    Nouveaux tickets
                  </div>
                  {nouveaux.length === 0 && (
                    <div
                      style={{
                        padding: "10px 16px",
                        fontSize: "13px",
                        color: "#8a887e",
                      }}
                    >
                      Aucun nouveau ticket.
                    </div>
                  )}
                  {nouveaux.slice(0, 5).map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => {
                        setOuvertBell(false);
                        navigate(`/incidents/${inc.id}`, {
                          state: { from: "/incidents" },
                        });
                      }}
                      style={{
                        padding: "8px 16px",
                        fontSize: "13px",
                        borderTop: "1px solid #f3f4f6",
                        cursor: "pointer",
                        color: "#2b2a26",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <b style={{ color: "#4b0700" }}>{inc.nom_agence}</b> —{" "}
                      {inc.titre}
                    </div>
                  ))}
                  {nouveaux.length > 0 && (
                    <div
                      onClick={() => {
                        setOuvertBell(false);
                        navigate("/incidents");
                      }}
                      style={{
                        textAlign: "center",
                        padding: "10px 16px 2px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#f77100",
                        cursor: "pointer",
                      }}
                    >
                      Voir tous les tickets
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#8a887e",
                      textTransform: "uppercase",
                      padding: "12px 16px 8px",
                      borderTop: "1px solid #f3f4f6",
                      marginTop: "8px",
                    }}
                  >
                    Nouveaux messages
                  </div>
                  {nouveauxMessages.length === 0 && (
                    <div
                      style={{
                        padding: "10px 16px",
                        fontSize: "13px",
                        color: "#8a887e",
                      }}
                    >
                      Aucun nouveau message.
                    </div>
                  )}
                  {nouveauxMessages.slice(0, 5).map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => {
                        setOuvertBell(false);
                        setNouveauxMessages((prev) =>
                          prev.filter((m) => m.id !== msg.id),
                        );
                        navigate(`/incidents/${msg.incident_id}`, {
                          state: { from: "/mes-tickets" },
                        });
                      }}
                      style={{
                        padding: "8px 16px",
                        fontSize: "13px",
                        borderTop: "1px solid #f3f4f6",
                        cursor: "pointer",
                        color: "#2b2a26",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <b style={{ color: "#4b0700" }}>{msg.nom_agence}</b> —{" "}
                      {msg.contenu}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenu de la page */}
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
    </div>
  );
}

export default Layout;
