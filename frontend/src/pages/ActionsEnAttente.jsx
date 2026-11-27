import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Dossiers.css";

/**
 * Stades die für jede Rolle "Handlungsbedarf" bedeuten.
 * Muss zur Logik in DossierDetail.jsx passen.
 *
 * WICHTIG: DEMANDE_MAP wurde für PROCUREUR_GENERAL hinzugefügt —
 * wenn ein Procureur die MAP-Anfrage stellt, muss der PG in
 * "Dossiers en cours" sehen dass er handeln muss.
 *
 * PROCUREUR hat DEMANDE_MAP NICHT in seiner Liste — er hat das
 * Dossier selbst in diesen Stade geschickt und wartet jetzt auf
 * den PG. Das Dossier verschwindet also aus seiner "Dossiers en cours"
 * Liste bis der PG geantwortet hat.
 *
 * ZUKÜNFTIG: wenn neue Stades hinzugefügt werden, hier ergänzen.
 */
const STADES_PAR_ROLE = {
    GREFFIER: ["ENREGISTRE", "MAP_VALIDE_P", "ASSIGNE_GREFF_T"],
    PROCUREUR_GENERAL: [
        "ASSIGNATION_PG",
        "VALIDATION_NOTIFICATION_MAP_P",
        "NOTIFICATION_MAP_P",
        "DEMANDE_MAP",   // NEU: P hat MAP-Anfrage gestellt, PG muss antworten
        "FERME"
    ],
    PROCUREUR: ["EN_INSTRUCTION_P", "NOTIFICATION_MAP_P"],
    PRESIDENT_TRIBUNAL: ["ASSIGNATION_PT", "FERME"],
    JUGE_INSTRUCTION: ["EN_INSTRUCTION_P", "EN_INSTRUCTION_CH", "MAPE", "MAP_VALIDE_CH"],
};

/**
 * Seite "Dossiers en cours" - zeigt NUR die Dossiers die
 * eine Aktion vom eingeloggten Benutzer brauchen.
 *
 * SICHTBARKEIT (geregelt im Backend DossierService.rechercher):
 *  - GREFFIER         → nur ENREGISTRE + FERME seiner Instance
 *  - PROCUREUR_GENERAL → nur droit=PENAL seiner Instance
 *  - PROCUREUR        → alle Dossiers seiner Instance (Access)
 *
 * FILTER IM FRONTEND:
 *  - Alle Rollen: nur Dossiers im richtigen Stade (STADES_PAR_ROLE)
 *  - PROCUREUR extra: nur Dossiers die IHM persönlich zugewiesen sind
 *    (procureurId === user.id), damit er nicht die Dossiers seiner
 *    Kollegen in "Dossiers en cours" sieht (die sieht er nur in
 *    "Dossiers" zur Konsultation).
 *
 * ZUKÜNFTIG: Paginierung hinzufügen.
 */
export default function ActionsEnAttente() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [numero, setNumero] = useState("");
    const [dateDe, setDateDe] = useState("");
    const [dateA, setDateA] = useState("");
    const [statut, setStatut] = useState("");
    const [procureur, setProcureur] = useState("");
    const [nomPlaignant, setNomPlaignant] = useState("");

    const [resultats, setResultats] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    useEffect(() => {
        chargerDossiers();
    }, []);

    /**
     * Filtert die rohe Dossier-Liste nach zwei Kriterien:
     *
     * 1. STADE: nur Dossiers im richtigen Stade für die aktuelle Rolle
     *    (definiert in STADES_PAR_ROLE oben).
     *
     * 2. PROCUREUR-EXTRA-FILTER: da das Backend alle Dossiers der
     *    Instance zurückgibt, müssen wir hier zusätzlich filtern:
     *    nur Dossiers die dem eingeloggten Procureur persönlich
     *    zugewiesen sind (d.procureurId === user.id).
     *    So sieht P1 nur seine eigenen Dossiers in "Dossiers en cours",
     *    auch wenn P2 in derselben Instance ist.
     */
    function filtrerDossiers(dossiers) {
        const stadesPertinents = STADES_PAR_ROLE[user?.role] || [];

        // Schritt 1: nach Stade filtern
        let filtres = dossiers.filter((d) => stadesPertinents.includes(d.stade));

        // Schritt 2: PROCUREUR sieht nur seine eigenen zugewiesenen Dossiers
        // user.id kommt aus AuthContext (wird beim Login gespeichert)
        // d.procureurId kommt aus DossierListDTO (wurde hinzugefügt)
        if (user?.role === "PROCUREUR") {
            filtres = filtres.filter((d) => d.procureurId === user.id);
        }

        return filtres;
    }

    // Lädt alle Dossiers beim ersten Laden der Seite.
    async function chargerDossiers() {
        setChargement(true);
        setErreur("");
        try {
            const response = await api.get("/dossiers");
            setResultats(filtrerDossiers(response.data));
        } catch {
            setErreur("Erreur lors du chargement des dossiers en cours.");
        } finally {
            setChargement(false);
        }
    }

    // Suche mit optionalen Filtern (Nummer, Datum, Status, Procureur, Plaignant).
    async function handleSearch(e) {
        e.preventDefault();
        setChargement(true);
        setErreur("");
        try {
            const params = {};
            if (numero) params.numero = numero;
            if (dateDe) params.dateDe = dateDe;
            if (dateA) params.dateA = dateA;
            if (statut) params.statut = statut;
            if (procureur) params.procureur = procureur;
            if (nomPlaignant) params.nomPlaignant = nomPlaignant;

            const response = await api.get("/dossiers", { params });
            setResultats(filtrerDossiers(response.data));
        } catch {
            setErreur("Erreur lors de la recherche.");
            setResultats([]);
        } finally {
            setChargement(false);
        }
    }

    function handleRowClick(id) { navigate(`/dossiers/${id}`); }

    return (
        <AppLayout>
            <h2 className="dossiers-title">Dossiers en cours</h2>
            <p className="dossiers-subtitle">
                Dossiers qui nécessitent une action de votre part ({user?.role}).
            </p>

            <form className="dossiers-search-card" onSubmit={handleSearch}>
                <div className="dossiers-search-grid">
                    <div className="form-field">
                        <label>Numéro du dossier</label>
                        <input
                            type="text"
                            value={numero}
                            onChange={(e) => setNumero(e.target.value)}
                            placeholder="Ex: DOS-2026-000001"
                        />
                    </div>
                    <div className="form-field">
                        <label>Date de</label>
                        <input type="date" value={dateDe} onChange={(e) => setDateDe(e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Date à</label>
                        <input type="date" value={dateA} onChange={(e) => setDateA(e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Status</label>
                        <select value={statut} onChange={(e) => setStatut(e.target.value)}>
                            <option value="">Tous</option>
                            <option value="ACTIF">Actif</option>
                            <option value="FERME">Fermé</option>
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Procureur</label>
                        <input
                            type="text"
                            value={procureur}
                            onChange={(e) => setProcureur(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label>Nom du plaignant</label>
                        <input
                            type="text"
                            value={nomPlaignant}
                            onChange={(e) => setNomPlaignant(e.target.value)}
                        />
                    </div>
                </div>
                <button type="submit" className="dossiers-search-button" disabled={chargement}>
                    {chargement ? "Recherche..." : "Chercher"}
                </button>
            </form>

            {erreur && <p className="dossiers-erreur">{erreur}</p>}
            {chargement && <p>Chargement...</p>}

            {!chargement && resultats.length === 0 && !erreur && (
                <p className="dossiers-aucun">Aucun dossier en cours pour le moment. 🎉</p>
            )}

            {!chargement && resultats.length > 0 && (
                <div className="dossiers-table-card">
                    <table className="dossiers-table">
                        <thead>
                        <tr>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Numéro du dossier</th>
                            <th>Procureur</th>
                            <th>Chambre</th>
                            <th>Juge d'instruction</th>
                            <th>Stade</th>
                        </tr>
                        </thead>
                        <tbody>
                        {resultats.map((d) => (
                            <tr
                                key={d.id}
                                onClick={() => handleRowClick(d.id)}
                                className="dossiers-row-clickable"
                            >
                                <td>
                                    <span className={`status-dot ${d.statut === "ACTIF" ? "status-actif" : "status-ferme"}`} />
                                </td>
                                <td>{d.dateCreation}</td>
                                <td>{d.numeroDossier}</td>
                                <td>{d.procureur || "-"}</td>
                                <td>{d.chambre || "-"}</td>
                                <td>{d.jugeInstruction || "-"}</td>
                                <td>{d.stade}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AppLayout>
    );
}