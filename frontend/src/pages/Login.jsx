import { useState } from "react"
import { useNavigate } from "react-router-dom"

import api from "../api"


function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

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

      navigate("/dashboard")
    } catch (error) {
      console.error("Login failed:", error)

      if (error.response?.status === 401) {
        setMessage("Nieprawidłowy e-mail lub hasło.")
      } else {
        setMessage("Nie udało się połączyć z serwerem.")
      }
    }
  }

  return (
    <main className="login-page">
      <section className="card login-card">
        <div>
          <h1 className="page-title">LeadPilot</h1>

          <p className="page-subtitle">
            Zaloguj się do panelu obsługi leadów.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj@email.pl"
              autoComplete="email"
              required
            />
          </div>

          <div
            className="form-group"
            style={{ marginTop: "16px" }}
          >
            <label htmlFor="password">
              Hasło
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            style={{
              width: "100%",
              marginTop: "20px",
            }}
          >
            Zaloguj się
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login