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
      <main>
        <p>Ładowanie leada...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main>
        <p>{error}</p>
        <Link to="/dashboard">Wróć do Dashboardu</Link>
      </main>
    )
  }

  if (!lead) {
    return null
  }

  return (
    <main>
      <p>
        <Link to="/dashboard">
          ← Wróć do Dashboardu
        </Link>
      </p>

      <h2>
        {lead.first_name} {lead.last_name}
      </h2>

      <section>
        <h3>Dane klienta</h3>

        <p>
          <strong>E-mail:</strong>{" "}
          {lead.email || "Brak"}
        </p>

        <p>
          <strong>Telefon:</strong>{" "}
          {lead.phone || "Brak"}
        </p>
      </section>

      <section>
        <h3>Zapytanie</h3>
        <p>{lead.message}</p>
      </section>

      <section>
        <h3>Status</h3>

        <select
          value={lead.status}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </section>

      <section>
        <h3>AI</h3>

        <button
          onClick={handleAnalyze}
          disabled={aiLoading}
        >
          {aiLoading ? "Analizowanie..." : "Analizuj AI"}
        </button>

        <p>
          <strong>Priorytet:</strong>{" "}
          {lead.ai_priority || "Brak analizy"}
        </p>

        <p>
          <strong>Podsumowanie:</strong>{" "}
          {lead.ai_summary || "Brak analizy"}
        </p>

        <p>
          <strong>Proponowana odpowiedź:</strong>{" "}
          {lead.ai_reply || "Brak analizy"}
        </p>
      </section>

      {message && <p>{message}</p>}

      <hr />

      <button onClick={handleDelete}>
        Usuń leada
      </button>
    </main>
  )
}

export default LeadDetails