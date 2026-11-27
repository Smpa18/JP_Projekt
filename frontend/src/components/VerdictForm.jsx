import { useState } from "react";
import "./VerdictForm.css";

/**
 * Formular "Fermeture de procédure" - entspricht exakt dem Mockup:
 * 4 Checkboxen (Condamnation, Sursis, Liberté provisoire, Incarceration)
 * + bei Incarceration zusätzlich: Lieu, Date de/à, Durée (automatisch berechnet).
 *
 * Props:
 *  - onConfirmer: Funktion, die mit den fertigen Verdict-Daten aufgerufen wird
 *  - onAnnuler: Funktion zum Abbrechen (schließt das Formular wieder)
 */
export default function VerdictForm({ onConfirmer, onAnnuler }) {
    const [texteVerdict, setTexteVerdict] = useState("");
    const [condamnation, setCondamnation] = useState(false);
    const [sursis, setSursis] = useState(false);
    const [liberteProvisoire, setLiberteProvisoire] = useState(false);
    const [incarceration, setIncarceration] = useState(false);

    const [lieuIncarceration, setLieuIncarceration] = useState("");
    const [incarcerationDe, setIncarcerationDe] = useState("");
    const [incarcerationA, setIncarcerationA] = useState("");

    // Berechnet die Anzahl Tage automatisch, sobald beide Daten gesetzt sind.
    // Entspricht der "31 J" Anzeige im Mockup.
    function calculerDuree() {
        if (!incarcerationDe || !incarcerationA) return null;
        const de = new Date(incarcerationDe);
        const a = new Date(incarcerationA);
        const diffMs = a - de;
        if (diffMs < 0) return null;
        return Math.round(diffMs / (1000 * 60 * 60 * 24));
    }

    const duree = calculerDuree();

    function handleSubmit(e) {
        e.preventDefault();
        onConfirmer({
            texteVerdict,
            condamnation,
            sursis,
            liberteProvisoire,
            incarceration,
            lieuIncarceration: incarceration ? lieuIncarceration : null,
            incarcerationDe: incarceration ? incarcerationDe : null,
            incarcerationA: incarceration ? incarcerationA : null,
        });
    }

    return (
        <form className="verdict-form" onSubmit={handleSubmit}>
            <h4>Fermeture de procédure</h4>

            <div className="verdict-field">
                <label>Texte du verdict</label>
                <textarea
                    rows={3}
                    value={texteVerdict}
                    onChange={(e) => setTexteVerdict(e.target.value)}
                    placeholder="Décrivez le jugement rendu..."
                />
            </div>

            {/* ----- Checkboxen, wie im Mockup ----- */}
            <div className="verdict-checkbox-row">
                <input
                    type="checkbox"
                    checked={condamnation}
                    onChange={(e) => setCondamnation(e.target.checked)}
                />
                <label>Condamnation</label>
            </div>

            <div className="verdict-checkbox-row">
                <input
                    type="checkbox"
                    checked={sursis}
                    onChange={(e) => setSursis(e.target.checked)}
                />
                <label>Sursis</label>
            </div>

            <div className="verdict-checkbox-row">
                <input
                    type="checkbox"
                    checked={liberteProvisoire}
                    onChange={(e) => setLiberteProvisoire(e.target.checked)}
                />
                <label>Liberté provisoire</label>
            </div>

            <div className="verdict-checkbox-row">
                <input
                    type="checkbox"
                    checked={incarceration}
                    onChange={(e) => setIncarceration(e.target.checked)}
                />
                <label>Incarceration</label>
            </div>

            {/* ----- Zusätzliche Felder NUR sichtbar, wenn Incarceration angehakt ----- */}
            {incarceration && (
                <div className="verdict-incarceration-details">
                    <div className="verdict-field">
                        <label>Lieu d'incarcération</label>
                        <input
                            type="text"
                            value={lieuIncarceration}
                            onChange={(e) => setLieuIncarceration(e.target.value)}
                            placeholder="Ex: Pr. Makala"
                        />
                    </div>

                    <div className="verdict-dates-row">
                        <div className="verdict-field">
                            <label>Date de</label>
                            <input
                                type="date"
                                value={incarcerationDe}
                                onChange={(e) => setIncarcerationDe(e.target.value)}
                            />
                        </div>
                        <div className="verdict-field">
                            <label>Date à</label>
                            <input
                                type="date"
                                value={incarcerationA}
                                onChange={(e) => setIncarcerationA(e.target.value)}
                            />
                        </div>
                        <div className="verdict-field">
                            <label>Durée</label>
                            {/* Wird automatisch berechnet - nicht editierbar */}
                            <input type="text" value={duree !== null ? `${duree} J` : "-"} disabled />
                        </div>
                    </div>
                </div>
            )}

            <div className="verdict-actions">
                <button type="submit" className="verdict-confirmer">Confirmer</button>
                <button type="button" className="verdict-annuler" onClick={onAnnuler}>Annuler</button>
            </div>
        </form>
    );
}