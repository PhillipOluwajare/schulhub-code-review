CREATE TABLE IF NOT EXISTS public.schueler (
    id SERIAL PRIMARY KEY,
    vorname VARCHAR(100) NOT NULL,
    nachname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwort VARCHAR(255) NOT NULL,
    klasse VARCHAR(50) NOT NULL,
    geburtsdatum DATE,
    premium BOOLEAN DEFAULT false,
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    webuntis_username VARCHAR(100),
    webuntis_password_encrypted TEXT,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS public.hausaufgaben (
    id SERIAL PRIMARY KEY,
    schueler_id INTEGER REFERENCES public.schueler(id) ON DELETE CASCADE,
    fach VARCHAR(100) NOT NULL,
    beschreibung TEXT NOT NULL,
    faellig_am DATE NOT NULL,
    erledigt BOOLEAN DEFAULT false,
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.stundenplan_cache (
    id SERIAL PRIMARY KEY,
    schueler_id INTEGER REFERENCES public.schueler(id) ON DELETE CASCADE,
    datum DATE NOT NULL,
    daten JSONB NOT NULL,
    abgerufen_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(schueler_id, datum)
);
