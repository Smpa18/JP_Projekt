import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import "./Dossiers.css";

/**
 * Seite "Dossiers" - Suche mit Filtern nach Nummer, Datum, Status, Procureur, Plaignant.
 * Zeigt nur Dossiers der eigenen Instance (geregelt im Backend).
 */
export default function Dossiers() {
    const navigate = useNavigate();

    const [numero, setNumero] = useState("");
    const [dateDe, setDateDe] = useState("");
    const [dateA, setDateA] = useState("");
    const [statut, setStatut] = useState("");
    const [procureur, setProcureur] = useState("");
    const [nomPlaignant, setNomPlaignant] = useState("");

    const [resultats, setResultats] = useState([]);
    const [recherche, setRecherche] = useState(false);
    const [erreur, setErreur] = useState("");

    async function handleSearch(e) {
        e.preventDefault();
        setRecherche(true);
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
            setResultats(response.data);
        } catch {
            setErreur("Erreur lors de la recherche des dossiers.");
            setResultats([]);
        } finally {
            setRecherche(false);
        }
    }

    function handleRowClick(id) { navigate(`/dossiers/${id}`); }

    return (
        <AppLayout>
            <h2 className="dossiers-title">Dossiers</h2>
            <p className="dossiers-subtitle">
                Recherchez un dossier. Cliquez sur une ligne pour voir les détails.
            </p>

            <form className="dossiers-search-card" onSubmit={handleSearch}>
                <div className="dossiers-search-grid">
                    <div className="form-field">
                        <label>Numéro du dossier</label>
                        <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: DOS-2026-000001" />
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
                        <input type="text" value={procureur} onChange={(e) => setProcureur(e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Nom du plaignant</label>
                        <input type="text" value={nomPlaignant} onChange={(e) => setNomPlaignant(e.target.value)} />
                    </div>
                </div>
                <button type="submit" className="dossiers-search-button" disabled={recherche}>
                    {recherche ? "Recherche..." : "Chercher"}
                </button>
            </form>

            {erreur && <p className="dossiers-erreur">{erreur}</p>}

            {resultats.length > 0 && (
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
                            <tr key={d.id} onClick={() => handleRowClick(d.id)} className="dossiers-row-clickable">
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

            {resultats.length === 0 && !recherche && (
                <p className="dossiers-aucun">
                    Aucun résultat. Utilisez le formulaire ci-dessus pour rechercher un dossier.
                </p>
            )}
        </AppLayout>
    );
}