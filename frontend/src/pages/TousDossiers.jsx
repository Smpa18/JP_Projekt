import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Dossiers.css";

/**
 * Seite "Tous les dossiers" - zeigt ALLE Dossiers für alle Rollen,
 * unabhängig von Instance. Nur zum Lesen/Konsultieren.
 *
 * ARCHIV-LOGIK:
 * Dossiers die FERME sind UND deren dateFermeture mehr als 5 Jahre
 * zurückliegt werden als "Archivé" markiert (grauer Badge).
 * Sie bleiben suchbar — mit dem Datumsfilter kann man auch sehr
 * alte Dossiers finden.
 *
 * ZUGRIFFSRECHTE:
 *  - ADMIN → kann Dossiers öffnen (Klick auf Zeile → DossierDetail)
 *  - Alle anderen → nur Filter/Konsultation, kein Klick möglich
 *
 * Nutzt den Endpoint /api/dossiers/tous (kein Instance-Filter im Backend).
 *
 * ZUKÜNFTIG: Paginierung hinzufügen wenn viele Dossiers vorhanden.
 */
export default function TousDossiers() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // ----- Suchfelder -----
    const [numero, setNumero] = useState("");
    const [dateDe, setDateDe] = useState("");
    const [dateA, setDateA] = useState("");
    const [statut, setStatut] = useState("");
    const [procureur, setProcureur] = useState("");
    const [nomPlaignant, setNomPlaignant] = useState("");
    const [province, setProvince] = useState("");
    const [instance, setInstance] = useState("");

    // ----- Daten -----
    const [instances, setInstances] = useState([]);
    const [resultats, setResultats] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    // Provinces aus Instance-Liste extrahieren (für cascading Dropdown)
    const provinces = [...new Set(instances.map(i => i.province).filter(Boolean))].sort();

    // Instances nach gewählter Province filtern
    const instancesFiltrees = province
        ? instances.filter(i => i.province === province)
        : instances;

    // Beim ersten Laden: Instances + alle Dossiers laden
    useEffect(() => {
        async function init() {
            try {
                const r = await api.get("/instances");
                setInstances(r.data);
            } catch {}
            await chargerTous();
        }
        init();
    }, []);

    // Wenn Province gewählt wird → Instance zurücksetzen
    function handleProvinceChange(val) {
        setProvince(val);
        setInstance("");
    }

    /**
     * Lädt alle Dossiers über /api/dossiers/tous.
     * Keine Rollenfilterung im Backend — alle sehen alles.
     * Das DTO enthält archive=true für Dossiers die FERME + 5 Jahre alt sind.
     */
    async function chargerTous(params = {}) {
        setChargement(true);
        setErreur("");
        try {
            const response = await api.get("/dossiers/tous", { params });
            setResultats(response.data);
        } catch {
            setErreur("Erreur lors du chargement des dossiers.");
        } finally {
            setChargement(false);
        }
    }

    // Suche mit allen Filtern ausführen
    async function handleSearch(e) {
        e.preventDefault();
        const params = {};
        if (numero) params.numero = numero;
        if (dateDe) params.dateDe = dateDe;
        if (dateA) params.dateA = dateA;
        if (statut) params.statut = statut;
        if (procureur) params.procureur = procureur;
        if (nomPlaignant) params.nomPlaignant = nomPlaignant;
        if (province) params.province = province;
        if (instance) params.instance = instance;
        await chargerTous(params);
    }

    // Nur ADMIN kann Dossiers öffnen — alle anderen sehen nur die Liste
    function handleRowClick(id) {
        if (user?.role === "ADMIN") {
            navigate(`/dossiers/${id}`);
        }
    }

    return (
        <AppLayout>
            <h2 className="dossiers-title">Tous les dossiers</h2>
            <p className="dossiers-subtitle">
                Liste complète de tous les dossiers, toutes instances confondues.{" "}
                {user?.role === "ADMIN"
                    ? "Cliquez sur une ligne pour voir les détails."
                    : "Consultation uniquement."}
            </p>

            {/* ----- Suchformular ----- */}
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
                        <label>Statut</label>
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
                    <div className="form-field">
                        <label>Province</label>
                        <select value={province} onChange={(e) => handleProvinceChange(e.target.value)}>
                            <option value="">Toutes</option>
                            {provinces.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Instance</label>
                        <select value={instance} onChange={(e) => setInstance(e.target.value)}>
                            <option value="">Toutes</option>
                            {instancesFiltrees.map(i => (
                                <option key={i.id} value={i.nomInstance}>{i.nomInstance}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button type="submit" className="dossiers-search-button" disabled={chargement}>
                    {chargement ? "Recherche..." : "Chercher"}
                </button>
            </form>

            {erreur && <p className="dossiers-erreur">{erreur}</p>}
            {chargement && <p>Chargement...</p>}

            {!chargement && resultats.length === 0 && !erreur && (
                <p className="dossiers-aucun">Aucun dossier trouvé.</p>
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
                                className={user?.role === "ADMIN" ? "dossiers-row-clickable" : ""}
                            >
                                {/* Status-Punkt: grün=Actif, grau=Fermé
                                    Archivierte Dossiers (FERME + 5 Jahre) bekommen
                                    zusätzlich einen "Archivé" Badge */}
                                <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span className={`status-dot ${d.statut === "ACTIF" ? "status-actif" : "status-ferme"}`} />
                                        {/* Archivé Badge — erscheint nur wenn archive=true
                                            (FERME + dateFermeture mehr als 5 Jahre zurück) */}
                                        {d.archive && (
                                            <span style={{
                                                fontSize: "11px",
                                                fontWeight: "600",
                                                color: "#6b7280",
                                                backgroundColor: "#f3f4f6",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "4px",
                                                padding: "1px 6px",
                                            }}>
                                                🗄️ Archivé
                                            </span>
                                        )}
                                    </div>
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