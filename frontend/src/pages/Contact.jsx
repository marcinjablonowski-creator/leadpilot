import { useState } from "react"
import { Link } from "react-router-dom"

import api from "../api"

const initialForm = {
  firstName: "", lastName: "", email: "", phone: "", message: "",
  privacyConsent: false, website: "",
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
        first_name: form.firstName, last_name: form.lastName,
        email: form.email, phone: form.phone, message: form.message,
        privacy_consent: form.privacyConsent, website: form.website,
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
        setError("Nie udało się wysłać formularza. Sprawdź podane dane.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="landing-brand" to="/">LeadPilot</Link>
        <Link className="btn btn-secondary" to="/login">Zaloguj się</Link>
      </header>

      <section className="landing-hero">
        <div className="landing-intro">
          <p className="landing-eyebrow">Porozmawiajmy o Twoim projekcie</p>
          <h1>Znajdźmy najlepsze rozwiązanie dla Twojego projektu</h1>
          <p className="landing-description">
            Opisz, czego potrzebujesz, a nasz zespół przeanalizuje Twoje
            zapytanie i skontaktuje się z Tobą.
          </p>
          <ul className="landing-benefits">
            <li>Indywidualne podejście</li>
            <li>Szybki kontakt</li>
            <li>Oferta dopasowana do potrzeb</li>
          </ul>
        </div>

        <section className="contact-card">
          {success ? (
            <div className="contact-success">
              <div className="success-mark">✓</div>
              <h2>Dziękujemy za wiadomość</h2>
              <p>Zapytanie zostało wysłane. Skontaktujemy się z Tobą.</p>
              <button className="btn btn-primary" type="button" onClick={() => setSuccess(false)}>
                Wyślij kolejne zapytanie
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="contact-heading">
                <p className="landing-eyebrow">Formularz kontaktowy</p>
                <h2>Zapytaj o ofertę</h2>
              </div>

              <div className="contact-fields">
                <div className="form-group">
                  <label htmlFor="firstName">Imię *</label>
                  <input id="firstName" name="firstName" value={form.firstName} onChange={updateField} required />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Nazwisko</label>
                  <input id="lastName" name="lastName" value={form.lastName} onChange={updateField} />
                </div>
                <div className="form-group">
                  <label htmlFor="email">E-mail *</label>
                  <input id="email" name="email" type="email" value={form.email} onChange={updateField} required />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Telefon</label>
                  <input id="phone" name="phone" type="tel" value={form.phone} onChange={updateField} />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Opisz, czego potrzebujesz *</label>
                  <textarea id="message" name="message" value={form.message} onChange={updateField} maxLength="5000" required />
                </div>
                <div className="honeypot" aria-hidden="true">
                  <label htmlFor="website">Strona internetowa</label>
                  <input id="website" name="website" value={form.website} onChange={updateField} tabIndex="-1" autoComplete="off" />
                </div>
                <label className="checkbox">
                  <input name="privacyConsent" type="checkbox" checked={form.privacyConsent} onChange={updateField} required />
                  <span>Wyrażam zgodę na przetwarzanie danych w celu obsługi zapytania. *</span>
                </label>
              </div>

              {error && <div className="message form-error">{error}</div>}
              <button className="btn btn-primary contact-submit" type="submit" disabled={submitting}>
                {submitting ? "Wysyłanie..." : "Wyślij zapytanie"}
              </button>
            </form>
          )}
        </section>
      </section>

      <section className="how-it-works">
        <div className="section-heading">
          <p className="landing-eyebrow">Prosty proces</p>
          <h2>Jak to działa?</h2>
        </div>
        <div className="process-grid">
          <article><span>01</span><h3>Opisz projekt</h3><p>Napisz, czego potrzebujesz i jaki efekt chcesz osiągnąć.</p></article>
          <article><span>02</span><h3>Wyślij zapytanie</h3><p>Przekaż nam swoje dane kontaktowe przez bezpieczny formularz.</p></article>
          <article><span>03</span><h3>Skontaktujemy się</h3><p>Przeanalizujemy zapytanie i wrócimy z dopasowaną odpowiedzią.</p></article>
        </div>
      </section>

      <footer className="landing-footer">
        <span className="landing-brand">LeadPilot</span>
        <span>© 2026 LeadPilot</span>
      </footer>
    </main>
  )
}

export default Contact
