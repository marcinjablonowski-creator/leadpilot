import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")

    try {
      const response = await api.post("/api/auth/login/", {
        email,
        password,
      })

      localStorage.setItem("access_token", response.data.access)
      localStorage.setItem("refresh_token", response.data.refresh)

      setMessage("Zalogowano poprawnie")
      navigate("/dashboard")
    } catch (error) {
      console.error(error)

      if (error.response?.status === 401) {
        setMessage("Nieprawidłowy e-mail lub hasło")
      } else {
        setMessage("Nie udało się połączyć z serwerem")
      }
    }
  }

  return (
    <main>
      <h2>Logowanie</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Hasło</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">
          Login
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  )
}

export default Login