import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import api from "../api"


function toDateTimeLocal(value) {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60 * 1000
  )

  return localDate.toISOString().slice(0, 16)
}


function LeadDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [aiLoading, setAiLoading] = useState(false)

  const [salesNotes, setSalesNotes] = useState("")
  const [notesSaving, setNotesSaving] = useState(false)
  const [nextContactAt, setNextContactAt] = useState("")
  const [followUpSaving, setFollowUpSaving] = useState(false)

  const fetchLead = useCallback(async () => {
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
      setSalesNotes(response.data.sales_notes || "")
      setNextContactAt(toDateTimeLocal(response.data.next_contact_at))
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
  }, [id])

  useEffect(() => {
    const timer = setTimeout(() => fetchLead(), 0)
    return () => clearTimeout(timer)
  }, [fetchLead])

  useEffect(() => {
    if (!message) {
      return undefined
    }

    const timer = setTimeout(() => setMessage(""), 3000)
    return () => clearTimeout(timer)
  }, [message])

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

      if (error.response?.status === 401) {
        setMessage("Sesja wygasła. Zaloguj się ponownie.")
      } else if (error.response?.data?.detail) {
        setMessage(error.response.data.detail)
      } else {
        setMessage("Nie udało się przeanalizować leada.")
      }
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
      setSalesNotes(response.data.sales_notes || "")
      setMessage("Status został zaktualizowany.")
    } catch (error) {
      console.error("Failed to update lead:", error)
      setMessage("Nie udało się zaktualizować statusu.")
    }
  }

  const handleSaveNotes = async () => {
    const token = localStorage.getItem("access_token")

    try {
      setNotesSaving(true)
      setMessage("")

      const response = await api.patch(
        `/api/leads/${id}/`,
        {
          sales_notes: salesNotes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setLead(response.data)
      setSalesNotes(response.data.sales_notes || "")
      setMessage("Notatki zostały zapisane.")
    } catch (error) {
      console.error("Failed to save notes:", error)

      if (error.response?.status === 401) {
        setMessage("Sesja wygasła. Zaloguj się ponownie.")
      } else {
        setMessage("Nie udało się zapisać notatek.")
      }
    } finally {
      setNotesSaving(false)
    }
  }

  const handleSaveFollowUp = async (nextValue) => {
    const token = localStorage.getItem("access_token")

    try {
      setFollowUpSaving(true)
      setMessage("")

      const response = await api.patch(
        `/api/leads/${id}/`,
        {
          next_contact_at: nextValue
            ? new Date(nextValue).toISOString()
            : null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setLead(response.data)
      setSalesNotes(response.data.sales_notes || "")
      setNextContactAt(toDateTimeLocal(response.data.next_contact_at))
      setMessage(
        nextValue
          ? "Termin kolejnego kontaktu został zapisany."
          : "Termin kolejnego kontaktu został usunięty."
      )
    } catch (error) {
      console.error("Failed to save follow-up:", error)
      setMessage("Nie udało się zapisać terminu kontaktu.")
    } finally {
      setFollowUpSaving(false)
    }
  }

  const handleCopyReply = async () => {
    if (!lead?.ai_reply) {
      return
    }

    try {
      await navigator.clipboard.writeText(lead.ai_reply)
      setMessage("Odpowiedź AI została skopiowana.")
    } catch (error) {
      console.error("Failed to copy AI reply:", error)
      setMessage("Nie udało się skopiować odpowiedzi.")
    }
  }

  const handleEmail = () => {
    if (!lead?.email) {
      return
    }

    window.location.href = `mailto:${lead.email}`
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
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}

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

         <div className="actions">
            {lead.phone && (
              <a
                className="btn btn-primary"
                href={`tel:${lead.phone}`}
              >
                📞 Zadzwoń
              </a>
            )}

            {lead.email && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleEmail}
              >
                ✉️ Napisz e-mail
              </button>
            )}
          </div>

          <p>
            <strong>Dodano:</strong>{" "}
            {lead.created_at
              ? new Date(lead.created_at).toLocaleString("pl-PL")
              : "Brak daty"}
          </p>

          <div
            className="form-group"
            style={{ marginTop: "20px" }}
          >
            <label htmlFor="status">
              Status
            </label>

            <select
              id="status"
              value={lead.status}
              onChange={(e) =>
                handleStatusChange(e.target.value)
              }
            >
              <option value="new">Nowy</option>
              <option value="contacted">Skontaktowano</option>
              <option value="won">Wygrany</option>
              <option value="lost">Przegrany</option>
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
           
           {aiLoading
              ? "Analizowanie..."
              : lead.ai_summary
                ? "Analizuj ponownie"
                : "Analizuj AI"}
          </button>
        </div>

        <div className="ai-summary-row">
          <div>
            <span className="ai-label">Podsumowanie</span>
            <p>{lead.ai_summary || "Brak analizy"}</p>
          </div>

          {lead.ai_priority && (
            <span className={`priority-${lead.ai_priority}`}>
              {lead.ai_priority.toUpperCase()}
            </span>
          )}
        </div>

        <div className="ai-reply">
          <span className="ai-label">Proponowana odpowiedź</span>
          <p>{lead.ai_reply || "Brak analizy"}</p>

          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={handleCopyReply}
              disabled={!lead.ai_reply}
            >
              Kopiuj odpowiedź
            </button>

            {lead.email && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleEmail}
              >
                Napisz e-mail
              </button>
            )}
          </div>
        </div>
      </section>

      <section
        className="card"
        style={{ marginTop: "24px" }}
      >
        <h3>Kolejny kontakt</h3>

        <p className="muted">
          Ustaw termin, w którym należy ponownie skontaktować się z klientem.
        </p>

        <div className="form-group">
          <label htmlFor="nextContactAt">Data i godzina</label>

          <input
            id="nextContactAt"
            type="datetime-local"
            value={nextContactAt}
            onChange={(event) => setNextContactAt(event.target.value)}
          />
        </div>

        <div className="actions">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => handleSaveFollowUp(nextContactAt)}
            disabled={followUpSaving || !nextContactAt}
          >
            {followUpSaving ? "Zapisywanie..." : "Zapisz termin"}
          </button>

          {lead.next_contact_at && (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => handleSaveFollowUp("")}
              disabled={followUpSaving}
            >
              Usuń termin
            </button>
          )}
        </div>
      </section>

      <section
        className="card"
        style={{ marginTop: "24px" }}
      >
        <h3>Notatki handlowca</h3>

        <p className="muted">
          Notatkę możesz edytować w dowolnym momencie.
        </p>

        <div className="form-group">
          <textarea
            value={salesNotes}
            onChange={(e) =>
              setSalesNotes(e.target.value)
            }
            placeholder="Np. oddzwonić jutro o 10:00, klient oczekuje wyceny do piątku..."
          />
        </div>

        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={handleSaveNotes}
            disabled={notesSaving}
          >
            {notesSaving
              ? "Zapisywanie..."
              : "Zapisz notatki"}
          </button>
        </div>
      </section>

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
