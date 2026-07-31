import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./pages/admin/Login";
import ChangePassword from "./pages/admin/ChangePassword";
import Dashboard from "./pages/admin/Dashboard";
import Incidents from "./pages/admin/Incidents";
import MesTickets from "./pages/admin/MesTickets";
import IncidentDetail from "./pages/admin/IncidentDetail";
import Agences from "./pages/admin/Agences";
import AgenceHistorique from "./pages/admin/AgenceHistorique";
import Profil from "./pages/admin/Profil";
import ComptesAdmin from "./pages/admin/ComptesAdmin";
import AgenceAccueil from "./pages/agence/AgenceAccueil";
import AgenceTickets from "./pages/agence/AgenceTickets";
import AgenceTicketDetail from "./pages/agence/AgenceTicketDetail";
import AgenceDeclarer from "./pages/agence/AgenceDeclarer";

// // Dashboard component temporaire pour tester la navigation après le login
// function Dashboard({ user, onLogout }) {
//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         minHeight: "100vh",
//         fontFamily: "'Montserrat', sans-serif",
//       }}
//     >
//       <h1>
//         Bienvenue, {user.nom} {user.prenom}!
//       </h1>
//       <p>Votre rôle : {user.role}</p>
//       <button
//         onClick={onLogout}
//         style={{
//           marginTop: "20px",
//           padding: "10px 20px",
//           backgroundColor: "#f77100",
//           color: "#fff",
//           border: "none",
//           borderRadius: "5px",
//           cursor: "pointer",
//         }}
//       >
//         Déconnexion
//       </button>
//     </div>
//   );
// }

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

  // Appele apres une modification du profil (infos ou photo) : met a jour le state et le localStorage
  // sans avoir a se reconnecter, pour que Layout.jsx reflete immediatement les changements
  const handleUserUpdate = (userData) => {
    setUser(userData);
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
      {/* Espace agence : public, aucune authentification (accessible via le lien unique de l'agence) */}
      <Route
        path='/agence/:code'
        element={<AgenceAccueil />}
      />
      <Route
        path='/agence/:code/tickets'
        element={<AgenceTickets />}
      />
      <Route
        path='/agence/:code/tickets/:id'
        element={<AgenceTicketDetail />}
      />
      <Route
        path='/agence/:code/declarer'
        element={<AgenceDeclarer />}
      />
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
      <Route
        path='/incidents'
        element={
          !user ? (
            <Navigate
              to='/login'
              replace
            />
          ) : (
            <Incidents
              user={user}
              onLogout={handleLogout}
            />
          )
        }
      />
      <Route
        path='/mes-tickets'
        element={
          !user ? (
            <Navigate
              to='/login'
              replace
            />
          ) : (
            <MesTickets
              user={user}
              onLogout={handleLogout}
            />
          )
        }
      />
      <Route
        path='/agences'
        element={
          !user ? (
            <Navigate
              to='/login'
              replace
            />
          ) : (
            <Agences
              user={user}
              onLogout={handleLogout}
            />
          )
        }
      />
      <Route
        path='/agences/:code/historique'
        element={
          !user ? (
            <Navigate
              to='/login'
              replace
            />
          ) : (
            <AgenceHistorique
              user={user}
              onLogout={handleLogout}
            />
          )
        }
      />
      <Route
        path='/incidents/:id'
        element={
          !user ? (
            <Navigate
              to='/login'
              replace
            />
          ) : (
            <IncidentDetail
              user={user}
              onLogout={handleLogout}
            />
          )
        }
      />
      <Route
        path='/profil'
        element={
          !user ? (
            <Navigate
              to='/login'
              replace
            />
          ) : (
            <Profil
              user={user}
              onLogout={handleLogout}
              onUserUpdate={handleUserUpdate}
            />
          )
        }
      />
      <Route
        path='/comptes-admin'
        element={
          !user ? (
            <Navigate
              to='/login'
              replace
            />
          ) : user.role !== 'superadmin' ? (
            <Navigate
              to='/'
              replace
            />
          ) : (
            <ComptesAdmin
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
