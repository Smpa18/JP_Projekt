import { useState } from "react";
import PlainteFormModifier from "./PlainteFormModifier";
import api from "../services/api";
import "./GreffierActions.css";

/**
 * Aktionen für den Procureur auf der Dossier-Detailseite.
 *  - Voir la plainte (editierbar, kein Stade-Check)
 *  - Procès verbal d'audition + Carnet personnel
 *  - Annexer au dossier
 */
export default function ProcureurActions({ dossierId }) {

    const [vueActive, setVueActive] = useState(null);
    const [plainte, setPlainte] = useState(null);
    const [chargement, setChargement] = useState(false);
    const [procesVerbal, setProcessVerbal] = useState("");
    const [carnetPersonnel, setCarnetPersonnel] = useState("");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [message, setMessage] = useState(null);

    function toggleVue(vue) {
        if (vueActive === vue) {
            setVueActive(null);
        } else {
            setVueActive(vue);
            setMessage(null);
            if (vue === "procesVerbal") chargerProcessVerbal();
        }
    }

    async function chargerProcessVerbal() {
        setChargement(true);
        try {
            const response = await api.get(`/dossiers/${dossierId}/plainte`);
            setPlainte(response.data);
            setProcessVerbal(response.data.procesVerbalAudition || "");
            setCarnetPersonnel(response.data.carnetPersonnel || "");
        } catch {
            setMessage({ type: "erreur", texte: "Erreur lors du chargement." });
        } finally {
            setChargement(false);
        }
    }

    async function sauvegarderProcessVerbal() {
        if (!plainte) return;
        setEnvoiEnCours(true);
        setMessage(null);
        try {
            await api.put(`/dossiers/${dossierId}/plainte/libre`, {
                plaignantNom: plainte.plaignant?.nom || "",
                plaignantPostNom: plainte.plaignant?.postNom || "",
                plaignantPrenom: plainte.plaignant?.prenom || "",
                plaignantSexe: plainte.plaignant?.sexe || "",
                plaignantLieuNaissance: plainte.plaignant?.lieuNaissance || "",
                plaignantVillageOrigine: plainte.plaignant?.villageOrigine || "",
                plaignantSecteur: plainte.plaignant?.secteur || "",
                plaignantTerritoire: plainte.plaignant?.territoire || "",
                plaignantAssistance: plainte.plaignant?.assistance || false,
                plaignantEtatCivil: plainte.plaignant?.etatCivil || "",
                plaignantNomPere: plainte.plaignant?.nomPere || "",
                plaignantNomMere: plainte.plaignant?.nomMere || "",
                plaignantNombreEnfants: plainte.plaignant?.nombreEnfants || null,
                plaignantNumeroTelephone: plainte.plaignant?.numeroTelephone || "",
                plaignantAdresseEmail: plainte.plaignant?.adresseEmail || "",
                plaignantAdresse: plainte.plaignant?.adresse || "",
                plaignantNationalite: plainte.plaignant?.nationalite || "",
                numerosOrdrePlaignant: (plainte.avocatsPlaignant || []).map(a => a.numeroOrdre).filter(Boolean),
                suspects: (plainte.suspects || []).map(s => ({
                    nom: s.nom || "", postNom: s.postNom || "", prenom: s.prenom || "",
                    sexe: s.sexe || "", lieuNaissance: s.lieuNaissance || "",
                    villageOrigine: s.villageOrigine || "", secteur: s.secteur || "",
                    territoire: s.territoire || "", assistance: s.assistance || false,
                    etatCivil: s.etatCivil || "", nomPere: s.nomPere || "",
                    nomMere: s.nomMere || "", nombreEnfants: s.nombreEnfants || null,
                    numeroTelephone: s.numeroTelephone || "", adresseEmail: s.adresseEmail || "",
                    adresse: s.adresse || "", nationalite: s.nationalite || "",
                })),
                numerosOrdreSuspect: (plainte.avocatsSuspect || []).map(a => a.numeroOrdre).filter(Boolean),
                descriptionPlainte: plainte.descriptionPlainte || "",
                procesVerbalAudition: procesVerbal,
                observation: plainte.observation || "",
                carnetPersonnel: carnetPersonnel,
                chargeRelaxion: plainte.chargeRelaxion || "",
            });
            setMessage({ type: "succes", texte: "Procès verbal sauvegardé avec succès." });
        } catch (err) {
            setMessage({ type: "erreur", texte: err.response?.data?.erreur || "Erreur lors de la sauvegarde." });
        } finally {
            setEnvoiEnCours(false);
        }
    }

    return (
        <div className="procureur-actions-card">
            <h3>Consulter le dossier</h3>

            {message && (
                <p className={`greffier-message greffier-message-${message.type}`}>
                    {message.texte}
                </p>
            )}

            <ul className="greffier-actions-list">
                <li
                    className={`greffier-action-item ${vueActive === "plainte" ? "actif" : ""}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleVue("plainte"); }}
                >
                    Voir la plainte
                </li>
                <li
                    className={`greffier-action-item ${vueActive === "procesVerbal" ? "actif" : ""}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleVue("procesVerbal"); }}
                >
                    Procès verbal d'audition
                </li>
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

            {/* Procès verbal + Carnet personnel */}
            {vueActive === "procesVerbal" && (
                <div className="greffier-action-detail">
                    {chargement && <p>Chargement...</p>}
                    {!chargement && (
                        <>
                            <div className="plainte-description-card" style={{ marginBottom: "20px" }}>
                                <label>Procès verbal d'audition</label>
                                <textarea
                                    rows={20}
                                    value={procesVerbal}
                                    onChange={(e) => setProcessVerbal(e.target.value)}
                                    placeholder="Rédigez le procès verbal d'audition ici..."
                                    className="plainte-textarea-grand"
                                    style={{ minHeight: "400px", width: "100%" }}
                                />
                            </div>
                            <div className="plainte-description-card" style={{ marginBottom: "20px" }}>
                                <label>Carnet personnel</label>
                                <textarea
                                    rows={10}
                                    value={carnetPersonnel}
                                    onChange={(e) => setCarnetPersonnel(e.target.value)}
                                    placeholder="Notes personnelles..."
                                    className="plainte-textarea-grand"
                                    style={{ minHeight: "200px", width: "100%" }}
                                />
                            </div>
                            <div className="plainte-modifier-actions">
                                <button onClick={sauvegarderProcessVerbal} disabled={envoiEnCours}>
                                    {envoiEnCours ? "Sauvegarde..." : "Sauvegarder le procès verbal"}
                                </button>
                                <button type="button" onClick={() => setVueActive(null)}>Fermer</button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Annexer */}
            {vueActive === "annexer" && (
                <div className="greffier-action-detail">
                    <AnnexerForm dossierId={dossierId} onFermer={() => setVueActive(null)} />
                </div>
            )}
        </div>
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