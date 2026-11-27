import { useState, useEffect } from "react";
import api from "../services/api";
import "./AnnotationsList.css";

/**
 * Zeigt die Annotations (Notizen) eines Dossiers an und erlaubt
 * das Hinzufügen neuer Notizen.
 *
 * WICHTIG (passend zum Backend):
 *  - Type PUBLIQUE     -> von ALLEN Mitarbeitern sichtbar
 *  - Type PERSONNELLE  -> NUR vom Autor selbst sichtbar
 *
 * Props:
 *  - dossierId: ID des Dossiers, zu dem die Annotations gehören
 */
export default function AnnotationsList({ dossierId }) {
    const [annotations, setAnnotations] = useState([]);
    const [chargement, setChargement] = useState(true);

    const [nouveauContenu, setNouveauContenu] = useState("");
    const [nouveauType, setNouveauType] = useState("PUBLIQUE");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState("");

    useEffect(() => {
        chargerAnnotations();
    }, [dossierId]);

    async function chargerAnnotations() {
        setChargement(true);
        try {
            const response = await api.get(`/dossiers/${dossierId}/annotations`);
            setAnnotations(response.data);
        } catch {
            setErreur("Erreur lors du chargement des annotations.");
        } finally {
            setChargement(false);
        }
    }

    async function handleAjouter(e) {
        e.preventDefault();
        if (!nouveauContenu.trim()) return;

        setEnvoiEnCours(true);
        setErreur("");

        try {
            await api.post(`/dossiers/${dossierId}/annotations`, {
                contenu: nouveauContenu,
                type: nouveauType,
            });
            setNouveauContenu(""); // Formular leeren
            chargerAnnotations(); // Liste aktualisieren
        } catch {
            setErreur("Erreur lors de l'ajout de l'annotation.");
        } finally {
            setEnvoiEnCours(false);
        }
    }

    async function handleSupprimer(annotationId) {
        try {
            await api.delete(`/dossiers/annotations/${annotationId}`);
            chargerAnnotations();
        } catch {
            setErreur("Erreur lors de la suppression.");
        }
    }

    return (
        <div className="annotations-card">
            <h3>Annotations</h3>

            {chargement && <p>Chargement...</p>}
            {erreur && <p className="annotations-erreur">{erreur}</p>}

            {/* ----- Liste der bestehenden Annotations ----- */}
            {!chargement && annotations.length === 0 && (
                <p className="annotations-aucune">Aucune annotation pour ce dossier.</p>
            )}

            <div className="annotations-list">
                {annotations.map((a) => (
                    <div key={a.id} className="annotation-item">
                        <div className="annotation-header">
                            {/* Badge zeigt auf einen Blick, ob die Notiz öffentlich oder persönlich ist */}
                            <span className={`annotation-badge annotation-badge-${a.type.toLowerCase()}`}>
                {a.type === "PUBLIQUE" ? "Publique" : "Personnelle"}
              </span>
                            <span className="annotation-auteur">
                {a.auteur?.nom} {a.auteur?.prenom}
              </span>
                            <button
                                className="annotation-supprimer"
                                onClick={() => handleSupprimer(a.id)}
                                title="Supprimer cette annotation"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="annotation-contenu">{a.contenu}</p>
                    </div>
                ))}
            </div>

            {/* ----- Formular zum Hinzufügen einer neuen Annotation ----- */}
            <form className="annotation-form" onSubmit={handleAjouter}>
        <textarea
            rows={2}
            placeholder="Ajouter une note..."
            value={nouveauContenu}
            onChange={(e) => setNouveauContenu(e.target.value)}
        />
                <div className="annotation-form-footer">
                    <select value={nouveauType} onChange={(e) => setNouveauType(e.target.value)}>
                        <option value="PUBLIQUE">Publique (visible par tous)</option>
                        <option value="PERSONNELLE">Personnelle (visible par vous seul)</option>
                    </select>
                    <button type="submit" disabled={envoiEnCours}>
                        {envoiEnCours ? "Ajout..." : "Ajouter"}
                    </button>
                </div>
            </form>
        </div>
    );
}