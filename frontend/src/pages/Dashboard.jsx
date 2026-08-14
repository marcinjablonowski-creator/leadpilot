import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import api from "../api"


function Dashboard() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [sortBy, setSortBy] = useState("newest")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [formMessage, setFormMessage] = useState("")
  const [toast, setToast] = useState("")

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

      setTimeout(() => {
        setShowAddForm(false)
        setFormMessage("")
      }, 800)
    } catch (error) {
      console.error("Failed to create lead:", error)

      if (error.response?.status === 401) {
        setFormMessage("Sesja wygasła. Zaloguj się ponownie.")
      } else {
        setFormMessage("Nie udało się dodać leada.")
      }
    }
  }

  const highPriorityCount = leads.filter(
    (lead) => lead.ai_priority === "high"
  ).length

  const newLeadsCount = leads.filter(
    (lead) => lead.status === "new"
  ).length

  const contactCount = leads.filter(
    (lead) => ["new", "contacted"].includes(lead.status)
  ).length

  const filteredLeads = leads.filter((lead) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "new" && lead.status === "new") ||
      (filter === "high" && lead.ai_priority === "high") ||
      (
        filter === "contact" &&
        ["new", "contacted"].includes(lead.status)
      )

    const query = search.trim().toLowerCase()

    if (!query) {
      return matchesFilter
    }

    const matchesSearch =
      lead.first_name?.toLowerCase().includes(query) ||
      lead.last_name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.phone?.toLowerCase().includes(query)

    return matchesFilter && matchesSearch
  })

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at) - new Date(a.created_at)
    }

    if (sortBy === "oldest") {
      return new Date(a.created_at) - new Date(b.created_at)
    }

    if (sortBy === "priority") {
      const priorityOrder = {
        high: 3,
        medium: 2,
        low: 1,
      }

      return (
        (priorityOrder[b.ai_priority] || 0) -
        (priorityOrder[a.ai_priority] || 0)
      )
    }

    return 0
  })

  const getStatusClass = (status) => {
    return `status status-${status}`
  }

  const getPriorityClass = (priority) => {
    if (!priority) {
      return ""
    }

    return `priority-${priority}`
  }

  const handleStatusChange = async (leadId, newStatus) => {
    const token = localStorage.getItem("access_token")

    try {
      await api.patch(
        `/api/leads/${leadId}/`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead.id === leadId
            ? { ...lead, status: newStatus }
            : lead
        )
      )

      setToast("Status został zmieniony.")
      setTimeout(() => {
        setToast("")
      }, 2500)

    } catch (error) {
      console.error("Failed to update lead status:", error)
      setError("Nie udało się zmienić statusu leada.")
    }
  }

  return (
    <main className="page">
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
      <div>
        <h2 className="page-title">Dashboard</h2>

        <p className="page-subtitle">
          Zarządzaj leadami, wyszukuj klientów i sprawdzaj priorytet AI.
        </p>
      </div>

      <section className="stats-grid">
        <button
          type="button"
          className={`card stat-card ${
            filter === "all" ? "stat-active" : ""
          }`}
          onClick={() => setFilter("all")}
        >
          <p className="muted">Wszystkie leady</p>
          <h2>{leads.length}</h2>
        </button>

        <button
          type="button"
          className={`card stat-card ${
            filter === "new" ? "stat-active" : ""
          }`}
          onClick={() => setFilter("new")}
        >
          <p className="muted">Nowe leady</p>
          <h2>{newLeadsCount}</h2>
        </button>

        <button
          type="button"
          className={`card stat-card ${
            filter === "high" ? "stat-active" : ""
          }`}
          onClick={() => setFilter("high")}
        >
          <p className="muted">Priorytet HIGH</p>
          <h2>{highPriorityCount}</h2>
        </button>

        <button
          type="button"
          className={`card stat-card ${
            filter === "contact" ? "stat-active" : ""
          }`}
          onClick={() => setFilter("contact")}
        >
          <p className="muted">Do kontaktu</p>
          <h2>{contactCount}</h2>
        </button>

        <button
          type="button"
          className={`card stat-card ${
            showAddForm ? "stat-active" : ""
          }`}
          onClick={() => {
            setShowAddForm((current) => !current)
            setFormMessage("")
          }}
        >
          <p className="muted">Nowy lead</p>
          <h2>+ Dodaj</h2>
        </button>
      </section>

      {showAddForm && (
        <section
          className="card"
          style={{ marginTop: "24px" }}
        >
          <div className="lead-card-top">
            <div>
              <h3>Dodaj nowego leada</h3>

              <p className="muted">
                Wprowadź dane potencjalnego klienta.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddForm(false)}
            >
              Zamknij
            </button>
          </div>

          <form
            className="form-grid"
            onSubmit={handleAddLead}
            style={{ marginTop: "20px" }}
          >
            <div className="form-group">
              <label htmlFor="firstName">Imię</label>

              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Nazwisko</label>

              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">E-mail</label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefon</label>

              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="message">Wiadomość</label>

              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div className="form-group-full">
              <button
                className="btn btn-primary"
                type="submit"
              >
                + Dodaj lead
              </button>
            </div>
          </form>

          {formMessage && (
            <p className="message">
              {formMessage}
            </p>
          )}
        </section>
      )}

      <section style={{ marginTop: "32px" }}>
        <div className="lead-card-top">
          <div>
            <h3>Leady</h3>

            {!loading && !error && (
              <p className="muted">
                Wyświetlono: {sortedLeads.length}
              </p>
            )}
          </div>
        </div>

        <div
          className="form-group"
          style={{ marginBottom: "20px" }}
        >
          <label htmlFor="search">
            Szukaj leada
          </label>

          <input
            id="search"
            type="search"
            placeholder="Imię, nazwisko, e-mail lub telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div
          className="form-group"
          style={{ marginBottom: "20px" }}
        >
          <label htmlFor="sortBy">
            Sortuj
          </label>

          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Najnowsze</option>
            <option value="oldest">Najstarsze</option>
            <option value="priority">HIGH najpierw</option>
          </select>
        </div>

        {loading && (
          <div className="card">
            <p>Ładowanie leadów...</p>
          </div>
        )}

        {error && (
          <div className="card">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && sortedLeads.length === 0 && (
          <div className="card">
            <h3>Brak leadów</h3>

            <p className="muted">
              Brak leadów pasujących do filtra lub wyszukiwania.
            </p>
          </div>
        )}

        {!loading && !error && sortedLeads.length > 0 && (
          <div className="lead-list">
            {sortedLeads.map((lead) => (
              <article
                className="lead-card"
                key={lead.id}
              >
                <div className="lead-card-top">
                  <div>
                    <h4>
                      {lead.first_name} {lead.last_name}
                    </h4>

                    <p className="muted">
                      {lead.email || "Brak e-maila"}
                      {" · "}
                      {lead.phone || "Brak telefonu"}
                    </p>

                    <p className="muted">
                      Dodano:{" "}
                      {lead.created_at
                        ? new Date(
                            lead.created_at
                          ).toLocaleString("pl-PL")
                        : "Brak daty"}
                    </p>
                  </div>

                  <div className="actions">
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        handleStatusChange(lead.id, e.target.value)
                      }
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>

                    {lead.ai_priority && (
                      <span
                        className={getPriorityClass(
                          lead.ai_priority
                        )}
                      >
                        {lead.ai_priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="message">
                  {lead.message}
                </div>

                {lead.ai_summary && (
                  <p>
                    <strong>AI:</strong>{" "}
                    {lead.ai_summary}
                  </p>
                )}

                <div className="actions">
                  <Link
                    className="btn btn-secondary"
                    to={`/leads/${lead.id}`}
                  >
                    Szczegóły →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default Dashboard