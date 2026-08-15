import { useState } from "react"
import { Link } from "react-router-dom"

import api from "../api"


const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
  privacyConsent: false,
  website: "",
}


function Contact() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const updateField = (event) => {
    const { name, value, checked, type } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError("")

      await api.post("/api/public/leads/", {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        message: form.message,
        privacy_consent: form.privacyConsent,
        website: form.website,
      })

      setForm(initialForm)
      setSuccess(true)
    } catch (requestError) {
      console.error("Failed to send contact form:", requestError)

      if (requestError.response?.status === 429) {
        setError("Wysłano zbyt wiele zgłoszeń. Spróbuj ponownie później.")
      } else if (requestError.response?.status === 503) {
        setError("Formularz jest chwilowo niedostępny. Spróbuj ponownie później.")
      } else {
        setError("Sprawdź formularz i podaj e-mail lub numer telefonu.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="landing-brand" to="/">LeadPilot</Link>
        <Link className="btn btn-secondary" to="/login">
          Logowanie handlowca
        </Link>
      </header>

      <div className="landing-content">
        <section className="landing-intro">
          <p className="landing-eyebrow">Szybki kontakt</p>
          <h1>Opisz, czego potrzebujesz</h1>
          <p>
            Przekaż nam podstawowe informacje. Zapoznamy się z Twoim
            zapytaniem i skontaktujemy się w sprawie rozwiązania.
          </p>

          <div className="landing-steps">
            <span>1. Wyślij zapytanie</span>
            <span>2. Analizujemy potrzebę</span>
            <span>3. Handlowiec odpowiada</span>
          </div>
        </section>

        <section className="card contact-card">
          {success ? (
            <div className="contact-success">
              <div className="success-mark">✓</div>
              <h2>Dziękujemy za wiadomość</h2>
              <p>Zapytanie zostało wysłane. Handlowiec skontaktuje się z Tobą.</p>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setSuccess(false)}
              >
                Wyślij kolejne zapytanie
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2>Formularz kontaktowy</h2>
              <p className="muted">Pola oznaczone * są wymagane.</p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firstName">Imię *</label>
                  <input
                    id="firstName"
                    name="firstName"
                    value={form.firstName}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Nazwisko</label>
                  <input
                    id="lastName"
                    name="lastName"
                    value={form.lastName}
                    onChange={updateField}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Telefon</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={updateField}
                  />
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="message">Opisz swoją potrzebę *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={updateField}
                    maxLength="5000"
                    required
                  />
                </div>

                <div className="honeypot" aria-hidden="true">
                  <label htmlFor="website">Strona internetowa</label>
                  <input
                    id="website"
                    name="website"
                    value={form.website}
                    onChange={updateField}
                    tabIndex="-1"
                    autoComplete="off"
                  />
                </div>

                <label className="checkbox form-group-full">
                  <input
                    name="privacyConsent"
                    type="checkbox"
                    checked={form.privacyConsent}
                    onChange={updateField}
                    required
                  />
                  <span>
                    Wyrażam zgodę na przetwarzanie podanych danych w celu
                    obsługi mojego zapytania. *
                  </span>
                </label>
              </div>

              {error && <div className="message form-error">{error}</div>}

              <button
                className="btn btn-primary contact-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Wysyłanie..." : "Wyślij zapytanie"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

export default Contact
