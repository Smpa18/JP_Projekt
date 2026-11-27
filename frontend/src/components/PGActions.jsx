import { useState } from "react";
import PlainteFormModifier from "./PlainteFormModifier";
import PiecesJointes from "./PiecesJointes";
import api from "../services/api";
import "./GreffierActions.css";

/**
 * Aktionen für den Procureur Général auf der Dossier-Detailseite.
 *  - Voir la plainte (editierbar, kein Stade-Check)
 *  - Annexer au dossier
 *  - Pièces jointes (liste + löschen)
 */
export default function PGActions({ dossierId }) {

    const [vueActive, setVueActive] = useState(null);
    const [message, setMessage] = useState(null);

    function toggleVue(vue) {
        if (vueActive === vue) {
            setVueActive(null);
        } else {
            setVueActive(vue);
            setMessage(null);
        }
    }

    return (
        <>
            <div className="procureur-actions-card">
                <h3>Consulter le dossier</h3>

                {message && (
                    <p className={`greffier-message greffier-message-${message.type}`}>
                        {message.texte}
                    </p>
                )}

                <ul className="greffier-actions-list">

                    {/* Voir la plainte — editierbar, kein Stade-Check */}
                    <li
                        className={`greffier-action-item ${vueActive === "plainte" ? "actif" : ""}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleVue("plainte"); }}
                    >
                        Voir la plainte
                    </li>

                    {/* Annexer au dossier */}
                    <li
                        className={`greffier-action-item ${vueActive === "annexer" ? "actif" : ""}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleVue("annexer"); }}
                    >
                        Annexer au dossier
                    </li>

                </ul>

                {/* Plainte editierbar — endpointLibre=true (kein Stade-Check) */}
                {vueActive === "plainte" && (
                    <div className="greffier-action-detail">
                        <PlainteFormModifier
                            dossierId={dossierId}
                            onSauvegarde={() => setVueActive(null)}
                            cacherProcessVerbal={true}
                            endpointLibre={true}
                        />
                    </div>
                )}

                {/* Annexer */}
                {vueActive === "annexer" && (
                    <div className="greffier-action-detail">
                        <AnnexerForm dossierId={dossierId} onFermer={() => setVueActive(null)} />
                    </div>
                )}
            </div>

            {/* Pièces jointes — direkt unter der Karte */}
            <PiecesJointes dossierId={dossierId} peutSupprimer={true} />
        </>
    );
}

function AnnexerForm({ dossierId, onFermer }) {
    const [fichiers, setFichiers] = useState([{ file: null, genre: "", commentaire: "" }]);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [messageUpload, setMessageUpload] = useState(null);

    function ajouterLigne() {
        setFichiers((prev) => [...prev, { file: null, genre: "", commentaire: "" }]);
    }

    function updateLigne(index, champ, valeur) {
        setFichiers((prev) => prev.map((f, i) => (i === index ? { ...f, [champ]: valeur } : f)));
    }

    function supprimerLigne(index) {
        setFichiers((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleUploadTout(e) {
        e.preventDefault();
        e.stopPropagation();
        const lignesValides = fichiers.filter((f) => f.file && f.genre.trim());
        if (lignesValides.length === 0) return;
        setEnvoiEnCours(true);
        setMessageUpload(null);
        try {
            for (const ligne of lignesValides) {
                const formData = new FormData();
                formData.append("fichier", ligne.file);
                formData.append("genre", ligne.genre);
                if (ligne.commentaire) formData.append("commentaire", ligne.commentaire);
                await api.post(`/dossiers/${dossierId}/pieces`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            setMessageUpload({ type: "succes", texte: `${lignesValides.length} pièce(s) annexée(s) avec succès.` });
            setFichiers([]);
        } catch {
            setMessageUpload({ type: "erreur", texte: "Erreur lors de l'envoi des pièces." });
        } finally {
            setEnvoiEnCours(false);
        }
    }

    return (
        <>
            {messageUpload && (
                <p className={`greffier-message greffier-message-${messageUpload.type}`}>
                    {messageUpload.texte}
                </p>
            )}
            <form onSubmit={handleUploadTout}>
                {fichiers.map((ligne, index) => (
                    <div key={index} className="annexer-ligne">
                        <input type="file" onChange={(e) => updateLigne(index, "file", e.target.files[0])} />
                        <input type="text" placeholder="Genre (ex: Photo, PV, Certificat...)"
                               value={ligne.genre} onChange={(e) => updateLigne(index, "genre", e.target.value)} />
                        <input type="text" placeholder="Commentaire (optionnel)"
                               value={ligne.commentaire} onChange={(e) => updateLigne(index, "commentaire", e.target.value)} />
                        <button type="button" className="annexer-supprimer-ligne"
                                onClick={() => supprimerLigne(index)}>✕</button>
                    </div>
                ))}
                <button type="button" className="annexer-ajouter-ligne" onClick={ajouterLigne}>
                    + Ajouter une pièce
                </button>
                {fichiers.length > 0 && (
                    <button type="submit" className="annexer-envoyer" disabled={envoiEnCours}>
                        {envoiEnCours ? "Envoi en cours..." : `Annexer ${fichiers.filter(f => f.file).length} pièce(s)`}
                    </button>
                )}
            </form>
            <button type="button" className="annexer-ajouter-ligne" style={{ marginTop: "8px" }} onClick={onFermer}>
                Fermer
            </button>
        </>
    );
}