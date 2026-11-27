import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Dossiers.css";
import "./Archives.css";

/**
 * Seite "Archives" - digitales Registre aller Dossiers.
 *
 * NUR PROCUREUR_GENERAL darf diese Seite sehen —
 * alle anderen Rollen sehen eine Zugriffsverweigerung.
 *
 * Zeigt alle Dossiers der eigenen Instance in einer Tabelle.
 * Klick auf eine Zeile öffnet eine aufklappbare read-only
 * Detailansicht mit ALLEM was das Dossier enthält:
 *  - Informations générales (Stade, Classification, Qualification, Décision)
 *  - Plaignant (read-only)
 *  - Suspects (read-only)
 *  - Description de la plainte
 *  - Procès Verbal d'Audition
 *  - Notifications (MC, MA, AR, MAP etc.) mit 👁️ Voir + ⬇️ Download
 *  - Pièces jointes mit 👁️ Voir (im Browser öffnen) + ⬇️ Download
 *
 * FILTER: gleiche Filter wie Dossiers.jsx
 * (Nummer, Datum, Status, Procureur, Plaignant, Stade)
 */
export default function Archives() {

    // Eingeloggter Benutzer — wird für Zugriffsrechte geprüft
    const { user } = useAuth();

    // ----- Suchfelder (gleich wie Dossiers.jsx) -----
    const [numero, setNumero] = useState("");
    const [dateDe, setDateDe] = useState("");
    const [dateA, setDateA] = useState("");
    const [statut, setStatut] = useState("");
    const [procureur, setProcureur] = useState("");
    const [nomPlaignant, setNomPlaignant] = useState("");
    const [stade, setStade] = useState("");

    // ----- Ergebnisse -----
    const [resultats, setResultats] = useState([]);
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState("");

    // ----- Aufgeklapptes Dossier -----
    const [dossierOuvertId, setDossierOuvertId] = useState(null);
    const [dossierDetail, setDossierDetail] = useState(null);
    const [plainte, setPlainte] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [pieces, setPieces] = useState([]);
    const [chargementDetail, setChargementDetail] = useState(false);

    // Beim ersten Laden nur wenn PG
    useEffect(() => {
        if (user?.role === "PROCUREUR_GENERAL") {
            chargerDossiers();
        }
    }, [user]);

    /**
     * Lädt Dossiers über /api/dossiers/archives.
     * Backend prüft ob PG → gibt nur Dossiers der eigenen Instance zurück.
     * Optionale Filter werden als Query-Parameter mitgeschickt.
     */
    async function chargerDossiers(params = {}) {
        setChargement(true);
        setErreur("");
        try {
            const response = await api.get("/dossiers/archives", { params });
            setResultats(response.data);
        } catch (err) {
            if (err.response?.status === 403) {
                setErreur("Accès refusé — seul le Procureur Général peut consulter les archives.");
            } else {
                setErreur("Erreur lors du chargement des archives.");
            }
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
        if (stade) params.stade = stade;
        await chargerDossiers(params);
    }

    /**
     * Klappt ein Dossier auf oder zu.
     * Beim Aufklappen werden alle Details parallel geladen.
     */
    async function toggleDossier(id) {
        if (dossierOuvertId === id) {
            setDossierOuvertId(null);
            setDossierDetail(null);
            setPlainte(null);
            setNotifications([]);
            setPieces([]);
            return;
        }

        setDossierOuvertId(id);
        setChargementDetail(true);
        setDossierDetail(null);
        setPlainte(null);
        setNotifications([]);
        setPieces([]);

        try {
            const [dossierRes, plainteRes, notificationsRes, piecesRes] = await Promise.allSettled([
                api.get(`/dossiers/${id}`),
                api.get(`/dossiers/${id}/plainte`),
                api.get(`/dossiers/${id}/notifications`),
                api.get(`/dossiers/${id}/pieces`),
            ]);

            if (dossierRes.status === "fulfilled") setDossierDetail(dossierRes.value.data);
            if (plainteRes.status === "fulfilled") setPlainte(plainteRes.value.data);
            if (notificationsRes.status === "fulfilled") setNotifications(notificationsRes.value.data || []);
            if (piecesRes.status === "fulfilled") setPieces(piecesRes.value.data || []);
        } catch {
            // Fehler still ignorieren
        } finally {
            setChargementDetail(false);
        }
    }

    /**
     * Öffnet eine Notification als PDF im Browser (neuer Tab).
     */
    async function voirNotificationPdf(dossierId, notificationId) {
        try {
            const response = await api.get(
                `/dossiers/${dossierId}/notifications/${notificationId}/pdf`,
                { responseType: "blob" }
            );
            const blobUrl = window.URL.createObjectURL(
                new Blob([response.data], { type: "application/pdf" })
            );
            window.open(blobUrl, "_blank");
        } catch {
            alert("Erreur lors de l'ouverture du PDF.");
        }
    }

    /**
     * Lädt eine Notification als PDF herunter (direkt auf Disk).
     */
    async function telechargerNotificationPdf(dossierId, notificationId, type) {
        try {
            const response = await api.get(
                `/dossiers/${dossierId}/notifications/${notificationId}/pdf`,
                { responseType: "blob" }
            );
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `notification_${type}_${notificationId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            alert("Erreur lors du téléchargement du PDF.");
        }
    }

    /**
     * Öffnet eine Pièce jointe im Browser (neuer Tab).
     */
    async function voirPiece(pieceId) {
        try {
            const response = await api.get(
                `/dossiers/pieces/${pieceId}/download`,
                { responseType: "blob" }
            );
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            window.open(blobUrl, "_blank");
        } catch {
            alert("Erreur lors de l'ouverture du fichier.");
        }
    }

    /**
     * Lädt eine Pièce jointe herunter (direkt auf Disk).
     */
    async function telechargerPiece(pieceId, nomFichier) {
        try {
            const response = await api.get(
                `/dossiers/pieces/${pieceId}/download`,
                { responseType: "blob" }
            );
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = nomFichier;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            alert("Erreur lors du téléchargement de la pièce.");
        }
    }

    // ----- ZUGRIFFSKONTROLLE -----
    // Nicht-PG Rollen sehen sofort Fehlermeldung
    if (user?.role !== "PROCUREUR_GENERAL") {
        return (
            <AppLayout>
                <h2 className="dossiers-title">Archives</h2>
                <p className="dossiers-erreur" style={{ marginTop: "24px" }}>
                    🔒 Accès refusé — cette section est réservée au Procureur Général.
                </p>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <h2 className="dossiers-title">Archives</h2>
            <p className="dossiers-subtitle">
                Registre complet des dossiers de votre instance — consultation uniquement.
            </p>

            {/* ----- Suchformular (gleiche Filter wie Dossiers.jsx) ----- */}
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
                        <label>OMP (Procureur)</label>
                        <input
                            type="text"
                            value={procureur}
                            onChange={(e) => setProcureur(e.target.value)}
                            placeholder="Nom du procureur..."
                        />
                    </div>
                    <div className="form-field">
                        <label>Nom du plaignant</label>
                        <input
                            type="text"
                            value={nomPlaignant}
                            onChange={(e) => setNomPlaignant(e.target.value)}
                            placeholder="Ex: Kabila..."
                        />
                    </div>
                    {/* Stade-Filter: extra Filter spezifisch für Archives */}
                    <div className="form-field">
                        <label>Stade</label>
                        <select value={stade} onChange={(e) => setStade(e.target.value)}>
                            <option value="">Tous</option>
                            <option value="ENREGISTRE">Enregistré</option>
                            <option value="ASSIGNATION_PG">Assignation PG</option>
                            <option value="EN_INSTRUCTION_P">En instruction</option>
                            <option value="DEMANDE_MAP">Demande MAP</option>
                            <option value="NOTIFICATION_MAP_P">Notification MAP</option>
                            <option value="VALIDATION_NOTIFICATION_MAP_P">Validation MAP</option>
                            <option value="MAP_VALIDE_P">MAP validé</option>
                            <option value="MAPE">MAPE</option>
                            <option value="FERME">Fermé</option>
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

            {/* ----- Tabelle mit aufklappbaren Zeilen ----- */}
            {!chargement && resultats.length > 0 && (
                <div className="dossiers-table-card">
                    <table className="dossiers-table">
                        <thead>
                        <tr>
                            <th></th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Numéro du dossier</th>
                            <th>OMP</th>
                            <th>Stade</th>
                        </tr>
                        </thead>
                        <tbody>
                        {resultats.map((d) => (
                            <>
                                {/* ----- Zeile des Dossiers ----- */}
                                <tr
                                    key={d.id}
                                    onClick={() => toggleDossier(d.id)}
                                    className="dossiers-row-clickable"
                                    style={{ fontWeight: dossierOuvertId === d.id ? "bold" : "normal" }}
                                >
                                    <td style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                                        {dossierOuvertId === d.id ? "▼" : "▶"}
                                    </td>
                                    <td>
                                        <span className={`status-dot ${d.statut === "ACTIF" ? "status-actif" : "status-ferme"}`} />
                                    </td>
                                    <td>{d.dateCreation}</td>
                                    <td>{d.numeroDossier}</td>
                                    <td>{d.procureur || "-"}</td>
                                    <td>{d.stade}</td>
                                </tr>

                                {/* ----- Aufgeklappte Detailansicht ----- */}
                                {dossierOuvertId === d.id && (
                                    <tr key={`detail-${d.id}`}>
                                        <td colSpan={6} style={{ padding: 0 }}>
                                            <div className="archives-detail">

                                                {chargementDetail && (
                                                    <p style={{ padding: "16px" }}>Chargement du dossier...</p>
                                                )}

                                                {!chargementDetail && dossierDetail && (
                                                    <>
                                                        {/* ===== INFORMATIONS GÉNÉRALES ===== */}
                                                        <div className="archives-section">
                                                            <h4 className="archives-section-titre">📋 Informations générales</h4>
                                                            <div className="archives-info-grid">
                                                                <div><span className="archives-label">Numéro :</span> {dossierDetail.numeroDossier}</div>
                                                                <div><span className="archives-label">Date :</span> {dossierDetail.dateCreation}</div>
                                                                <div><span className="archives-label">Stade :</span> {dossierDetail.stade}</div>
                                                                <div><span className="archives-label">Statut :</span> {dossierDetail.statut}</div>
                                                                <div><span className="archives-label">Classification :</span> {dossierDetail.classifie ? dossierDetail.droit : "-"}</div>
                                                                <div><span className="archives-label">Qualification :</span> {dossierDetail.qualification || "-"}</div>
                                                                <div><span className="archives-label">OMP :</span> {dossierDetail.procureur ? `${dossierDetail.procureur.nom} ${dossierDetail.procureur.postNom || ""}` : "-"}</div>
                                                                <div><span className="archives-label">Instance :</span> {dossierDetail.instance?.nomInstance || "-"}</div>
                                                                <div><span className="archives-label">Province :</span> {dossierDetail.instance?.province || "-"}</div>
                                                                <div><span className="archives-label">Décision :</span> {
                                                                    dossierDetail.relaxion ? "Relaxion" :
                                                                        dossierDetail.detention ? "Détention" :
                                                                            dossierDetail.liberteProvisoire ? "Liberté provisoire" :
                                                                                dossierDetail.sansSuite ? "Sans suite" :
                                                                                    dossierDetail.fixation ? "Fixation" : "-"
                                                                }</div>
                                                            </div>
                                                        </div>

                                                        {/* ===== PLAIGNANT ===== */}
                                                        {plainte && plainte.plaignant && (
                                                            <div className="archives-section">
                                                                <h4 className="archives-section-titre">👤 Plaignant</h4>
                                                                <div className="archives-info-grid">
                                                                    <div><span className="archives-label">Nom :</span> {plainte.plaignant.nom || "-"}</div>
                                                                    <div><span className="archives-label">Post Nom :</span> {plainte.plaignant.postNom || "-"}</div>
                                                                    <div><span className="archives-label">Prénom :</span> {plainte.plaignant.prenom || "-"}</div>
                                                                    <div><span className="archives-label">Sexe :</span> {plainte.plaignant.sexe || "-"}</div>
                                                                    <div><span className="archives-label">État civil :</span> {plainte.plaignant.etatCivil || "-"}</div>
                                                                    <div><span className="archives-label">Téléphone :</span> {plainte.plaignant.numeroTelephone || "-"}</div>
                                                                    <div><span className="archives-label">Lieu de naissance :</span> {plainte.plaignant.lieuNaissance || "-"}</div>
                                                                    <div><span className="archives-label">Village d'origine :</span> {plainte.plaignant.villageOrigine || "-"}</div>
                                                                    <div><span className="archives-label">Territoire :</span> {plainte.plaignant.territoire || "-"}</div>
                                                                    <div><span className="archives-label">Assistance :</span> {plainte.plaignant.assistance ? "Oui" : "Non"}</div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* ===== SUSPECTS ===== */}
                                                        {plainte && plainte.suspects?.length > 0 && (
                                                            <div className="archives-section">
                                                                <h4 className="archives-section-titre">🔍 Suspects</h4>
                                                                {plainte.suspects.map((s, i) => (
                                                                    <div key={i} className="archives-info-grid" style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
                                                                        <div><span className="archives-label">Suspect {i + 1} :</span> {s.nom} {s.postNom} {s.prenom}</div>
                                                                        <div><span className="archives-label">Sexe :</span> {s.sexe || "-"}</div>
                                                                        <div><span className="archives-label">Téléphone :</span> {s.numeroTelephone || "-"}</div>
                                                                        <div><span className="archives-label">Lieu de naissance :</span> {s.lieuNaissance || "-"}</div>
                                                                        <div><span className="archives-label">Territoire :</span> {s.territoire || "-"}</div>
                                                                        <div><span className="archives-label">Assistance :</span> {s.assistance ? "Oui" : "Non"}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* ===== DESCRIPTION DE LA PLAINTE ===== */}
                                                        {plainte?.descriptionPlainte && (
                                                            <div className="archives-section">
                                                                <h4 className="archives-section-titre">📄 Description de la plainte</h4>
                                                                <p className="archives-texte">{plainte.descriptionPlainte}</p>
                                                            </div>
                                                        )}

                                                        {/* ===== PROCÈS VERBAL ===== */}
                                                        {plainte?.procesVerbalAudition && (
                                                            <div className="archives-section">
                                                                <h4 className="archives-section-titre">📝 Procès verbal d'audition</h4>
                                                                <p className="archives-texte">{plainte.procesVerbalAudition}</p>
                                                            </div>
                                                        )}

                                                        {/* ===== NOTIFICATIONS =====
                                                            👁️ Voir  = öffnet PDF im Browser
                                                            ⬇️ PDF   = lädt PDF herunter */}
                                                        {notifications.length > 0 && (
                                                            <div className="archives-section">
                                                                <h4 className="archives-section-titre">📬 Notifications</h4>
                                                                <table className="archives-table">
                                                                    <thead>
                                                                    <tr>
                                                                        <th>Type</th>
                                                                        <th>Date</th>
                                                                        <th>Émis par</th>
                                                                        <th>Actions</th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {notifications.map((n) => (
                                                                        <tr key={n.id}>
                                                                            <td>{n.type}</td>
                                                                            <td>{n.dateEmission || "-"}</td>
                                                                            <td>{n.emisPar ? `${n.emisPar.nom} ${n.emisPar.postNom || ""}` : "-"}</td>
                                                                            <td style={{ display: "flex", gap: "8px" }}>
                                                                                <button
                                                                                    className="archives-btn-voir"
                                                                                    onClick={(e) => { e.stopPropagation(); voirNotificationPdf(d.id, n.id); }}
                                                                                >
                                                                                    👁️ Voir
                                                                                </button>
                                                                                <button
                                                                                    className="archives-btn-download"
                                                                                    onClick={(e) => { e.stopPropagation(); telechargerNotificationPdf(d.id, n.id, n.type); }}
                                                                                >
                                                                                    ⬇️ PDF
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}

                                                        {/* ===== PIÈCES JOINTES =====
                                                            👁️ Voir     = öffnet Datei im Browser
                                                            ⬇️ Download = lädt Datei herunter */}
                                                        {pieces.length > 0 && (
                                                            <div className="archives-section">
                                                                <h4 className="archives-section-titre">📎 Pièces jointes</h4>
                                                                <table className="archives-table">
                                                                    <thead>
                                                                    <tr>
                                                                        <th>Genre</th>
                                                                        <th>Nom du fichier</th>
                                                                        <th>Date</th>
                                                                        <th>Commentaire</th>
                                                                        <th>Actions</th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {pieces.map((p) => (
                                                                        <tr key={p.id}>
                                                                            <td>{p.genre || "-"}</td>
                                                                            <td>{p.nomFichier}</td>
                                                                            <td>{p.dateAjout || "-"}</td>
                                                                            <td>{p.commentaire || "-"}</td>
                                                                            <td style={{ display: "flex", gap: "8px" }}>
                                                                                <button
                                                                                    className="archives-btn-voir"
                                                                                    onClick={(e) => { e.stopPropagation(); voirPiece(p.id); }}
                                                                                >
                                                                                    👁️ Voir
                                                                                </button>
                                                                                <button
                                                                                    className="archives-btn-download"
                                                                                    onClick={(e) => { e.stopPropagation(); telechargerPiece(p.id, p.nomFichier); }}
                                                                                >
                                                                                    ⬇️ Download
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}

                                                        {/* Hinweis wenn Dossier keine Inhalte hat */}
                                                        {!plainte && notifications.length === 0 && pieces.length === 0 && (
                                                            <p style={{ padding: "16px", color: "var(--color-text-muted)" }}>
                                                                Aucun contenu disponible pour ce dossier.
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AppLayout>
    );
}