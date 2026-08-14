import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import LeadDetails from "./pages/LeadDetails"


function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token")

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}


function AppLayout({ children }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    navigate("/login")
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h1 className="sidebar-logo">LeadPilot</h1>

          <nav className="sidebar-nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleLogout}
        >
          Wyloguj
        </button>
      </aside>

      <div className="app-content">
        {children}
      </div>
    </div>
  )
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leads/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LeadDetails />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App