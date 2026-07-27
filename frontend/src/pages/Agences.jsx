import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ModalModifierAgence from "../components/ModalModifierAgence";

function Agences({ user, onLogout }) {
  const [agences, setAgences] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreSuccursale, setFiltreSuccursale] = useState("");
  const [filtrePlateforme, setFiltrePlateforme] = useState("");
  const [page, setPage] = useState(1);
  const [taillePage, setTaillePage] = useState(10);
  const [agenceEnEdition, setAgenceEnEdition] = useState(null);
  const [exportEnCours, setExportEnCours] = useState(false);
  const [importEnCours, setImportEnCours] = useState(false);
  const [resultatImport, setResultatImport] = useState(null);
  const inputFichierRef = useRef(null);

  async function charger() {
    setChargement(true);
    try {
      const res = await api.get("/agences", {
        params: {
          recherche: recherche || undefined,
          succursale: filtreSuccursale || undefined,
          plateforme: filtrePlateforme || undefined,
        },
      });
      setAgences(res.data);
      setPage(1);
    } catch (error) {
      console.error("Erreur chargement agences :", error);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
  }, [recherche, filtreSuccursale, filtrePlateforme]);

  const succursales = [...new Set(agences.map((a) => a.succursale).filter(Boolean))].sort();
  const plateformes = [...new Set(agences.map((a) => a.plateforme_telephonie).filter(Boolean))].sort();

  const agencesPage = agences.slice((page - 1) * taillePage, page * taillePage);

  const telechargerFichier = (data, nomFichier) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nomFichier;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    window.URL.revokeObjectURL(url);
  };

  const exporter = async () => {
    setExportEnCours(true);
    try {
      const res = await api.get("/agences/export", {
        params: {
          recherche: recherche || undefined,
          succursale: filtreSuccursale || undefined,
          plateforme: filtrePlateforme || undefined,
        },
        responseType: "blob",
      });
      telechargerFichier(res.data, "agences.xlsx");
    } catch (error) {
      console.error("Erreur export agences :", error);
    } finally {
      setExportEnCours(false);
    }
  };

  const telechargerModele = async () => {
    try {
      const res = await api.get("/agences/modele-import", {
        responseType: "blob",
      });
      telechargerFichier(res.data, "modele_import_agences.xlsx");
    } catch (error) {
      console.error("Erreur téléchargement modèle :", error);
    }
  };

  const importerFichier = async (e) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;

    setImportEnCours(true);
    setResultatImport(null);
    try {
      const formData = new FormData();
      formData.append("fichier", fichier);
      const res = await api.post("/agences/import", formData);
      setResultatImport(res.data);
      charger();
    } catch (error) {
      setResultatImport({
        message: error.response?.data?.message || "Erreur lors de l'import.",
      });
    } finally {
      setImportEnCours(false);
      if (inputFichierRef.current) inputFichierRef.current.value = "";
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

  const btnStyle = (rempli) => ({
    padding: "clamp(9px, 0.7vw, 12px) clamp(14px, 1vw, 18px)",
    borderRadius: "6px",
    fontSize: "clamp(13px, 0.85vw, 15px)",
    fontWeight: 600,
    fontFamily: "'Montserrat', sans-serif",
    cursor: "pointer",
    border: rempli ? "none" : "1.5px solid #f77100",
    background: rempli ? "#f77100" : "#fff",
    color: rempli ? "#fff" : "#f77100",
  });

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
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "6px",
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
            Agences
          </h1>
          <p
            style={{
              fontSize: "clamp(13px, 0.9vw, 17px)",
              color: "#8a887e",
              margin: 0,
            }}
          >
            {agences.length} agences · réseau Banque Populaire Rabat-Kénitra
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={exporter}
              disabled={exportEnCours}
              style={btnStyle(false)}
            >
              {exportEnCours ? "Export..." : "⭳ Exporter en Excel"}
            </button>
            <button
              onClick={() => inputFichierRef.current?.click()}
              disabled={importEnCours}
              style={btnStyle(true)}
            >
              {importEnCours ? "Import..." : "⭱ Importer un fichier Excel"}
            </button>
            <input
              ref={inputFichierRef}
              type='file'
              accept='.xlsx,.xls'
              onChange={importerFichier}
              style={{ display: "none" }}
            />
          </div>
          <span
            onClick={telechargerModele}
            style={{
              color: "#f77100",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            ⭳ Voir le modèle d'import
          </span>
        </div>
      </div>

      {resultatImport && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: "8px",
            padding: "14px 16px",
            marginTop: "16px",
            fontSize: "13px",
            color: "#2b2a26",
          }}
        >
          {resultatImport.agences_creees !== undefined ? (
            <>
              Import terminé : <b>{resultatImport.agences_creees}</b> créée(s),{" "}
              <b>{resultatImport.agences_mises_a_jour}</b> mise(s) à jour.
              {resultatImport.erreurs?.length > 0 && (
                <ul style={{ margin: "8px 0 0", paddingLeft: "18px", color: "#8a887e" }}>
                  {resultatImport.erreurs.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <span style={{ color: "#b91c1c" }}>{resultatImport.message}</span>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "10px",
          margin: "20px 0",
          flexWrap: "wrap",
        }}
      >
        <input
          type='text'
          placeholder='Rechercher une agence, un code...'
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: "200px" }}
        />
        <select
          value={filtreSuccursale}
          onChange={(e) => setFiltreSuccursale(e.target.value)}
          style={inputStyle}
        >
          <option value=''>Toutes les succursales</option>
          {succursales.map((s) => (
            <option
              key={s}
              value={s}
            >
              {s}
            </option>
          ))}
        </select>
        <select
          value={filtrePlateforme}
          onChange={(e) => setFiltrePlateforme(e.target.value)}
          style={inputStyle}
        >
          <option value=''>Toutes les plateformes</option>
          {plateformes.map((p) => (
            <option
              key={p}
              value={p}
            >
              {p}
            </option>
          ))}
        </select>
      </div>

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
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Code
              </th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Nom
              </th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Succursale
              </th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Téléphone fixe
              </th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Email agence
              </th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                Plateforme
              </th>
              <th style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }} />
            </tr>
          </thead>
          <tbody>
            {agencesPage.map((a) => (
              <tr
                key={a.code_agence}
                style={{
                  borderTop: "1px solid #eee",
                  fontSize: "clamp(13px, 0.9vw, 16px)",
                  color: "#2b2a26",
                }}
              >
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  {a.code_agence}
                </td>
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  {a.nom}
                </td>
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  {a.succursale || "—"}
                </td>
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  {a.telephone || "—"}
                </td>
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)", fontSize: "12px" }}>
                  {a.email || "—"}
                </td>
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  {a.plateforme_telephonie || "—"}
                </td>
                <td style={{ padding: "clamp(12px, 1vw, 18px) clamp(16px, 1.2vw, 22px)" }}>
                  <span
                    onClick={() => setAgenceEnEdition(a)}
                    style={{
                      color: "#f77100",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✎ Modifier
                  </span>
                </td>
              </tr>
            ))}
            {agences.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: "20px", textAlign: "center", color: "#8a887e" }}
                >
                  Aucune agence trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {!chargement && agences.length > 0 && (
        <Pagination
          page={page}
          totalItems={agences.length}
          pageSize={taillePage}
          onPageChange={setPage}
          onPageSizeChange={setTaillePage}
        />
      )}

      <ModalModifierAgence
        agence={agenceEnEdition}
        onFermer={() => setAgenceEnEdition(null)}
        onSauvegarde={() => {
          setAgenceEnEdition(null);
          charger();
        }}
      />
    </Layout>
  );
}

export default Agences;
