import { useState, useEffect } from "react";
import api from "../services/api";
import "./PiecesJointes.css";

/**
 * Zeigt die Pièces jointes eines Dossiers an.
 * Erlaubt: Hochladen, Herunterladen, Öffnen, und optional Löschen.
 *
 * Props:
 *  - dossierId: ID des Dossiers
 *  - peutSupprimer: ob Löschen erlaubt ist (default: false)
 */
export default function PiecesJointes({ dossierId, peutSupprimer = false }) {
    const [pieces, setPieces] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    const [fichier, setFichier] = useState(null);
    const [genre, setGenre] = useState("");
    const [commentaire, setCommentaire] = useState("");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);

    useEffect(() => {
        chargerPieces();
    }, [dossierId]);

    async function chargerPieces() {
        setChargement(true);
        try {
            const response = await api.get(`/dossiers/${dossierId}/pieces`);
            setPieces(response.data);
        } catch {
            setErreur("Erreur lors du chargement des pièces.");
        } finally {
            setChargement(false);
        }
    }

    async function handleUpload(e) {
        e.preventDefault();
        if (!fichier || !genre.trim()) return;

        setEnvoiEnCours(true);
        setErreur("");

        try {
            const formData = new FormData();
            formData.append("fichier", fichier);
            formData.append("genre", genre);
            if (commentaire) formData.append("commentaire", commentaire);

            await api.post(`/dossiers/${dossierId}/pieces`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setFichier(null);
            setGenre("");
            setCommentaire("");
            chargerPieces();
        } catch {
            setErreur("Erreur lors de l'envoi du fichier.");
        } finally {
            setEnvoiEnCours(false);
        }
    }

    async function handleSupprimer(pieceId) {
        try {
            await api.delete(`/dossiers/pieces/${pieceId}`);
            chargerPieces();
        } catch {
            setErreur("Erreur lors de la suppression.");
        }
    }

    // Datei herunterladen
    async function telechargerPiece(pieceId, nomFichier) {
        try {
            const response = await api.get(`/dossiers/pieces/${pieceId}/download`, {
                responseType: "blob"
            });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = nomFichier;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            setErreur("Erreur lors du téléchargement.");
        }
    }

    // Datei im Browser öffnen (neuer Tab)
    async function ouvrirPiece(pieceId) {
        try {
            const response = await api.get(`/dossiers/pieces/${pieceId}/download`, {
                responseType: "blob"
            });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            window.open(blobUrl, "_blank");
        } catch {
            setErreur("Erreur lors de l'ouverture.");
        }
    }

    return (
        <div className="pieces-card">
            <h3>Pièces jointes</h3>

            {chargement && <p>Chargement...</p>}
            {erreur && <p className="pieces-erreur">{erreur}</p>}

            {!chargement && pieces.length === 0 && (
                <p className="pieces-aucune">Aucune pièce jointe pour ce dossier.</p>
            )}

            <div className="pieces-list">
                {pieces.map((p) => (
                    <div key={p.id} className="piece-item">
                        <div className="piece-info">
                            <span className="piece-genre">{p.genre}</span>
                            <span className="piece-nom">{p.nomFichier}</span>
                            {p.dateAjout && <span className="piece-date">{p.dateAjout}</span>}
                            {p.commentaire && <span className="piece-commentaire">{p.commentaire}</span>}
                        </div>

                        <div className="piece-actions">
                            {/* Herunterladen */}
                            <button
                                className="piece-telecharger"
                                onClick={() => telechargerPiece(p.id, p.nomFichier)}
                                title="Télécharger"
                            >
                                ⬇️
                            </button>
                            {/* Im Browser öffnen */}
                            <button
                                className="piece-ouvrir"
                                onClick={() => ouvrirPiece(p.id)}
                                title="Ouvrir dans le navigateur"
                            >
                                👁️
                            </button>
                            {/* Löschen nur wenn erlaubt */}
                            {peutSupprimer && (
                                <button
                                    className="piece-supprimer"
                                    onClick={() => handleSupprimer(p.id)}
                                    title="Supprimer ce document"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Formular zum Hochladen */}
            <form className="piece-form" onSubmit={handleUpload}>
                <div className="piece-form-row">
                    <input
                        type="file"
                        onChange={(e) => setFichier(e.target.files[0])}
                    />
                </div>
                <div className="piece-form-row">
                    <input
                        type="text"
                        placeholder="Genre (ex: PV, Photo, Certificat...)"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                    />
                </div>
                <div className="piece-form-row">
                    <input
                        type="text"
                        placeholder="Commentaire (optionnel)"
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                    />
                </div>
                <button type="submit" disabled={!fichier || !genre.trim() || envoiEnCours}>
                    {envoiEnCours ? "Envoi..." : "Ajouter une pièce"}
                </button>
            </form>
        </div>
    );
}