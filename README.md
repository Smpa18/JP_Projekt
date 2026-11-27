# JusticePro

**Digitale Fallverwaltung für Gerichte und Staatsanwaltschaften**
*Full-Stack-Webanwendung mit Java / Spring Boot, React und PostgreSQL*

> **English summary:** JusticePro is a full-stack case management system for courts and prosecutors' offices. It digitises the path of a criminal or civil case, from the registration of a complaint to the final verdict, with role-based access, a multi-step approval workflow, document uploads and PDF generation. Backend: Java, Spring Boot, Spring Security (JWT), Spring Data JPA, PostgreSQL. Frontend: React, Vite, React Router, Axios.

---

## Worum geht es?

In vielen Gerichten werden Akten noch auf Papier geführt. Dadurch ist oft unklar, wo eine Akte gerade liegt, wer als Nächstes handeln muss und welche Entscheidungen schon getroffen wurden.

JusticePro bildet den kompletten Weg einer Akte digital ab, von der Registrierung einer Anzeige (*Plainte*) bis zum Urteil (*Verdict*). Die Anwendung ist an den Ablauf der Justiz in der Demokratischen Republik Kongo angelehnt, deshalb sind die Fachbegriffe in der Oberfläche auf Französisch.

## Funktionen

- **Login mit Rollen:** Anmeldung über JWT-Token. Jede Rolle sieht nur die Aktionen, die sie ausführen darf:
  Greffier, Procureur Général, Procureur, Président du Tribunal, Juge d'Instruction, Avocat und Admin.
- **Workflow für zwei Verfahrenswege:**
  - *Voie Pénale* (Strafverfahren): Registrierung → Zuweisung durch den Procureur Général → Ermittlung → Entscheidung → Freigabe → Abschluss
  - *Voie Civile* (Zivilverfahren): Registrierung → Zuweisung an eine Kammer → Bearbeitung durch die Kammer → Abschluss
  - Entscheidungen müssen von der vorgesetzten Rolle **bestätigt oder abgelehnt** werden.
- **Aktenverwaltung:** Akten anlegen, bearbeiten, suchen und filtern (aktiv / geschlossen / alle), Archiv
- **Personen:** Kläger (*Plaignant*), Verdächtige (*Suspect*) und Anwälte (*Avocat*) erfassen und zuordnen
- **Dokumente:** Anhänge zu Akten und Personaldokumenten hochladen
- **PDF-Erstellung:** Benachrichtigungen werden automatisch als PDF erzeugt (OpenPDF)
- **Verlauf und Notizen:** Jede Änderung an einer Akte wird im Verlauf gespeichert, dazu kommen Anmerkungen pro Akte
- **Administration:** Benutzer, Instanzen (Gerichte / Staatsanwaltschaften), Städte und Anwaltskammern verwalten

## Technologien

| Bereich | Technologien |
|---|---|
| Backend | Java, Spring Boot, Spring Web (REST-API), Spring Security, JWT, Spring Data JPA / Hibernate, Lombok, OpenPDF, Maven |
| Datenbank | PostgreSQL |
| Frontend | React, Vite, React Router, Axios |
| Infrastruktur | Docker (PostgreSQL-Datenbank) |

## Projektstruktur

```
JusticePro/
├── backend/            Spring-Boot-Anwendung (REST-API)
│   └── src/main/java/com/codesoupir/justicepro/
│       ├── controller/   REST-Endpunkte
│       ├── service/      Geschäftslogik und Workflow
│       ├── repository/   Datenbankzugriff (Spring Data JPA)
│       ├── model/        Entitäten (Dossier, Plainte, Verdict, …)
│       ├── dto/          Anfrage- und Antwortobjekte
│       ├── security/     JWT-Login und Rechteprüfung
│       └── enums/        Rollen, Workflow-Stufen, Status
├── frontend/           React-Anwendung (Vite)
│   └── src/
│       ├── pages/        Seiten (Akten, Archiv, Admin, …)
│       ├── components/   Formulare, Aktionen je Rolle, Verlauf
│       ├── context/      Login-Zustand
│       └── services/     API-Anbindung (Axios)
└── docker-compose.yml  PostgreSQL-Datenbank
```

## Lokal starten

**Voraussetzungen:** Java (Version siehe `backend/pom.xml`), Node.js, Docker

**1. Datenbank starten**
```bash
docker compose up -d
```

**2. Backend starten** (läuft auf http://localhost:8080)
```bash
cd backend
./mvnw spring-boot:run
```

**3. Frontend starten** (läuft auf http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```

**4. Anmelden**
Beim ersten Start wird automatisch ein Administrator angelegt:
Matrikelnummer `ADMIN001`, Passwort `admin123`. Bitte nach dem ersten Login ändern.

### Konfiguration

Datenbank und JWT-Schlüssel können über Umgebungsvariablen gesetzt werden:
`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`.
Ohne Angabe werden die Werte für die lokale Entwicklung verwendet (siehe `backend/src/main/resources/application.properties`).

## Autor

**Andre Soupir Phemba**
Informatiker (Bachelor) · Masterstudent Informatik an der TU Darmstadt
