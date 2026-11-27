import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import VerdictForm from "../components/VerdictForm";
import AnnotationsList from "../components/AnnotationsList";
import GreffierActions from "../components/GreffierActions";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./DossierDetail.css";
import PiecesJointes from "../components/PiecesJointes";
import ProcureurActions from "../components/ProcureurActions";
import PGActions from "../components/PGActions";
import {HistoriqueDossier} from "../components/HistoriqueDossier";

/**
 * Detailansicht eines Dossiers.
 * Zeigt alle Infos + Workflow-Aktionen je nach Rolle/Stade.
 *
 * SICHTBARKEITS-LOGIK:
 *  - GREFFIER: GreffierActions bei ENREGISTRE/ASSIGNE_GREFF
 *  - PROCUREUR_GENERAL: PGActions + Actions disponibles IMMER
 *  - PROCUREUR: ProcureurActions wenn estMonDossier
 *  - Andere: nur Actions disponibles
 *
 * COMMUNIQUER LE DOSSIER — 5-stufiges Cascading:
 *  Province → Ville → Catégorie → Branche → Instance (Nom)
 */
export default function DossierDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [dossier, setDossier] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [message, setMessage] = useState(null);

    // ----- Info-Felder (Qualification, Checkboxen) -----
    const [qualification, setQualification] = useState("");
    const [relaxion, setRelaxion] = useState(false);
    const [detention, setDetention] = useState(false);
    const [liberteProvisoire, setLiberteProvisoire] = useState(false);
    const [sansSuite, setSansSuite] = useState(false);
    const [fixation, setFixation] = useState(false);
    const [sauvegardEnCours, setSauvegardEnCours] = useState(false);
    const [messageInfos, setMessageInfos] = useState(null);

    // ----- Workflow-Formular States -----
    const [procureurs, setProcureurs] = useState([]);
    const [procureurId, setProcureurId] = useState("");
    const [jugesInstruction, setJugesInstruction] = useState([]);
    const [jugeInstructionId, setJugeInstructionId] = useState("");
    const [chambre, setChambre] = useState("");
    const [afficherVerdictForm, setAfficherVerdictForm] = useState(false);

    // ----- Communiquer le dossier: 5-stufiges Cascading -----
    // Province → Ville → Catégorie → Branche → Instance (Nom)
    const [instances, setInstances] = useState([]);
    const [commProvince, setCommProvince] = useState("");
    const [commVille, setCommVille] = useState("");
    const [commCategorie, setCommCategorie] = useState("");
    const [commBranche, setCommBranche] = useState("");
    const [commInstanceId, setCommInstanceId] = useState("");

    // Feste Catégorie-Werte — gleich wie im Administrator
    const CATEGORIES_INSTANCE = [
        "Tripaix",
        "Tribunal de Grandes Instances",
        "Cours d'Appel",
        "Cours de Cassation",
        "Tribunal Administratif",
        "Cour Administrative d'Appel",
        "Conseil d'Etat",
        "Cour Constitutionnelle",
        "Tribunal Militaire de Garnison",
        "Cours Militaire",
        "Haute Cour Militaire",
    ];



    useEffect(() => {
        chargerDossier();
        chargerInstances();
    }, [id]);

    /**
     * Lädt das Dossier vom Backend.
     */
    async function chargerDossier() {
        setChargement(true);
        try {
            const response = await api.get(`/dossiers/${id}`);
            const d = response.data;
            setDossier(d);
            setQualification(d.qualification || "");
            setRelaxion(d.relaxion || false);
            setDetention(d.detention || false);
            setLiberteProvisoire(d.liberteProvisoire || false);
            setSansSuite(d.sansSuite || false);
            setFixation(d.fixation || false);
        } catch {
            setMessage({ type: "erreur", texte: "Dossier introuvable." });
        } finally {
            setChargement(false);
        }
    }

    /**
     * Lädt alle Instances einmal beim Laden der Seite.
     * Wird für "Communiquer le dossier" benutzt.
     */
    async function chargerInstances() {
        try {
            const response = await api.get("/instances");
            setInstances(response.data);
        } catch {}
    }

    /**
     * Speichert Info-Felder (Qualification, Checkboxen, Classification).
     * newValues überschreibt gezielt einzelne Felder.
     */
    async function sauvegarderInfos(newValues = {}) {
        setSauvegardEnCours(true);
        setMessageInfos(null);
        try {
            await api.put(`/dossiers/${id}/infos`, {
                qualification: newValues.qualification ?? qualification,
                relaxion: newValues.relaxion ?? relaxion,
                detention: newValues.detention ?? detention,
                liberteProvisoire: newValues.liberteProvisoire ?? liberteProvisoire,
                sansSuite: newValues.sansSuite ?? sansSuite,
                fixation: newValues.fixation ?? fixation,
                droit: newValues.droit ?? dossier?.droit,
            });
            setMessageInfos({ type: "succes", texte: "Informations sauvegardées." });
            setTimeout(() => setMessageInfos(null), 1500);
        } catch {
            setMessageInfos({ type: "erreur", texte: "Erreur lors de la sauvegarde." });
        } finally {
            setSauvegardEnCours(false);
        }
    }

    /**
     * Wird bei jeder Décision-Checkbox aufgerufen.
     */
    function handleCheckbox(field, value) {
        if (field === "relaxion") setRelaxion(value);
        if (field === "detention") setDetention(value);
        if (field === "liberteProvisoire") setLiberteProvisoire(value);
        if (field === "sansSuite") setSansSuite(value);
        if (field === "fixation") setFixation(value);
    }

    /**
     * Führt eine Workflow-Aktion aus (POST /dossiers/{id}/{endpoint}).
     * Lädt das Dossier nach Erfolg neu.
     */
    async function executerAction(endpoint, payload = {}) {
        setMessage(null);
        try {
            const response = await api.post(`/dossiers/${id}/${endpoint}`, payload);
            setMessage({ type: "succes", texte: "Action effectuée avec succès." });
            setAfficherVerdictForm(false);
            chargerDossier();
            return response.data;
        } catch (err) {
            setMessage({ type: "erreur", texte: err.response?.data?.erreur || "Erreur lors de l'action." });
            return null;
        }
    }

    /**
     * Stellt eine Notification aus und lädt das PDF herunter.
     */
    async function emettreNotificationEtTelecharger(type, lieu = null) {
        const notification = await executerAction("notifications", { type, lieu });
        if (notification && notification.id) await telechargerPdfNotification(notification.id);
    }

    /**
     * Lädt das PDF einer Notification herunter.
     */
    async function telechargerPdfNotification(notificationId) {
        try {
            const response = await api.get(`/dossiers/${id}/notifications/${notificationId}/pdf`, { responseType: "blob" });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `notification_${notificationId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            setMessage({ type: "erreur", texte: "Erreur lors du téléchargement du PDF." });
        }
    }

    /**
     * Lädt alle Procureurs für "Attribuer un OMP".
     */
    async function chargerProcureurs() {
        const response = await api.get("/utilisateurs/recherche", { params: { matricule: "" } });
        setProcureurs(response.data.filter((u) => u.role === "PROCUREUR"));
    }

    /**
     * Lädt alle Juges d'instruction für Voie Civile.
     */
    async function chargerJugesInstruction() {
        const response = await api.get("/utilisateurs/recherche", { params: { matricule: "" } });
        setJugesInstruction(response.data.filter((u) => u.role === "JUGE_INSTRUCTION"));
    }

    if (chargement) return <AppLayout><p>Chargement...</p></AppLayout>;
    if (!dossier) return <AppLayout><p>Dossier introuvable.</p></AppLayout>;

    const role = user?.role;
    const stade = dossier.stade;
    const estAdmin = role === "ADMIN";

    // PROCUREUR darf nur bei seinem eigenen Dossier Aktionen ausführen
    const estMonDossier = role === "PROCUREUR" &&
        dossier.procureur && dossier.procureur.id === user.id;

    const mapAutorise = dossier.mapAutorise === true;

    // GreffierActions zeigen bei ENREGISTRE/ASSIGNE_GREFF
    const zeigeGreffierActions =
        role === "GREFFIER" && (stade === "ENREGISTRE" || stade === "ASSIGNE_GREFF");

    // Actions disponibles zeigen — nicht für Greffier bei ENREGISTRE/ASSIGNE_GREFF
    const zeigeActionsDisponibles =
        role === "PROCUREUR_GENERAL" ||
        !(role === "GREFFIER" && (stade === "ENREGISTRE" || stade === "ASSIGNE_GREFF"));

    // ============================================================
    // CASCADING FILTER für "Communiquer le dossier"
    // Province → Ville → Catégorie → Branche → Instance (Nom)
    // ============================================================

    // Alle verfügbaren Provinces
    const provincesDisponibles = [...new Set(instances.map(i => i.province).filter(Boolean))].sort();

    // Villes gefiltert nach Province
    const villesDisponibles = [...new Set(
        instances
            .filter(i => !commProvince || i.province === commProvince)
            .map(i => i.ville)
            .filter(Boolean)
    )].sort();

    // Catégories gefiltert nach Province + Ville
    const categoriesDisponibles = [...new Set(
        instances
            .filter(i => (!commProvince || i.province === commProvince) &&
                (!commVille || i.ville === commVille))
            .map(i => i.categorie)
            .filter(Boolean)
    )].sort();

    // Branches gefiltert nach Province + Ville + Catégorie
    const branchesDisponibles = [...new Set(
        instances
            .filter(i => (!commProvince || i.province === commProvince) &&
                (!commVille || i.ville === commVille) &&
                (!commCategorie || i.categorie === commCategorie))
            .map(i => i.branche)
            .filter(Boolean)
    )].sort();

    // Instances gefiltert nach allen 4 Kriterien
    const instancesFiltrees = instances.filter(i =>
        (!commProvince || i.province === commProvince) &&
        (!commVille || i.ville === commVille) &&
        (!commCategorie || i.categorie === commCategorie) &&
        (!commBranche || i.branche === commBranche)
    );

    /**
     * Zeigt die aktuelle Décision als Text.
     */
    function afficherDecision() {
        if (stade === "DECISION_EN_ATTENTE") return "⏳ En attente PG...";
        if (relaxion) return "Relaxion";
        if (detention) return "Détention";
        if (liberteProvisoire) return "Liberté provisoire";
        if (sansSuite) return "Sans suite";
        if (fixation) return "Fixation";
        return "-";
    }

    return (
        <AppLayout>
            <button className="dossier-back" onClick={() => navigate("/dossiers")}>
                ← Retour aux dossiers
            </button>

            <h2 className="dossier-title">Dossier {dossier.numeroDossier}</h2>

            {/* ADMIN: nur Lesemodus */}
            {estAdmin && (
                <p className="dossier-message dossier-message-info" style={{ marginBottom: "16px" }}>
                    👁️ Mode lecture — En tant qu'administrateur, vous pouvez consulter ce dossier mais ne pouvez pas effectuer d'actions.
                </p>
            )}

            {/* PROCUREUR: Hinweis wenn Dossier nicht ihm zugewiesen */}
            {role === "PROCUREUR" && !estMonDossier && dossier.procureur && (
                <p className="dossier-message dossier-message-info" style={{ marginBottom: "16px" }}>
                    👁️ Mode lecture — Ce dossier est attribué à un autre procureur de votre instance.
                </p>
            )}

            {/* PROCUREUR: Hinweis wenn MAP automatisch ausgestellt */}
            {role === "PROCUREUR" && estMonDossier && stade === "DECISION_EN_ATTENTE" && (
                <p className="dossier-message dossier-message-info" style={{ marginBottom: "16px" }}>
                    ⏳ Votre décision a été envoyée au Procureur Général. En attente de confirmation...
                </p>
            )}

            {role === "PROCUREUR" && estMonDossier && stade === "NOTIFICATION_MAP_P" && mapAutorise && (
                <p className="dossier-message dossier-message-succes" style={{ marginBottom: "16px" }}>
                    ✅ Le Procureur Général a confirmé votre demande et le MAP a été émis automatiquement.
                </p>
            )}

            {message && (
                <p className={`dossier-message dossier-message-${message.type}`}>
                    {message.texte}
                </p>
            )}

            {/* ============================================================
                INFO-KARTE — 2 Spalten
            ============================================================ */}
            <div className="dossier-info-4col">

                {/* Spalte 1: Allgemeine Infos */}
                <div className="dossier-info-col">
                    <div className="dossier-info-row-4">
                        <span className="dossier-info-label">Date :</span>
                        <span className="dossier-info-value">{dossier.dateCreation || "-"}</span>
                    </div>
                    <div className="dossier-info-row-4">
                        <span className="dossier-info-label">Numéro de dossier :</span>
                        <span className="dossier-info-value">{dossier.numeroDossier || "-"}</span>
                    </div>
                    <div className="dossier-info-row-4">
                        <span className="dossier-info-label">Province :</span>
                        <span className="dossier-info-value">{dossier.instance?.province || "-"}</span>
                    </div>
                    <div className="dossier-info-row-4">
                        <span className="dossier-info-label">Ville :</span>
                        <span className="dossier-info-value">{dossier.instance?.ville || "-"}</span>
                    </div>
                    <div className="dossier-info-row-4">
                        <span className="dossier-info-label">Instance :</span>
                        <span className="dossier-info-value">{dossier.instance?.nomInstance || "-"}</span>
                    </div>
                    <div className="dossier-info-row-4">
                        <span className="dossier-info-label">OMP :</span>
                        <span className="dossier-info-value">
                            {dossier.procureur
                                ? `${dossier.procureur.nom} ${dossier.procureur.postNom || ""}`
                                : "-"}
                        </span>
                    </div>
                    <div className="dossier-info-row-4">
                        <span className="dossier-info-label">Juge d'instruction :</span>
                        <span className="dossier-info-value">
                            {dossier.jugeInstruction
                                ? `${dossier.jugeInstruction.nom} ${dossier.jugeInstruction.postNom || ""}`
                                : "-"}
                        </span>
                    </div>
                </div>

                {/* Spalte 2: Status + Classification + Qualification + Décision */}
                <div className="dossier-info-col">
                    <div className="dossier-info-row-4">
                        <span className="dossier-info-label">Statut :</span>
                        <span className="dossier-info-value">
                            <span className="dossier-stade-badge">{stade}</span>
                        </span>
                    </div>
                    <div className="dossier-info-row-4">
                        <span className="dossier-info-label">Classification :</span>
                        <span className="dossier-info-value">
                            {dossier.classifie ? dossier.droit : "-"}
                        </span>
                    </div>
                    <div className="dossier-info-row-4">
                        <span className="dossier-info-label">Qualification :</span>
                        <span className="dossier-info-value">{qualification || "-"}</span>
                    </div>
                    <div className="dossier-info-row-4">
                        <span className="dossier-info-label">Décision :</span>
                        <span className="dossier-info-value">{afficherDecision()}</span>
                    </div>
                    {messageInfos && (
                        <p className={`dossier-infos-message dossier-infos-message-${messageInfos.type}`}>
                            {sauvegardEnCours ? "Sauvegarde..." : messageInfos.texte}
                        </p>
                    )}
                </div>
            </div>

            {/* ADMIN: keine Actions, nur Annotations + Pièces */}
            {!estAdmin && (
                <>
                    {/* ProcureurActions: nur für zugewiesenen Procureur */}
                    {role === "PROCUREUR" && estMonDossier && (
                        <ProcureurActions dossierId={id} />
                    )}

                    {/* PGActions: für Procureur Général */}
                    {role === "PROCUREUR_GENERAL" && (
                        <PGActions dossierId={id} />
                    )}

                    {/* GreffierActions: Plainte bearbeiten, Envoyer au PG */}
                    {zeigeGreffierActions && (
                        <GreffierActions
                            dossierId={id}
                            stade={stade}
                            onActionEffectuee={chargerDossier}
                            role={role}
                        />
                    )}

                    {/* Actions disponibles */}
                    {zeigeActionsDisponibles && (
                        <div className="dossier-actions-card">
                            <h3>Actions disponibles</h3>

                            {/* GREFFIER: bestätigt MAP_VALIDE_P → MAPE */}
                            {role === "GREFFIER" && stade === "MAP_VALIDE_P" && (
                                <div className="action-bloc">
                                    <button onClick={() => executerAction("confirmer-map")}>
                                        Confirmer le MAP
                                    </button>
                                </div>
                            )}

                            {/* GREFFIER (Tribunal): bestätigt Chambre-Zuweisung */}
                            {role === "GREFFIER" && stade === "ASSIGNE_GREFF_T" && (
                                <div className="action-bloc">
                                    <button onClick={() => executerAction("valider-assignation-chambre")}>
                                        Valider l'assignation de la chambre
                                    </button>
                                </div>
                            )}

                            {/* PG: Classification (PENAL/CIVIL) wählen */}
                            {role === "PROCUREUR_GENERAL" && (
                                <div className="action-bloc">
                                    <p>Classification :</p>
                                    <select
                                        className="dossier-qualification-input"
                                        value={dossier.droit || ""}
                                        onChange={async (e) => {
                                            await sauvegarderInfos({ droit: e.target.value });
                                            chargerDossier();
                                        }}
                                    >
                                        <option value="">-- Choisir --</option>
                                        <option value="PENAL">PENAL</option>
                                        <option value="CIVIL">CIVIL</option>
                                    </select>
                                </div>
                            )}

                            {/* PG: Qualification (RMI/RMP/RMA) wählen */}
                            {role === "PROCUREUR_GENERAL" && (
                                <div className="action-bloc">
                                    <p>Qualification :</p>
                                    <select
                                        className="dossier-qualification-input"
                                        value={qualification}
                                        onChange={(e) => {
                                            setQualification(e.target.value);
                                            sauvegarderInfos({ qualification: e.target.value });
                                        }}
                                    >
                                        <option value="">-- Choisir --</option>
                                        <option value="RMI">RMI</option>
                                        <option value="RMP">RMP</option>
                                        <option value="RMA">RMA</option>
                                    </select>
                                </div>
                            )}

                            {/* PG: OMP zuweisen → EN_INSTRUCTION_P */}
                            {role === "PROCUREUR_GENERAL" && stade === "ASSIGNATION_PG" && (
                                <div className="action-bloc">
                                    <p>Attribuer un OMP :</p>
                                    {procureurs.length === 0 ? (
                                        <button onClick={chargerProcureurs}>
                                            Charger la liste des procureurs
                                        </button>
                                    ) : (
                                        <div className="action-buttons">
                                            <select value={procureurId} onChange={(e) => setProcureurId(e.target.value)}>
                                                <option value="">-- Choisir --</option>
                                                {procureurs.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>
                                                ))}
                                            </select>
                                            <button
                                                disabled={!procureurId}
                                                onClick={() => executerAction("assigner-procureur", { procureurId })}
                                            >
                                                Confirmer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PG: MAP-Notification final validieren */}
                            {role === "PROCUREUR_GENERAL" && stade === "VALIDATION_NOTIFICATION_MAP_P" && (
                                <div className="action-bloc">
                                    <p>Décision du Procureur reçue. Êtes-vous d'accord ?</p>
                                    <div className="action-buttons">
                                        <button onClick={() => executerAction("valider-map")}>Confirmer</button>
                                        <button className="action-secondary" onClick={() => executerAction("annuler-map")}>Annuler</button>
                                    </div>
                                </div>
                            )}

                            {/* PG: MAP-Anfrage des Procureur bestätigen/ablehnen */}
                            {role === "PROCUREUR_GENERAL" && stade === "DEMANDE_MAP" && (
                                <div className="action-bloc">
                                    <p>Le Procureur demande l'autorisation d'émettre le MAP. Êtes-vous d'accord ?</p>
                                    <div className="action-buttons">
                                        <button onClick={() => executerAction("confirmer-autorisation-map")}>Confirmer MAP</button>
                                        <button className="action-secondary" onClick={() => executerAction("annuler-autorisation-map")}>Annuler</button>
                                    </div>
                                </div>
                            )}

                            {/* PG: Décision des Procureur bestätigen/ablehnen */}
                            {role === "PROCUREUR_GENERAL" && stade === "DECISION_EN_ATTENTE" && (
                                <div className="action-bloc">
                                    <p>Le Procureur a soumis sa décision. Êtes-vous d'accord ?</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px", opacity: 0.7 }}>
                                        <label><input type="checkbox" checked={relaxion} disabled /> Relaxion</label>
                                        <label><input type="checkbox" checked={detention} disabled /> Détention</label>
                                        <label><input type="checkbox" checked={liberteProvisoire} disabled /> Liberté provisoire</label>
                                        <label><input type="checkbox" checked={sansSuite} disabled /> Sans suite</label>
                                        <label><input type="checkbox" checked={fixation} disabled /> Fixation</label>
                                    </div>
                                    <div className="action-buttons">
                                        <button onClick={() => executerAction("confirmer-decision")}>Confirmer</button>
                                        <button className="action-secondary" onClick={() => executerAction("annuler-decision")}>Annuler</button>
                                    </div>
                                </div>
                            )}

                            {/* PROCUREUR + PG: MAP-Notification validieren */}
                            {((role === "PROCUREUR" && estMonDossier) || role === "PROCUREUR_GENERAL") && stade === "NOTIFICATION_MAP_P" && (
                                <div className="action-bloc">
                                    <button onClick={() => executerAction("valider-notification-map")}>
                                        Valider la notification MAP
                                    </button>
                                </div>
                            )}

                            {/* PROCUREUR: Décision setzen + an PG schicken */}
                            {role === "PROCUREUR" && estMonDossier && dossier.classifie && stade === "EN_INSTRUCTION_P" && (
                                <div className="action-bloc">
                                    <p>Décision :</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <label><input type="checkbox" checked={relaxion} onChange={(e) => handleCheckbox("relaxion", e.target.checked)} /> Relaxion</label>
                                        <label><input type="checkbox" checked={detention} onChange={(e) => handleCheckbox("detention", e.target.checked)} /> Détention</label>
                                        <label><input type="checkbox" checked={liberteProvisoire} onChange={(e) => handleCheckbox("liberteProvisoire", e.target.checked)} /> Liberté provisoire</label>
                                        <label><input type="checkbox" checked={sansSuite} onChange={(e) => handleCheckbox("sansSuite", e.target.checked)} /> Sans suite</label>
                                        <label><input type="checkbox" checked={fixation} onChange={(e) => handleCheckbox("fixation", e.target.checked)} /> Fixation</label>
                                    </div>
                                    <button
                                        style={{ marginTop: "12px" }}
                                        disabled={!relaxion && !detention && !liberteProvisoire && !sansSuite && !fixation}
                                        onClick={async () => {
                                            await sauvegarderInfos({ relaxion, detention, liberteProvisoire, sansSuite, fixation });
                                            await executerAction("envoyer-decision");
                                        }}
                                    >
                                        Envoyer la décision au PG
                                    </button>
                                </div>
                            )}

                            {/* PROCUREUR: Décision in Wartezeit (read-only) */}
                            {role === "PROCUREUR" && estMonDossier && stade === "DECISION_EN_ATTENTE" && (
                                <div className="action-bloc">
                                    <p>Décision (en attente de confirmation du PG) :</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", opacity: 0.6 }}>
                                        <label><input type="checkbox" checked={relaxion} disabled /> Relaxion</label>
                                        <label><input type="checkbox" checked={detention} disabled /> Détention</label>
                                        <label><input type="checkbox" checked={liberteProvisoire} disabled /> Liberté provisoire</label>
                                        <label><input type="checkbox" checked={sansSuite} disabled /> Sans suite</label>
                                        <label><input type="checkbox" checked={fixation} disabled /> Fixation</label>
                                    </div>
                                </div>
                            )}

                            {/* PG: Décision setzen (direkt, ohne Wartezeit) */}
                            {role === "PROCUREUR_GENERAL" && stade !== "DECISION_EN_ATTENTE" && (
                                <div className="action-bloc">
                                    <p>Décision :</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <label><input type="checkbox" checked={relaxion} onChange={(e) => { setRelaxion(e.target.checked); sauvegarderInfos({ relaxion: e.target.checked }); }} /> Relaxion</label>
                                        <label><input type="checkbox" checked={detention} onChange={(e) => { setDetention(e.target.checked); sauvegarderInfos({ detention: e.target.checked }); }} /> Détention</label>
                                        <label><input type="checkbox" checked={liberteProvisoire} onChange={(e) => { setLiberteProvisoire(e.target.checked); sauvegarderInfos({ liberteProvisoire: e.target.checked }); }} /> Liberté provisoire</label>
                                        <label><input type="checkbox" checked={sansSuite} onChange={(e) => { setSansSuite(e.target.checked); sauvegarderInfos({ sansSuite: e.target.checked }); }} /> Sans suite</label>
                                        <label><input type="checkbox" checked={fixation} onChange={(e) => { setFixation(e.target.checked); sauvegarderInfos({ fixation: e.target.checked }); }} /> Fixation</label>
                                    </div>
                                </div>
                            )}

                            {/* JUGE: Décision setzen */}
                            {role === "JUGE_INSTRUCTION" && (
                                <div className="action-bloc">
                                    <p>Décision :</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <label><input type="checkbox" checked={relaxion} onChange={(e) => { setRelaxion(e.target.checked); sauvegarderInfos({ relaxion: e.target.checked }); }} /> Relaxion</label>
                                        <label><input type="checkbox" checked={detention} onChange={(e) => { setDetention(e.target.checked); sauvegarderInfos({ detention: e.target.checked }); }} /> Détention</label>
                                        <label><input type="checkbox" checked={liberteProvisoire} onChange={(e) => { setLiberteProvisoire(e.target.checked); sauvegarderInfos({ liberteProvisoire: e.target.checked }); }} /> Liberté provisoire</label>
                                        <label><input type="checkbox" checked={sansSuite} onChange={(e) => { setSansSuite(e.target.checked); sauvegarderInfos({ sansSuite: e.target.checked }); }} /> Sans suite</label>
                                        <label><input type="checkbox" checked={fixation} onChange={(e) => { setFixation(e.target.checked); sauvegarderInfos({ fixation: e.target.checked }); }} /> Fixation</label>
                                    </div>
                                </div>
                            )}

                            {/* PROCUREUR: MAP-Autorisierung anfragen */}
                            {role === "PROCUREUR" && estMonDossier && stade === "EN_INSTRUCTION_P" && (
                                <div className="action-bloc">
                                    <button onClick={() => executerAction("demander-autorisation-map")}>
                                        Demander l'autorisation MAP
                                    </button>
                                </div>
                            )}

                            {/* PRÉSIDENT TRIBUNAL: Chambre + Juge zuweisen */}
                            {role === "PRESIDENT_TRIBUNAL" && stade === "ASSIGNATION_PT" && (
                                <div className="action-bloc">
                                    <p>Assigner une chambre et un juge d'instruction :</p>
                                    <div className="form-field" style={{ marginBottom: "10px" }}>
                                        <input
                                            type="text"
                                            placeholder="Nom de la chambre (ex: Chambre 1)"
                                            value={chambre}
                                            onChange={(e) => setChambre(e.target.value)}
                                        />
                                    </div>
                                    {jugesInstruction.length === 0 ? (
                                        <button onClick={chargerJugesInstruction}>
                                            Charger la liste des juges d'instruction
                                        </button>
                                    ) : (
                                        <div className="action-buttons">
                                            <select value={jugeInstructionId} onChange={(e) => setJugeInstructionId(e.target.value)}>
                                                <option value="">-- Choisir un juge --</option>
                                                {jugesInstruction.map((j) => (
                                                    <option key={j.id} value={j.id}>{j.nom} {j.prenom}</option>
                                                ))}
                                            </select>
                                            <button
                                                disabled={!jugeInstructionId || !chambre}
                                                onClick={() => executerAction("assigner-chambre", { chambre, jugeInstructionId })}
                                            >
                                                Confirmer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PRÉSIDENT TRIBUNAL: MAP-Notification validieren */}
                            {role === "PRESIDENT_TRIBUNAL" && stade === "NOTIFICATION_MAP_T" && (
                                <div className="action-bloc">
                                    <button onClick={() => executerAction("valider-map-civil")}>
                                        Valider le MAP
                                    </button>
                                </div>
                            )}

                            {/* ============================================================
                                COMMUNIQUER LE DOSSIER
                                5-stufiges Cascading:
                                Province → Ville → Catégorie → Branche → Instance (Nom)
                            ============================================================ */}
                            {(role === "PROCUREUR_GENERAL" || role === "PRESIDENT_TRIBUNAL") && (
                                <div className="action-bloc">
                                    <p>Communiquer le dossier :</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

                                        {/* 1. Province */}
                                        <select
                                            className="dossier-qualification-input"
                                            value={commProvince}
                                            onChange={(e) => {
                                                setCommProvince(e.target.value);
                                                setCommVille("");
                                                setCommCategorie("");
                                                setCommBranche("");
                                                setCommInstanceId("");
                                            }}
                                        >
                                            <option value="">-- Province --</option>
                                            {provincesDisponibles.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>

                                        {/* 2. Ville — erscheint nach Province */}
                                        {commProvince && (
                                            <select
                                                className="dossier-qualification-input"
                                                value={commVille}
                                                onChange={(e) => {
                                                    setCommVille(e.target.value);
                                                    setCommCategorie("");
                                                    setCommBranche("");
                                                    setCommInstanceId("");
                                                }}
                                            >
                                                <option value="">-- Ville --</option>
                                                {villesDisponibles.map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
                                        )}

                                        {/* 3. Catégorie — feste Werte */}
                                        {commProvince && commVille && (
                                            <select
                                                className="dossier-qualification-input"
                                                value={commCategorie}
                                                onChange={(e) => {
                                                    setCommCategorie(e.target.value);
                                                    setCommBranche("");
                                                    setCommInstanceId("");
                                                }}
                                            >
                                                <option value="">-- Catégorie --</option>
                                                {CATEGORIES_INSTANCE.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        )}

                                        {/* 4. Branche — erscheint nach Catégorie */}
                                        {commProvince && commVille && commCategorie && (
                                            <select
                                                className="dossier-qualification-input"
                                                value={commBranche}
                                                onChange={(e) => {
                                                    setCommBranche(e.target.value);
                                                    setCommInstanceId("");
                                                }}
                                            >
                                                <option value="">-- Branche --</option>
                                                {branchesDisponibles.map(b => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                        )}

                                        {/* 5. Instance (Nom) — erscheint zuletzt */}
                                        {commProvince && commVille && commCategorie && commBranche && (
                                            <select
                                                className="dossier-qualification-input"
                                                value={commInstanceId}
                                                onChange={(e) => setCommInstanceId(e.target.value)}
                                            >
                                                <option value="">-- Instance --</option>
                                                {instancesFiltrees.map(i => (
                                                    <option key={i.id} value={i.id}>{i.nomInstance}</option>
                                                ))}
                                            </select>
                                        )}

                                        {/* Confirmer — nur aktiv wenn Instance gewählt */}
                                        <button
                                            disabled={!commInstanceId}
                                            onClick={() => {
                                                executerAction("changer-instance", { nouvelleInstanceId: commInstanceId });
                                                setCommProvince("");
                                                setCommVille("");
                                                setCommCategorie("");
                                                setCommBranche("");
                                                setCommInstanceId("");
                                            }}
                                        >
                                            Confirmer
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* JUGE / PRÉSIDENT TRIBUNAL: Verdict → FERME */}
                            {(role === "JUGE_INSTRUCTION" || role === "PRESIDENT_TRIBUNAL") &&
                                ["EN_INSTRUCTION_P", "EN_INSTRUCTION_CH", "MAPE", "MAP_VALIDE_CH"].includes(stade) && (
                                    <div className="action-bloc">
                                        {!afficherVerdictForm ? (
                                            <button className="action-danger" onClick={() => setAfficherVerdictForm(true)}>
                                                Rendre le verdict / Fermer la procédure
                                            </button>
                                        ) : (
                                            <VerdictForm
                                                onConfirmer={(donnees) => executerAction("condamner", donnees)}
                                                onAnnuler={() => setAfficherVerdictForm(false)}
                                            />
                                        )}
                                    </div>
                                )}

                            {/* PG / PRÉSIDENT TRIBUNAL: geschlossenes Dossier wieder öffnen */}
                            {(role === "PROCUREUR_GENERAL" || role === "PRESIDENT_TRIBUNAL") && stade === "FERME" && (
                                <div className="action-bloc">
                                    <button onClick={() => executerAction("reouvrir")}>
                                        Réouvrir ce dossier
                                    </button>
                                </div>
                            )}

                            {/* PROCUREUR / JUGE: Plaignant einladen */}
                            {((role === "PROCUREUR" && estMonDossier) || role === "JUGE_INSTRUCTION") && (
                                <div className="action-bloc">
                                    <button onClick={() => emettreNotificationEtTelecharger("INVITATION")}>
                                        Inviter le plaignant
                                    </button>
                                </div>
                            )}

                            {/* PROCUREUR / JUGE: Notifications ausstellen */}
                            {((role === "PROCUREUR" && estMonDossier) || role === "JUGE_INSTRUCTION") && (
                                <div className="action-bloc">
                                    <p>Émettre une notification :</p>
                                    <div className="action-buttons">
                                        <button onClick={() => emettreNotificationEtTelecharger("MC")}>MC</button>
                                        <button onClick={() => emettreNotificationEtTelecharger("MA")}>MA</button>
                                        <button onClick={() => emettreNotificationEtTelecharger("AR")}>AR</button>
                                    </div>
                                </div>
                            )}

                            {/* Fallback: keine Aktion verfügbar */}
                            {(!["GREFFIER", "PROCUREUR_GENERAL", "PROCUREUR", "JUGE_INSTRUCTION", "PRESIDENT_TRIBUNAL"].includes(role) ||
                                (role === "PROCUREUR" && !estMonDossier)) && (
                                <p className="dossier-aucune-action">
                                    Aucune action disponible pour votre rôle sur ce dossier.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Annotations + Pièces jointes */}
                    {zeigeActionsDisponibles && (
                        <>
                            {role === "GREFFIER" && (
                                <AnnotationsList dossierId={id} />
                            )}
                            {role !== "PROCUREUR_GENERAL" && (
                                <PiecesJointes dossierId={id} peutSupprimer={true} />
                            )}
                        </>
                    )}
                </>
            )}

            {/* ADMIN: Lesemodus — Annotations + Pièces nicht löschbar */}
            {estAdmin && (
                <>
                    <AnnotationsList dossierId={id} />
                    <PiecesJointes dossierId={id} peutSupprimer={false} />
                </>
            )}

            {/* Historique — für alle Rollen sichtbar */}
            <HistoriqueDossier dossierId={id} />

        </AppLayout>
    );
}