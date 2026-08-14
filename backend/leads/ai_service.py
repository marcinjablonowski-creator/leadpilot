import json
import os
from json import JSONDecodeError

from openai import APIConnectionError, APIError, APITimeoutError, OpenAI


client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    timeout=15.0,
)


def analyze_lead(message):
    try:
        response = client.responses.create(
            model="gpt-5-mini",
            input=f"""
Jesteś asystentem sprzedażowym dla firmy HVAC.

Przeanalizuj wiadomość potencjalnego klienta.

Zwróć WYŁĄCZNIE poprawny JSON w formacie:

{{
  "summary": "krótkie podsumowanie zapytania",
  "priority": "low | medium | high",
  "reply": "krótka propozycja odpowiedzi dla klienta"
}}

Zasady:
- summary: maksymalnie 2 zdania
- priority: tylko low, medium albo high
- high: klient jest pilny, chce wycenę, montaż lub szybki kontakt
- medium: klient jest zainteresowany, ale nie wskazuje pilności
- low: zapytanie jest ogólne lub mało konkretne
- reply: profesjonalna i krótka odpowiedź po polsku
- nie dodawaj tekstu poza JSON

Wiadomość klienta:
{message}
"""
        )

    except APITimeoutError as error:
        raise RuntimeError("AI request timed out.") from error

    except (APIConnectionError, APIError) as error:
        raise RuntimeError("AI service is unavailable.") from error

    try:
        result = json.loads(response.output_text)
    except JSONDecodeError as error:
        raise ValueError("AI returned invalid JSON.") from error

    required_fields = ["summary", "priority", "reply"]

    for field in required_fields:
        if field not in result:
            raise ValueError(f"AI response missing field: {field}")

    if result["priority"] not in ["low", "medium", "high"]:
        raise ValueError("AI returned invalid priority.")

    if not isinstance(result["summary"], str):
        raise ValueError("AI summary must be a string.")

    if not isinstance(result["reply"], str):
        raise ValueError("AI reply must be a string.")

    return result


def analyze_and_save_lead(lead):
    result = analyze_lead(lead.message)

    lead.ai_summary = result["summary"]
    lead.ai_priority = result["priority"]
    lead.ai_reply = result["reply"]

    lead.save(
        update_fields=[
            "ai_summary",
            "ai_priority",
            "ai_reply",
        ]
    )

    return lead