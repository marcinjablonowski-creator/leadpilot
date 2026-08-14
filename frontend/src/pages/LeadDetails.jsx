import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import api from "../api"


function LeadDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const fetchLead = async () => {
    const token = localStorage.getItem("access_token")

    try {
      setLoading(true)
      setError("")

      const response = await api.get(`/api/leads/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setLead(response.data)
    } catch (error) {
      console.error("Failed to fetch lead:", error)

      if (error.response?.status === 401) {
        setError("Sesja wygasła. Zaloguj się ponownie.")
      } else if (error.response?.status === 404) {
        setError("Nie znaleziono leada.")
      } else {
        setError("Nie udało się pobrać leada.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLead()
  }, [id])

  const handleAnalyze = async () => {
    const token = localStorage.getItem("access_token")

    try {
      setAiLoading(true)
      setMessage("")

      const response = await api.post(
        `/api/leads/${id}/analyze/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setLead((currentLead) => ({
        ...currentLead,
        ai_summary: response.data.ai_summary,
        ai_priority: response.data.ai_priority,
        ai_reply: response.data.ai_reply,
      }))

      setMessage("Analiza AI zakończona.")
    } catch (error) {
      console.error("Failed to analyze lead:", error)
      setMessage("Nie udało się przeanalizować leada.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    const token = localStorage.getItem("access_token")

    try {
      setMessage("")

      const response = await api.patch(
        `/api/leads/${id}/`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setLead(response.data)
      setMessage("Status został zaktualizowany.")
    } catch (error) {
      console.error("Failed to update lead:", error)
      setMessage("Nie udało się zaktualizować statusu.")
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Czy na pewno chcesz usunąć tego leada?"
    )

    if (!confirmed) {
      return
    }

    const token = localStorage.getItem("access_token")

    try {
      await api.delete(`/api/leads/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      navigate("/dashboard")
    } catch (error) {
      console.error("Failed to delete lead:", error)
      setMessage("Nie udało się usunąć leada.")
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="card">
          <p>Ładowanie leada...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page">
        <div className="card">
          <p>{error}</p>

          <Link
            className="btn btn-secondary"
            to="/dashboard"
          >
            Wróć do Dashboardu
          </Link>
        </div>
      </main>
    )
  }

  if (!lead) {
    return null
  }

  return (
    <main className="page">
      <div className="actions">
        <Link
          className="btn btn-secondary"
          to="/dashboard"
        >
          ← Wróć
        </Link>
      </div>

      <div style={{ marginTop: "24px" }}>
        <h2 className="page-title">
          {lead.first_name} {lead.last_name}
        </h2>

        <p className="page-subtitle">
          Szczegóły leada i analiza AI
        </p>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h3>Dane klienta</h3>

          <p>
            <strong>E-mail:</strong>{" "}
            {lead.email || "Brak"}
          </p>

          <p>
            <strong>Telefon:</strong>{" "}
            {lead.phone || "Brak"}
          </p>

          <div className="form-group" style={{ marginTop: "20px" }}>
            <label htmlFor="status">Status</label>

            <select
              id="status"
              value={lead.status}
              onChange={(e) =>
                handleStatusChange(e.target.value)
              }
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </section>

        <section className="card">
          <h3>Zapytanie klienta</h3>

          <div className="message">
            {lead.message}
          </div>
        </section>
      </div>

      <section
        className="ai-panel"
        style={{ marginTop: "24px" }}
      >
        <div className="lead-card-top">
          <div>
            <h3>Analiza AI</h3>
            <p className="muted">
              Podsumowanie, priorytet i sugerowana odpowiedź.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={aiLoading}
          >
            {aiLoading ? "Analizowanie..." : "Analizuj AI"}
          </button>
        </div>

        <div style={{ marginTop: "20px" }}>
          <p>
            <strong>Priorytet:</strong>{" "}
            {lead.ai_priority ? (
              <span className={`priority-${lead.ai_priority}`}>
                {lead.ai_priority.toUpperCase()}
              </span>
            ) : (
              "Brak analizy"
            )}
          </p>

          <div className="message">
            <strong>Podsumowanie</strong>
            <p>
              {lead.ai_summary || "Brak analizy"}
            </p>
          </div>

          <div className="message">
            <strong>Proponowana odpowiedź</strong>
            <p>
              {lead.ai_reply || "Brak analizy"}
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <section
        className="card"
        style={{ marginTop: "24px" }}
      >
        <h3>Usuń lead</h3>

        <p className="muted">
          Ta operacja jest nieodwracalna.
        </p>

        <button
          className="btn btn-danger"
          onClick={handleDelete}
        >
          Usuń leada
        </button>
      </section>
    </main>
  )
}

export default LeadDetails