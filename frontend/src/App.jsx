import { useState, useEffect } from "react";
import Login from "./pages/Login";

function App() {
  const [user, setUser] = useState(null);
  const [chargement, setChargement] = useState(true);

  // Au chargement de l'app, on verifie si un utilisateur est deja stocke localement
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setChargement(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Le temps qu'on verifie le localStorage, on evite d'afficher le login par erreur
  if (chargement) {
    return null;
  }

  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>
        Connecté ! Bienvenue {user.prenom} {user.nom}
      </h1>
      <button onClick={handleLogout}>Se déconnecter</button>
    </div>
  );
}

export default App;
