import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import Layout from "../../components/admin/Layout";

// Origine du backend (sans le "/api" final), pour construire l'URL de la photo de profil
const origineApi = (import.meta.env.VITE_API_URL || "").replace(
  /\/api\/?$/,
  "",
);

function Profil({ user, onLogout, onUserUpdate }) {
  const inputPhotoRef = useRef(null);
  const [profil, setProfil] = useState(null);
  const [chargement, setChargement] = useState(true);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [enregistrementInfos, setEnregistrementInfos] = useState(false);
  const [messageInfos, setMessageInfos] = useState(null);

  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmationMdp, setConfirmationMdp] = useState("");
  const [enregistrementMdp, setEnregistrementMdp] = useState(false);
  const [messageMdp, setMessageMdp] = useState(null);

  const [envoiPhoto, setEnvoiPhoto] = useState(false);

  useEffect(() => {
    async function charger() {
      try {
        const res = await api.get("/auth/me");
        setProfil(res.data);
        setNom(res.data.nom || "");
        setPrenom(res.data.prenom || "");
        setEmail(res.data.email || "");
      } catch (error) {
        console.error("Erreur chargement profil :", error);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  // Met a jour le user stocke localement (localStorage + state de App.jsx), pour que
  // le nom/la photo affiches dans Layout.jsx changent immediatement, sans avoir a se reconnecter
  const appliquerNouvelUtilisateur = (utilisateurMisAJour) => {
    const fusion = { ...user, ...utilisateurMisAJour };
    localStorage.setItem("user", JSON.stringify(fusion));
    onUserUpdate(fusion);
  };

  const enregistrerInfos = async (e) => {
    e.preventDefault();
    setMessageInfos(null);
    setEnregistrementInfos(true);
    try {
      const res = await api.put("/auth/profil", { nom, prenom, email });
      setProfil(res.data.user);
      appliquerNouvelUtilisateur(res.data.user);
      setMessageInfos({ type: "ok", texte: "Profil mis à jour avec succès." });
    } catch (error) {
      setMessageInfos({
        type: "erreur",
        texte:
          error.response?.data?.message || "Erreur lors de la mise à jour.",
      });
    } finally {
      setEnregistrementInfos(false);
    }
  };

  const changerMotDePasse = async (e) => {
    e.preventDefault();
    setMessageMdp(null);

    if (nouveauMdp !== confirmationMdp) {
      setMessageMdp({
        type: "erreur",
        texte: "Les deux mots de passe ne correspondent pas.",
      });
      return;
    }
    if (nouveauMdp.length < 8) {
      setMessageMdp({
        type: "erreur",
        texte: "Le mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    setEnregistrementMdp(true);
    try {
      await api.put("/auth/change-password", {
        nouveau_mot_de_passe: nouveauMdp,
      });
      setNouveauMdp("");
      setConfirmationMdp("");
      setMessageMdp({ type: "ok", texte: "Mot de passe changé avec succès." });
    } catch (error) {
      setMessageMdp({
        type: "erreur",
        texte: error.response?.data?.message || "Erreur lors du changement.",
      });
    } finally {
      setEnregistrementMdp(false);
    }
  };

  const choisirPhoto = () => inputPhotoRef.current?.click();

  const envoyerPhoto = async (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;

    const formData = new FormData();
    formData.append("photo", fichier);

    setEnvoiPhoto(true);
    try {
      const res = await api.post("/auth/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfil((prev) => ({ ...prev, photo: res.data.photo }));
      appliquerNouvelUtilisateur({ photo: res.data.photo });
    } catch (error) {
      console.error("Erreur upload photo :", error);
      setMessageInfos({
        type: "erreur",
        texte:
          error.response?.data?.message ||
          "Erreur lors de l'envoi de la photo.",
      });
    } finally {
      setEnvoiPhoto(false);
      e.target.value = "";
    }
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: "10px",
    padding: "clamp(20px, 1.6vw, 30px)",
    border: "1px solid #eee",
    boxShadow: "0 4px 10px rgba(43,42,38,0.06)",
    marginBottom: "10px",
    maxWidth: "640px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "clamp(12px, 0.85vw, 14px)",
    fontWeight: 600,
    color: "#4a483f",
    marginBottom: "6px",
    marginTop: "16px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d9d7cc",
    borderRadius: "6px",
    fontSize: "clamp(13px, 0.9vw, 15px)",
    boxSizing: "border-box",
    fontFamily: "'Montserrat', sans-serif",
  };

  const inputLectureSeuleStyle = {
    ...inputStyle,
    background: "#f4f4f4",
    color: "#8a887e",
  };

  const boutonStyle = (desactive) => ({
    marginTop: "18px",
    padding: "clamp(10px, 0.85vw, 13px) clamp(20px, 1.6vw, 28px)",
    background: "#f77100",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "clamp(13px, 0.9vw, 15px)",
    fontWeight: 600,
    cursor: desactive ? "default" : "pointer",
    opacity: desactive ? 0.7 : 1,
    fontFamily: "'Montserrat', sans-serif",
  });

  const urlPhoto = profil?.photo
    ? `${origineApi}/uploads/avatars/${profil.photo}`
    : null;
  const initiales =
    `${(prenom || "").charAt(0)}${(nom || "").charAt(0)}`.toUpperCase();

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
        Mon profil
      </h1>
      <p
        style={{
          fontSize: "clamp(13px, 0.9vw, 17px)",
          color: "#8a887e",
          marginBottom: "clamp(20px, 1.6vw, 30px)",
        }}
      >
        Vos informations personnelles et votre mot de passe
      </p>

      {chargement ? (
        <p style={{ color: "#8a887e" }}>Chargement...</p>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            {/* Colonne gauche : avatar seul */}
            <div
              style={{
                flex: 1,
                minWidth: "300px",
                maxWidth: "380px",
              }}
            >
              {/* Avatar */}
              <div style={cardStyle}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "20px" }}
                >
                  <div
                    style={{
                      width: "clamp(70px, 5.5vw, 90px)",
                      height: "clamp(70px, 5.5vw, 90px)",
                      borderRadius: "50%",
                      background: "#f77100",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "clamp(24px, 1.8vw, 32px)",
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
                  <div>
                    <button
                      type='button'
                      onClick={choisirPhoto}
                      disabled={envoiPhoto}
                      style={{
                        padding: "10px 18px",
                        background: "#fff",
                        color: "#f77100",
                        border: "1.5px solid #f77100",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: envoiPhoto ? "default" : "pointer",
                        opacity: envoiPhoto ? 0.7 : 1,
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      {envoiPhoto ? "Envoi..." : "Changer la photo"}
                    </button>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#8a887e",
                        margin: "8px 0 0",
                      }}
                    >
                      JPEG, PNG ou WEBP — 2 Mo maximum.
                    </p>
                    <input
                      ref={inputPhotoRef}
                      type='file'
                      accept='image/jpeg,image/png,image/webp'
                      onChange={envoyerPhoto}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite : informations, puis mot de passe en dessous */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                flex: 2,
                minWidth: "320px",
              }}
            >
              <form
                onSubmit={enregistrerInfos}
                style={cardStyle}
              >
                <div
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    color: "#8a887e",
                    fontWeight: 600,
                  }}
                >
                  Informations
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginTop: "16px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={{ ...labelStyle, marginTop: 0 }}>
                      Matricule
                    </label>
                    <input
                      value={profil?.matricule || ""}
                      disabled
                      style={inputLectureSeuleStyle}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={{ ...labelStyle, marginTop: 0 }}>Rôle</label>
                    <input
                      value={
                        profil?.role === "superadmin" ? "Superadmin" : "Admin"
                      }
                      disabled
                      style={inputLectureSeuleStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={labelStyle}>Prénom</label>
                    <input
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={labelStyle}>Nom</label>
                    <input
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <label style={labelStyle}>Email</label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />

                {messageInfos && (
                  <p
                    style={{
                      color: messageInfos.type === "ok" ? "#1e7d34" : "#b91c1c",
                      fontSize: "13px",
                      marginTop: "12px",
                    }}
                  >
                    {messageInfos.texte}
                  </p>
                )}

                <button
                  type='submit'
                  disabled={enregistrementInfos}
                  style={boutonStyle(enregistrementInfos)}
                >
                  {enregistrementInfos ? "Enregistrement..." : "Enregistrer"}
                </button>
              </form>

              {/* Mot de passe */}
              <form
                onSubmit={changerMotDePasse}
                style={cardStyle}
              >
                <div
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    color: "#8a887e",
                    fontWeight: 600,
                  }}
                >
                  Mot de passe
                </div>

                <label style={labelStyle}>Nouveau mot de passe</label>
                <input
                  type='password'
                  value={nouveauMdp}
                  onChange={(e) => setNouveauMdp(e.target.value)}
                  style={inputStyle}
                />

                <label style={labelStyle}>Confirmer le mot de passe</label>
                <input
                  type='password'
                  value={confirmationMdp}
                  onChange={(e) => setConfirmationMdp(e.target.value)}
                  style={inputStyle}
                />

                {messageMdp && (
                  <p
                    style={{
                      color: messageMdp.type === "ok" ? "#1e7d34" : "#b91c1c",
                      fontSize: "13px",
                      marginTop: "12px",
                    }}
                  >
                    {messageMdp.texte}
                  </p>
                )}

                <button
                  type='submit'
                  disabled={enregistrementMdp}
                  style={boutonStyle(enregistrementMdp)}
                >
                  {enregistrementMdp
                    ? "Enregistrement..."
                    : "Changer le mot de passe"}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

export default Profil;
