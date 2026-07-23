import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  // On stocke le message reçu du backend dans une variable d'état
  const [message, setMessage] = useState("Connexion au serveur...");

  // useEffect s'exécute une fois, au chargement de la page
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/test")
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        setMessage("Erreur : impossible de contacter le serveur backend.");
        console.error(error);
      });
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Gestion Téléphonie — Test de connexion</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
