import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Plainte from "./pages/Plainte.jsx";
import Dossiers from "./pages/Dossiers.jsx";
import DossierDetail from "./pages/DossierDetail.jsx";
import ActionsEnAttente from "./pages/ActionsEnAttente.jsx";
import TousDossiers from "./pages/TousDossiers.jsx";
import Administrator from "./pages/Administrator.jsx";

/**
 * Haupt-Router der App.
 * Definiert alle Seiten und ihre URLs.
 *
 * ROUTEN:
 *  /                    → Startseite
 *  /plainte             → Neue Plainte erstellen (Greffier)
 *  /dossiers            → Dossiers Liste (rollenspezifisch gefiltert)
 *  /dossiers/:id        → Dossier Detailansicht + Workflow-Aktionen
 *  /actions-en-attente  → Dossiers die eine Aktion brauchen
 *  /tous-dossiers       → Alle Dossiers aller Instances (read-only)
 *                         Archivierte Dossiers (FERME + 5 Jahre) sind
 *                         hier ebenfalls suchbar mit Datumsfilter.
 *  /administrator       → Benutzerverwaltung, Instances, Barreaux
 */
function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plainte" element={<Plainte />} />
            <Route path="/dossiers" element={<Dossiers />} />
            <Route path="/dossiers/:id" element={<DossierDetail />} />
            <Route path="/actions-en-attente" element={<ActionsEnAttente />} />
            <Route path="/administrator" element={<Administrator />} />
            <Route path="/tous-dossiers" element={<TousDossiers />} />
        </Routes>
    );
}

export default App;