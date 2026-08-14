import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import api from "../api"


function Dashboard() {
  const navigate = useNavigate()

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")

  const [formMessage, setFormMessage] = useState("")

  const fetchLeads = async () => {
    const token = localStorage.getItem("access_token")

    try {
      setLoading(true)
      setError("")

      const response = await api.get("/api/leads/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setLeads(response.data)
    } catch (error) {
      console.error("Failed to fetch leads:", error)

      if (error.response?.status === 401) {
        setError("Sesja wygasła. Zaloguj się ponownie.")
      } else {
        setError("Nie udało się pobrać leadów.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleAddLead = async (e) => {
    e.preventDefault()

    const token = localStorage.getItem("access_token")

    try {
      setFormMessage("")

      await api.post(
        "/api/leads/",
        {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setMessage("")

      setFormMessage("Lead został dodany.")

      await fetchLeads()
    } catch (error) {
      console.error("Failed to create lead:", error)

      if (error.response?.status === 401) {
        setFormMessage("Sesja wygasła. Zaloguj się ponownie.")
      } else {
        setFormMessage("Nie udało się dodać leada.")
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    navigate("/login")
  }

  return (
    <main>
      <h2>Dashboard</h2>

      <section>
        <h3>Dodaj lead</h3>

        <form onSubmit={handleAddLead}>
          <div>
            <label htmlFor="firstName">Imię</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="lastName">Nazwisko</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="phone">Telefon</label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="message">Wiadomość</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button type="submit">
            Dodaj lead
          </button>
        </form>

        {formMessage && <p>{formMessage}</p>}
      </section>

      <hr />

      <section>
        <h3>Leady</h3>

        {loading && <p>Ładowanie leadów...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && (
          <p>Pobrano leadów: {leads.length}</p>
        )}

        {!loading && !error && leads.length === 0 && (
          <p>Brak leadów.</p>
        )}

        {!loading && !error && leads.length > 0 && (
          <div>
            {leads.map((lead) => (
              <div key={lead.id}>
                <h4>
                  {lead.first_name} {lead.last_name}
                </h4>

                <p>E-mail: {lead.email || "Brak"}</p>
                <p>Telefon: {lead.phone || "Brak"}</p>
                <p>Status: {lead.status}</p>
                <p>Wiadomość: {lead.message}</p>

                <Link to={`/leads/${lead.id}`}>
                  Szczegóły
                </Link>

                <hr />
              </div>
            ))}
          </div>
        )}
      </section>

      <button onClick={handleLogout}>
        Wyloguj
      </button>
    </main>
  )
}

export default Dashboard