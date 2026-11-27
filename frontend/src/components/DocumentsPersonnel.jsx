import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import "./DocumentsPersonnel.css";

/**
 * Zeigt die Dokumente (Zeugnisse, Diplome, etc.) eines Mitarbeiters
 * an und erlaubt dem Admin, neue Dokumente hochzuladen oder zu löschen.
 *
 * Funktioniert wie "Annexer au dossier" beim Greffier:
 * - Admin wählt mehrere Dateien auf einmal aus (multiple-Input)
 * - Alle ausgewählten Dateien werden auf einmal hochgeladen
 * - Genre ist optional - wenn leer wird der Dateiname benutzt
 *
 * Props:
 *  - utilisateurId: ID des Mitarbeiters
 *  - nomMitarbeiter: Name des Mitarbeiters (für den Titel)
 */
export default function DocumentsPersonnel({ utilisateurId, nomMitarbeiter }) {

    const [documents, setDocuments] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [messageUpload, setMessageUpload] = useState(null);

    // Genre für alle ausgewählten Dateien (optional)
    const [genre, setGenre] = useState("");

    // Kommentar für alle ausgewählten Dateien (optional)
    const [commentaire, setCommentaire] = useState("");

    // ref auf den file-Input, damit wir ihn nach dem Upload leeren können
    const fileInputRef = useRef(null);

    // selectedFiles: Array der ausgewählten Dateien.
    // Wird direkt aus dem Input-Event befüllt (nicht über State-Update
    // des file-Inputs, da React file-Inputs nicht kontrollieren kann).
    const [selectedFiles, setSelectedFiles] = useState([]);

    // anzahlDateien: wird separat getrackt damit der Button-Text
    // immer aktuell ist, auch wenn selectedFiles sich ändert.
    const [anzahlDateien, setAnzahlDateien] = useState(0);

    useEffect(() => {
        chargerDocuments();
    }, [utilisateurId]);

    /**
     * Lädt alle Dokumente des Mitarbeiters vom Backend.
     * Wird beim ersten Laden und nach jedem Upload/Löschen aufgerufen.
     */
    async function chargerDocuments() {
        setChargement(true);
        try {
            const response = await api.get(`/admin/utilisateurs/${utilisateurId}/documents`);
            setDocuments(response.data);
        } catch {
            setErreur("Erreur lors du chargement des documents.");
        } finally {
            setChargement(false);
        }
    }

    /**
     * Speichert die vom Admin ausgewählten Dateien.
     * Array.from konvertiert FileList (Browser-Objekt) in ein
     * normales JavaScript-Array.
     * anzahlDateien wird separat gesetzt damit React den Button
     * sofort aktualisiert (React erkennt Array-Mutationen nicht immer).
     */
    function handleFilesChange(e) {
        const dateien = Array.from(e.target.files);
        console.log("Dateien ausgewählt:", dateien.length, dateien.map(f => f.name));
        setSelectedFiles(dateien);
        setAnzahlDateien(dateien.length);
    }

    /**
     * Lädt alle ausgewählten Dateien nacheinander hoch.
     * Jede Datei bekommt dasselbe Genre und denselben Kommentar.
     * Nach dem Upload wird das Formular geleert und die Liste
     * automatisch aktualisiert.
     */
    async function handleUpload() {
        console.log("handleUpload aufgerufen, selectedFiles:", selectedFiles.length);

        if (selectedFiles.length === 0) {
            setMessageUpload({
                type: "erreur",
                texte: "Veuillez sélectionner au moins un fichier."
            });
            return;
        }

        setEnvoiEnCours(true);
        setMessageUpload(null);

        try {
            // Jede Datei einzeln hochladen (sequenziell,
            // nicht parallel, um den Server nicht zu überlasten)
            for (const file of selectedFiles) {
                const formData = new FormData();
                formData.append("fichier", file);
                // Genre: wenn leer, wird der Dateiname als Genre benutzt
                formData.append("genre", genre.trim() || file.name);
                if (commentaire) formData.append("commentaire", commentaire);

                await api.post(
                    `/admin/utilisateurs/${utilisateurId}/documents`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
            }

            setMessageUpload({
                type: "succes",
                texte: `${selectedFiles.length} document(s) ajouté(s) avec succès.`
            });

            // Formular nach Erfolg komplett leeren
            setSelectedFiles([]);
            setAnzahlDateien(0);
            setGenre("");
            setCommentaire("");
            if (fileInputRef.current) fileInputRef.current.value = "";

            chargerDocuments(); // Liste aktualisieren

        } catch (err) {
            console.error("Upload Fehler:", err);
            setMessageUpload({
                type: "erreur",
                texte: "Erreur lors de l'envoi: " + (err.response?.data?.erreur || err.message)
            });
        } finally {
            setEnvoiEnCours(false);
        }
    }

    /**
     * Löscht ein einzelnes Dokument des Mitarbeiters.
     * Löscht sowohl den Datenbank-Eintrag als auch die physische Datei.
     */
    async function handleSupprimer(documentId) {
        try {
            await api.delete(`/admin/documents/${documentId}`);
            chargerDocuments();
        } catch {
            setErreur("Erreur lors de la suppression.");
        }
    }

    return (
        <div className="docs-personnel-card">
            <h3>Documents de {nomMitarbeiter}</h3>
            <p className="docs-personnel-subtitle">
                Bulletins, diplômes, certificats et autres documents officiels.
            </p>

            {erreur && <p className="docs-personnel-erreur">{erreur}</p>}

            {/* ----- Liste der bestehenden Dokumente ----- */}
            {chargement && <p>Chargement...</p>}
            {!chargement && documents.length === 0 && (
                <p className="docs-personnel-aucun">Aucun document pour ce personnel.</p>
            )}

            <div className="docs-personnel-liste">
                {documents.map((d) => (
                    <div key={d.id} className="doc-personnel-item">
                        <div className="doc-personnel-info">
                            {/* Genre in Großbuchstaben */}
                            <span className="doc-personnel-genre">{d.genre}</span>
                            {/* Originaler Dateiname */}
                            <span className="doc-personnel-nom">{d.nomFichier}</span>
                            {/* Datum des Uploads */}
                            {d.dateAjout && (
                                <span className="doc-personnel-date">{d.dateAjout}</span>
                            )}
                            {/* Kommentar (falls vorhanden) */}
                            {d.commentaire && (
                                <span className="doc-personnel-commentaire">{d.commentaire}</span>
                            )}
                        </div>
                        {/* Löschen-Button - nur Admin sieht diese Seite */}
                        <button
                            type="button"
                            className="doc-personnel-supprimer"
                            onClick={() => handleSupprimer(d.id)}
                            title="Supprimer ce document"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            {/* ----- Upload-Meldung ----- */}
            {messageUpload && (
                <p className={`docs-personnel-message docs-personnel-message-${messageUpload.type}`}>
                    {messageUpload.texte}
                </p>
            )}

            {/* ----- Upload-Bereich ----- */}
            <div className="doc-upload-bloc">

                {/* Mehrere Dateien auf einmal auswählen (multiple=true).
                    ref erlaubt es, den Input nach dem Upload zu leeren.
                    onChange ruft handleFilesChange auf, das die Dateien
                    in selectedFiles speichert. */}
                <div className="doc-upload-field">
                    <label>Sélectionner les fichiers</label>
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFilesChange}
                    />
                    {/* Zeigt Namen der ausgewählten Dateien zur Bestätigung */}
                    {anzahlDateien > 0 && (
                        <p className="doc-upload-count">
                            ✅ {anzahlDateien} fichier(s) sélectionné(s) :{" "}
                            {selectedFiles.map(f => f.name).join(", ")}
                        </p>
                    )}
                </div>

                {/* Genre: gilt für alle ausgewählten Dateien.
                    Optional - wenn leer wird der Dateiname benutzt. */}
                <div className="doc-upload-field">
                    <label>Genre (optionnel)</label>
                    <input
                        type="text"
                        placeholder="ex: Diplôme, Certificat, Attestation..."
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                    />
                </div>

                {/* Kommentar: gilt für alle ausgewählten Dateien */}
                <div className="doc-upload-field">
                    <label>Commentaire (optionnel)</label>
                    <input
                        type="text"
                        placeholder="ex: Diplôme de droit 2015..."
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                    />
                </div>

                {/* Upload-Button: type="button" verhindert ungewollten
                    Form-Submit des äußeren Formulars in Administrator.jsx.
                    Ist disabled solange keine Dateien ausgewählt sind.
                    Benutzt anzahlDateien (nicht selectedFiles.length) damit
                    React den Button sofort aktualisiert. */}
                <button
                    type="button"
                    className="doc-upload-envoyer"
                    disabled={envoiEnCours || anzahlDateien === 0}
                    onClick={handleUpload}
                >
                    {envoiEnCours
                        ? "Envoi en cours..."
                        : anzahlDateien > 0
                            ? `Annexer ${anzahlDateien} document(s)`
                            : "Sélectionner des fichiers d'abord"}
                </button>
            </div>
        </div>
    );
}