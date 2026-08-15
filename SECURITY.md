# Security audit

Data audytu: 2026-08-15

Zakres obejmuje sekrety, konfigurację Django, kontrolę dostępu do API oraz
integrację AI. Kontrole nie wyświetlają wartości sekretów i nie wysyłają
rzeczywistych zapytań do OpenAI.

## Wynik końcowy

- Testy: 44 uruchomione, 44 zaliczone, 0 błędów.
- Test `test_secret_key_is_production_strength` potwierdza poprawną rotację.
- `python manage.py check --deploy`: 4 ostrzeżenia po poprawkach, wcześniej
  1 błąd i 7 ostrzeżeń.
- Brak wykrytych sekretów w kodzie oraz historii Git.

## Wykonane kontrole

### Sekrety

- Sprawdzono wymagane zmienne `DJANGO_SECRET_KEY`, `DATABASE_URL` oraz
  `OPENAI_API_KEY` bez odczytywania ich wartości do raportu.
- Potwierdzono ignorowanie `.env` i `.env.*` przez Git.
- Przeskanowano tekstowe pliki projektu pod kątem typowych formatów kluczy.
- Przeskanowano historię Git i reflog pod kątem plików środowiskowych,
  kluczy OpenAI, AWS oraz adresów PostgreSQL zawierających dane dostępowe.
- Potwierdzono, że `OPENAI_API_KEY` jest używany tylko przez backend.

### Django

- Uruchomiono `python manage.py check --deploy` przed i po poprawkach.
- Sprawdzono `DEBUG`, `ALLOWED_HOSTS`, `SECRET_KEY`, CORS, CSRF oraz cookies.
- Sprawdzono middleware CSRF i jawne originy CORS.

### API

- Sprawdzono chronione endpointy bez JWT i z nieprawidłowym JWT.
- Sprawdzono odczyt, edycję, usuwanie i analizę AI cudzego leada.
- Wszystkie próby dostępu do cudzego rekordu kończą się odpowiedzią 404,
  dzięki czemu API nie ujawnia także istnienia rekordu.

### AI

- Wiadomość klienta jest przekazywana jako niezaufany `input`, oddzielnie od
  instrukcji sterujących modelem.
- Prompt zabrania wykonywania instrukcji z wiadomości klienta oraz ujawniania
  konfiguracji, sekretów i danych innych klientów.
- Test payloadu potwierdza, że sekrety backendu nie są wysyłane do modelu.
- Parser odrzuca niepoprawny JSON, odpowiedź innego typu, brakujące pola,
  nieprawidłowy priorytet i błędne typy wartości.

## Znalezione problemy

### Rozwiązane

1. Developerski `DJANGO_SECRET_KEY` został zastąpiony kluczem o odpowiedniej
   długości i złożoności. Test bezpieczeństwa przechodzi.

### Średni priorytet

1. `SECURE_SSL_REDIRECT` nie jest domyślnie włączony. Przekierowanie HTTPS
   powinno zostać skonfigurowane po ustaleniu sposobu działania hostingu lub
   reverse proxy.
2. HSTS nie obejmuje subdomen i nie używa preload. Nie należy włączać tych
   opcji bez potwierdzenia, że wszystkie subdomeny zawsze obsługują HTTPS.
3. Produkcyjne wartości `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` oraz
   `CSRF_TRUSTED_ORIGINS` muszą zostać ustawione dla rzeczywistej domeny.

## Wprowadzone poprawki

- `DEBUG` jest domyślnie wyłączony i sterowany przez `DJANGO_DEBUG`.
- Wykonano rotację `DJANGO_SECRET_KEY` na klucz o sile produkcyjnej.
- `ALLOWED_HOSTS` jest konfigurowany przez `DJANGO_ALLOWED_HOSTS`; wildcard
  jest zabroniony przez test.
- CORS używa jawnej listy originów, bez wildcardu i credentials.
- Cookies sesji i CSRF są `Secure`, `HttpOnly` oraz `SameSite=Lax` poza trybem
  debug.
- Dodano HSTS z ostrożnym czasem początkowym 3600 sekund.
- Produkcja domyślnie używa backendu SMTP zamiast konsolowego backendu e-mail.
- Oddzielono instrukcje AI od wiadomości klienta i ograniczono odpowiedź do
  500 tokenów bez zapisywania odpowiedzi po stronie OpenAI (`store=False`).
- Rozszerzono walidację odpowiedzi AI.
- Dodano automatyczne testy bezpieczeństwa sekretów, Django, API i AI.

## Pozostałe ograniczenia

- Prompt injection można ograniczać, ale nie można zagwarantować pełnej
  odporności modelu. Wynik AI nadal wymaga oceny handlowca.
- Skan sekretów używa znanych wzorców; nie zastępuje skanera entropii, takiego
  jak Gitleaks, uruchamianego w CI.
- Nie wykonano skanu podatności zależności Python i npm.
- Limit publicznego formularza korzysta z cache Django; przy wielu procesach
  powinien używać współdzielonego cache, np. Redis.
- JWT są przechowywane w `localStorage`, więc skuteczna podatność XSS mogłaby
  umożliwić ich odczytanie. Docelowo warto rozważyć cookies `HttpOnly`.
- Automatyczny audyt nie zastępuje testów penetracyjnych wdrożonej aplikacji,
  konfiguracji TLS, nagłówków reverse proxy i uprawnień infrastruktury.

## Wymagane działania przed produkcją

1. Ustawić domeny produkcyjne w `DJANGO_ALLOWED_HOSTS`,
   `CORS_ALLOWED_ORIGINS` i `CSRF_TRUSTED_ORIGINS`.
2. Włączyć `SECURE_SSL_REDIRECT=True` albo wymusić HTTPS na reverse proxy.
3. Skonfigurować SMTP i współdzielony Redis.
4. Dodać Gitleaks oraz skan zależności do CI.
