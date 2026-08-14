import { useNavigate } from "react-router-dom"

function Dashboard() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    navigate("/login")
  }

  return (
    <main>
      <h2>Dashboard</h2>
      <p>Jesteś zalogowany.</p>

      <button onClick={handleLogout}>
        Wyloguj
      </button>
    </main>
  )
}

export default Dashboard