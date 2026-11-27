import { useState } from "react";
import api from "../services/api";
import "./AvocatSearch.css";

/**
 * Such-Box für einen Avocat per Numéro de matricule.
 * Entspricht "#Recherche par numero matricule" im Mockup.
 *
 * Props:
 *  - onSelect: Funktion, die aufgerufen wird, wenn ein Avocat
 *              gefunden und ausgewählt wurde (übergibt dessen id)
 */
export default function AvocatSearch({ onSelect }) {
    const [matricule, setMatricule] = useState("");
    const [resultats, setResultats] = useState([]);
    const [avocatChoisi, setAvocatChoisi] = useState(null);
    const [recherche, setRecherche] = useState(false);

    async function handleSearch() {
        if (!matricule.trim()) return;

        setRecherche(true);
        try {
            const response = await api.get("/utilisateurs/recherche", {
                params: { matricule },
            });
            setResultats(response.data);
        } catch {
            setResultats([]);
        } finally {
            setRecherche(false);
        }
    }

    function handleChoisir(avocat) {
        setAvocatChoisi(avocat);
        setResultats([]); // Liste der Treffer ausblenden, sobald gewählt
        onSelect(avocat.id);
    }

    function handleEffacer() {
        setAvocatChoisi(null);
        setMatricule("");
        onSelect(null);
    }

    return (
        <div className="avocat-search">
            {/* Wenn schon ein Avocat gewählt wurde, zeigen wir nur dessen Namen
          + einen Knopf, um die Auswahl zu ändern. */}
            {avocatChoisi ? (
                <div className="avocat-selectionne">
          <span>
            ✓ {avocatChoisi.nom} {avocatChoisi.prenom} ({avocatChoisi.numeroMatricule})
          </span>
                    <button type="button" onClick={handleEffacer}>Changer</button>
                </div>
            ) : (
                <>
                    <div className="avocat-search-bar">
                        <input
                            type="text"
                            placeholder="Numéro de matricule de l'avocat"
                            value={matricule}
                            onChange={(e) => setMatricule(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <button type="button" onClick={handleSearch} disabled={recherche}>
                            {recherche ? "..." : "Chercher"}
                        </button>
                    </div>

                    {/* Liste der gefundenen Avocats zum Anklicken */}
                    {resultats.length > 0 && (
                        <ul className="avocat-resultats">
                            {resultats.map((a) => (
                                <li key={a.id} onClick={() => handleChoisir(a)}>
                                    {a.nom} {a.prenom} — {a.numeroMatricule}
                                </li>
                            ))}
                        </ul>
                    )}

                    {resultats.length === 0 && matricule && !recherche && (
                        <p className="avocat-aucun">Aucun avocat trouvé.</p>
                    )}
                </>
            )}
        </div>
    );
}