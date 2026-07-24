import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";

// Dashboard component temporaire pour tester la navigation après le login
function Dashboard({ user, onLogout }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <h1>
        Bienvenue, {user.nom} {user.prenom}!
      </h1>
      <p>Votre rôle : {user.role}</p>
      <button
        onClick={onLogout}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#f77100",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Déconnexion
      </button>
    </div>
  );
}

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [chargement, setChargement] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setChargement(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.doit_changer_mot_de_passe) {
      navigate("/changer-mot-de-passe", { replace: true });
    } else {
      navigate("/", { replace: true }); // replace: true -> impossible de revenir sur la page de login avec le bouton <--
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // replace: true -> impossible de revenir sur le dashboard avec le bouton "precedent"
    navigate("/login", { replace: true });
  };

  if (chargement) return null;

  return (
    <Routes>
      <Route
        path='/login'
        element={
          user ? (
            <Navigate
              to='/'
              replace
            />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route
        path='/changer-mot-de-passe'
        element={
          user && user.doit_changer_mot_de_passe ? (
            <ChangePassword
              onSuccess={(u) => {
                setUser(u);
                navigate("/", { replace: true });
              }}
            />
          ) : (
            <Navigate
              to='/'
              replace
            />
          )
        }
      />
      <Route
        path='/'
        element={
          !user ? (
            <Navigate
              to='/login'
              replace
            />
          ) : user.doit_changer_mot_de_passe ? (
            <Navigate
              to='/changer-mot-de-passe'
              replace
            />
          ) : (
            <Dashboard
              user={user}
              onLogout={handleLogout}
            />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
