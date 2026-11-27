import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import "./Dossiers.css";
import "./Administrator.css";
import DocumentsPersonnel from "../components/DocumentsPersonnel";

const PROVINCES_DRC = [
    "Bas-Uélé", "Équateur", "Haut-Katanga", "Haut-Lomami",
    "Haut-Uélé", "Ituri", "Kasaï", "Kasaï-Central",
    "Kasaï-Oriental", "Kinshasa", "Kongo Central", "Kwango",
    "Kwilu", "Lomami", "Lualaba", "Mai-Ndombe",
    "Maniema", "Mongala", "Nord-Kivu", "Nord-Ubangi",
    "Sankuru", "Sud-Kivu", "Sud-Ubangi", "Tanganyika",
    "Tshopo", "Tshuapa"
];

const TYPES_INSTANCE = [
    { value: "TRIBUNAL", label: "Tribunal" },
    { value: "PARQUET", label: "Parquet" },
];

const instanceVide = { province: "", ville: "", typeInstance: "", categorie: "", branche: "", nomInstance: "" };
const barreauVide = { province: "", nom: "" };
const villeVide = { nom: "", province: "" };
const utilisateurVide = {
    numeroMatricule: "", nom: "", postNom: "", prenom: "", sexe: "",
    dateNaissance: "", lieuNaissance: "", districtOrigine: "", secteur: "",
    villageOrigine: "", diplome: "", universite: "", grade: "", titre: "",
    role: "", typeDroit: "", instanceId: "", motDePasse: "", barreau: "", numeroOrdre: "",
};

/**
 * Seite "Administrator"
 *
 * Tabs je nach Rolle:
 *  - ADMIN:    Personnel + Avocats + Ajouter + Instances + Barreaux + Villes
 *  - GREFFIER: nur Personnel (readonly)
 *  - Andere:   nur Personnel (readonly)
 *
 * Personnel-Tab: zeigt NUR Nicht-Avocats (role !== AVOCAT)
 * Avocats-Tab:   zeigt NUR Avocats (role === AVOCAT)
 */
export default function Administrator() {

    const [mode, setMode] = useState("personnel");
    const [moi, setMoi] = useState(null);

    // ----- Personnel-Tab -----
    const [tousUtilisateurs, setTousUtilisateurs] = useState([]);
    const [chargement, setChargement] = useState(false);
    const [rechercheEffectuee, setRechercheEffectuee] = useState(false);
    const [filtreNom, setFiltreNom] = useState("");
    const [filtreMatricule, setFiltreMatricule] = useState("");
    const [filtreProvince, setFiltreProvince] = useState("");
    const [filtreVille, setFiltreVille] = useState("");
    const [filtreInstance, setFiltreInstance] = useState("");
    const [filtreRole, setFiltreRole] = useState("");
    const [filtreType, setFiltreType] = useState("");
    const [utilisateurSelectionne, setUtilisateurSelectionne] = useState(null);
    const [modeFormulaire, setModeFormulaire] = useState("voir");
    const [formData, setFormData] = useState(utilisateurVide);
    const [chargementForm, setChargementForm] = useState(false);
    const [message, setMessage] = useState(null);

    // ----- Avocats-Tab -----
    const [tousAvocats, setTousAvocats] = useState([]);
    const [chargementAvocats, setChargementAvocats] = useState(false);
    const [rechercheAvocatsEffectuee, setRechercheAvocatsEffectuee] = useState(false);
    const [filtreNomAvocat, setFiltreNomAvocat] = useState("");
    const [filtreNumeroOrdre, setFiltreNumeroOrdre] = useState("");
    const [filtreBarreauAvocat, setFiltreBarreauAvocat] = useState("");
    const [avocatSelectionne, setAvocatSelectionne] = useState(null);
    const [modeFormulaireAvocat, setModeFormulaireAvocat] = useState("voir");
    const [formDataAvocat, setFormDataAvocat] = useState(utilisateurVide);
    const [messageAvocat, setMessageAvocat] = useState(null);

    // ----- Instances-Tab -----
    const [instances, setInstances] = useState([]);
    const [instanceForm, setInstanceForm] = useState(instanceVide);
    const [instanceSelectionnee, setInstanceSelectionnee] = useState(null);
    const [chargementInstance, setChargementInstance] = useState(false);
    const [messageInstance, setMessageInstance] = useState(null);

    // ----- Barreaux-Tab -----
    const [barreaux, setBarreaux] = useState([]);
    const [barreauForm, setBarreauForm] = useState(barreauVide);
    const [chargementBarreau, setChargementBarreau] = useState(false);
    const [messageBarreau, setMessageBarreau] = useState(null);

    // ----- Villes-Tab -----
    const [villeForm, setVilleForm] = useState(villeVide);
    const [messageVille, setMessageVille] = useState(null);

    // ----- Städte -----
    const [villes, setVilles] = useState([]);

    useEffect(() => {
        chargerMoi();
        chargerInstances();
        chargerVilles();
        chargerBarreaux();
    }, []);

    async function chargerMoi() {
        try {
            const response = await api.get("/auth/me");
            setMoi(response.data);
        } catch { setMoi(null); }
    }

    async function chargerTousUtilisateurs() {
        setChargement(true);
        try {
            const response = await api.get("/utilisateurs/personnel");
            setTousUtilisateurs(response.data);
        } catch { setTousUtilisateurs([]); }
        finally { setChargement(false); }
    }

    async function chargerTousAvocats() {
        setChargementAvocats(true);
        try {
            const response = await api.get("/utilisateurs/avocats");
            setTousAvocats(response.data);
        } catch { setTousAvocats([]); }
        finally { setChargementAvocats(false); }
    }

    async function chargerInstances() {
        try {
            const response = await api.get("/instances");
            setInstances(response.data);
        } catch { setInstances([]); }
    }

    async function chargerVilles() {
        try {
            const response = await api.get("/villes");
            console.log("Villes:", response.data.filter(v => v.province === "Kongo Central"));
            setVilles(response.data);
        } catch { setVilles([]); }
    }
    async function chargerBarreaux() {
        try {
            const response = await api.get("/barreaux");
            setBarreaux(response.data);
        } catch { setBarreaux([]); }
    }

    /**
     * Erstellt eine neue Ville.
     */
    async function creerVille(e) {
        e.preventDefault();
        try {
            await api.post("/villes", villeForm);
            setMessageVille({ type: "succes", texte: "Ville ajoutée avec succès." });
            setVilleForm(villeVide);
            chargerVilles();
        } catch {
            setMessageVille({ type: "erreur", texte: "Erreur lors de l'ajout." });
        }
    }

    /**
     * Löscht eine Ville nach Bestätigung.
     */
    async function supprimerVille(id) {
        if (!window.confirm("Supprimer cette ville ?")) return;
        try {
            await api.delete(`/villes/${id}`);
            setMessageVille({ type: "succes", texte: "Ville supprimée." });
            chargerVilles();
        } catch {
            setMessageVille({ type: "erreur", texte: "Erreur lors de la suppression." });
        }
    }

    async function handleChercher() {
        setRechercheEffectuee(true);
        await chargerTousUtilisateurs();
    }

    async function handleChercherAvocats() {
        setRechercheAvocatsEffectuee(true);
        await chargerTousAvocats();
    }

    const estAdmin = moi?.role === "ADMIN";

    const villesFiltrees = [...new Set(
        villes.filter(v => !filtreProvince || v.province === filtreProvince).map(v => v.nom)
    )].sort();

    /**
     * Personnel-Filter: NUR Nicht-Avocats anzeigen!
     */
    const utilisateursFiltres = tousUtilisateurs.filter((u) => {
        // Avocats aus Personnel-Tab ausschließen!
        if (u.role === "AVOCAT") return false;
        if (filtreNom) {
            const vollname = `${u.nom || ""} ${u.postNom || ""} ${u.prenom || ""}`.toLowerCase();
            if (!vollname.includes(filtreNom.toLowerCase())) return false;
        }
        if (filtreMatricule && !u.numeroMatricule?.toLowerCase().includes(filtreMatricule.toLowerCase())) return false;
        if (filtreProvince && u.instance?.province !== filtreProvince) return false;
        if (filtreVille && u.instance?.ville !== filtreVille) return false;
        if (filtreInstance && u.instance?.id !== parseInt(filtreInstance)) return false;
        if (filtreRole && u.titre !== filtreRole) return false;
        if (filtreType && u.typeDroit !== filtreType) return false;
        return true;
    });

    /**
     * Avocats-Filter: NUR Avocats anzeigen!
     */
    const avocatsFiltres = tousAvocats.filter((u) => {
        if (filtreNomAvocat) {
            const vollname = `${u.nom || ""} ${u.postNom || ""} ${u.prenom || ""}`.toLowerCase();
            if (!vollname.includes(filtreNomAvocat.toLowerCase())) return false;
        }
        if (filtreNumeroOrdre && !u.numeroOrdre?.toLowerCase().includes(filtreNumeroOrdre.toLowerCase())) return false;
        if (filtreBarreauAvocat && !u.barreau?.toLowerCase().includes(filtreBarreauAvocat.toLowerCase())) return false;
        return true;
    });

    function handleField(field, value) {
        setFormData((prev) => {
            const updated = { ...prev, [field]: value };
            if (field === "role" && value === "AVOCAT") {
                updated.titre = "Avocat";
                updated.typeDroit = "";
            }
            return updated;
        });
    }

    function handleFieldAvocat(field, value) {
        setFormDataAvocat((prev) => ({ ...prev, [field]: value }));
    }

    function handleInstanceField(field, value) {
        setInstanceForm((prev) => ({ ...prev, [field]: value }));
    }

    function handleBarreauField(field, value) {
        setBarreauForm((prev) => ({ ...prev, [field]: value }));
    }

    function handleRowClick(u) {
        setUtilisateurSelectionne(u);
        setFormData({ ...utilisateurVide, ...u, instanceId: u.instance?.id || "", motDePasse: "", barreau: u.barreau || "", numeroOrdre: u.numeroOrdre || "" });
        setModeFormulaire("voir");
        setMessage(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleAvocatClick(u) {
        setAvocatSelectionne(u);
        setFormDataAvocat({ ...utilisateurVide, ...u, instanceId: u.instance?.id || "", motDePasse: "", barreau: u.barreau || "", numeroOrdre: u.numeroOrdre || "" });
        setModeFormulaireAvocat("voir");
        setMessageAvocat(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function fermerFormulaire() {
        setUtilisateurSelectionne(null);
        setFormData(utilisateurVide);
        setModeFormulaire("voir");
        setMessage(null);
    }

    function fermerFormulaireAvocat() {
        setAvocatSelectionne(null);
        setFormDataAvocat(utilisateurVide);
        setModeFormulaireAvocat("voir");
        setMessageAvocat(null);
    }

    function ouvrirInstanceFormulaire(instance) {
        setInstanceSelectionnee(instance);
        setInstanceForm({ province: instance.province || "", ville: instance.ville || "", typeInstance: instance.typeInstance || "", categorie: instance.categorie || "", branche: instance.branche || "", nomInstance: instance.nomInstance || "" });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function fermerInstanceFormulaire() {
        setInstanceSelectionnee(null);
        setInstanceForm(instanceVide);
        setMessageInstance(null);
    }

    async function handleSauvegarderInstance(e) {
        e.preventDefault();
        setMessageInstance(null);
        setChargementInstance(true);
        try {
            if (instanceSelectionnee) {
                await api.put(`/instances/${instanceSelectionnee.id}`, instanceForm);
                setMessageInstance({ type: "succes", texte: "Instance modifiée avec succès." });
            } else {
                await api.post("/instances", instanceForm);
                setMessageInstance({ type: "succes", texte: "Instance créée avec succès." });
            }
            chargerInstances();
            fermerInstanceFormulaire();
        } catch (err) {
            setMessageInstance({ type: "erreur", texte: err.response?.data?.erreur || "Erreur lors de la sauvegarde." });
        } finally { setChargementInstance(false); }
    }

    async function handleSupprimerInstance(id) {
        if (!window.confirm("Supprimer cette instance ? Cette action est irréversible.")) return;
        try {
            await api.delete(`/instances/${id}`);
            chargerInstances();
            setMessageInstance({ type: "succes", texte: "Instance supprimée." });
        } catch {
            setMessageInstance({ type: "erreur", texte: "Erreur: cette instance est peut-être utilisée par des membres du personnel." });
        }
    }

    async function handleAjouterBarreau(e) {
        e.preventDefault();
        setMessageBarreau(null);
        setChargementBarreau(true);
        try {
            await api.post("/barreaux", barreauForm);
            setMessageBarreau({ type: "succes", texte: "Barreau ajouté avec succès." });
            chargerBarreaux();
            setBarreauForm(barreauVide);
        } catch (err) {
            setMessageBarreau({ type: "erreur", texte: err.response?.data?.erreur || "Erreur lors de l'ajout." });
        } finally { setChargementBarreau(false); }
    }

    async function handleSupprimerBarreau(id) {
        if (!window.confirm("Supprimer ce barreau ? Cette action est irréversible.")) return;
        try {
            await api.delete(`/barreaux/${id}`);
            chargerBarreaux();
            setMessageBarreau({ type: "succes", texte: "Barreau supprimé." });
        } catch {
            setMessageBarreau({ type: "erreur", texte: "Erreur: ce barreau est peut-être utilisé par des avocats." });
        }
    }

    async function handleModifier(e) {
        e.preventDefault();
        setMessage(null);
        setChargementForm(true);
        try {
            const updateData = { ...formData };
            if (!updateData.motDePasse) delete updateData.motDePasse;
            await api.put(`/admin/utilisateurs/${utilisateurSelectionne.id}`, updateData);
            setMessage({ type: "succes", texte: "Utilisateur modifié avec succès." });
            chargerTousUtilisateurs();
            fermerFormulaire();
        } catch (err) {
            setMessage({ type: "erreur", texte: err.response?.data?.erreur || "Erreur lors de la modification." });
        } finally { setChargementForm(false); }
    }

    async function handleModifierAvocat(e) {
        e.preventDefault();
        setMessageAvocat(null);
        setChargementForm(true);
        try {
            const updateData = { ...formDataAvocat };
            if (!updateData.motDePasse) delete updateData.motDePasse;
            await api.put(`/admin/utilisateurs/${avocatSelectionne.id}`, updateData);
            setMessageAvocat({ type: "succes", texte: "Avocat modifié avec succès." });
            chargerTousAvocats();
            fermerFormulaireAvocat();
        } catch (err) {
            setMessageAvocat({ type: "erreur", texte: err.response?.data?.erreur || "Erreur lors de la modification." });
        } finally { setChargementForm(false); }
    }

    async function handleToggleAcces(actif) {
        setChargementForm(true);
        try {
            await api.put(`/admin/utilisateurs/${utilisateurSelectionne.id}/acces`, null, { params: { actif } });
            setMessage({ type: "succes", texte: actif ? "Accès activé." : "Accès désactivé." });
            setUtilisateurSelectionne((prev) => ({ ...prev, actif }));
            chargerTousUtilisateurs();
        } catch {
            setMessage({ type: "erreur", texte: "Erreur lors du changement d'accès." });
        } finally { setChargementForm(false); }
    }

    async function handleToggleAccesAvocat(actif) {
        setChargementForm(true);
        try {
            await api.put(`/admin/utilisateurs/${avocatSelectionne.id}/acces`, null, { params: { actif } });
            setMessageAvocat({ type: "succes", texte: actif ? "Accès activé." : "Accès désactivé." });
            setAvocatSelectionne((prev) => ({ ...prev, actif }));
            chargerTousAvocats();
        } catch {
            setMessageAvocat({ type: "erreur", texte: "Erreur lors du changement d'accès." });
        } finally { setChargementForm(false); }
    }

    async function handleCreer(e) {
        e.preventDefault();
        setMessage(null);
        setChargementForm(true);
        try {
            const dataToSend = { ...formData };
            if (dataToSend.role === "AVOCAT") {
                dataToSend.motDePasse = "AVOCAT_" + Math.random().toString(36).slice(2, 12);
            }
            const res = await api.post("/admin/utilisateurs", dataToSend);
            setMessage({ type: "succes", texte: "Personnel ajouté avec succès." });
            const u = res.data;
            // Nach Erstellen in den richtigen Tab weiterleiten
            if (u.role === "AVOCAT") {
                chargerTousAvocats();
                setRechercheAvocatsEffectuee(true);
                setMode("avocats");
                setTimeout(() => {
                    setAvocatSelectionne(u);
                    setFormDataAvocat({ ...utilisateurVide, ...u, instanceId: u.instance?.id || "", motDePasse: "", barreau: u.barreau || "", numeroOrdre: u.numeroOrdre || "" });
                    setModeFormulaireAvocat("voir");
                }, 50);
            } else {
                chargerTousUtilisateurs();
                setRechercheEffectuee(true);
                setMode("personnel");
                setTimeout(() => {
                    setUtilisateurSelectionne(u);
                    setFormData({ ...utilisateurVide, ...u, instanceId: u.instance?.id || "", motDePasse: "", barreau: u.barreau || "", numeroOrdre: u.numeroOrdre || "" });
                    setModeFormulaire("voir");
                }, 50);
            }
        } catch (err) {
            setMessage({ type: "erreur", texte: err.response?.data?.erreur || "Erreur lors de la création." });
        } finally { setChargementForm(false); }
    }

    function renderFelder(isNouveauMode, data, onFieldChange, readonly) {
        return (
            <div className="admin-form-grid">
                {isNouveauMode && data.role !== "AVOCAT" && (
                    <div className="form-field">
                        <label>Numéro de matricule *</label>
                        <input value={data.numeroMatricule} onChange={(e) => onFieldChange("numeroMatricule", e.target.value)} required disabled={readonly} placeholder="ex: GREF001" />
                    </div>
                )}
                <div className="form-field">
                    <label>Nom {isNouveauMode && "*"}</label>
                    <input value={data.nom || ""} onChange={(e) => onFieldChange("nom", e.target.value)} required={isNouveauMode} disabled={readonly} />
                </div>
                <div className="form-field">
                    <label>Post Nom</label>
                    <input value={data.postNom || ""} onChange={(e) => onFieldChange("postNom", e.target.value)} disabled={readonly} />
                </div>
                <div className="form-field">
                    <label>Prénom</label>
                    <input value={data.prenom || ""} onChange={(e) => onFieldChange("prenom", e.target.value)} disabled={readonly} />
                </div>
                <div className="form-field">
                    <label>Sexe</label>
                    <select value={data.sexe || ""} onChange={(e) => onFieldChange("sexe", e.target.value)} disabled={readonly}>
                        <option value="">-- Choisir --</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                    </select>
                </div>
                {data.role !== "AVOCAT" ? (
                    <div className="form-field">
                        <label>Role</label>
                        <select value={data.titre || ""} onChange={(e) => onFieldChange("titre", e.target.value)} disabled={readonly}>
                            <option value="">-- Choisir --</option>
                            <option value="Magistrat">Magistrat</option>
                            <option value="Admin">Admin</option>
                            <option value="Greffier">Greffier</option>
                            <option value="Autre">Autres</option>
                        </select>
                    </div>
                ) : (
                    <div className="form-field">
                        <label>Role</label>
                        <input value="Avocat" disabled />
                    </div>
                )}
                {data.role !== "AVOCAT" && (
                    <div className="form-field">
                        <label>Type</label>
                        <select value={data.typeDroit || ""} onChange={(e) => onFieldChange("typeDroit", e.target.value)} disabled={readonly}>
                            <option value="">-- Choisir --</option>
                            <option value="PENAL">Parquet</option>
                            <option value="CIVIL">Tribunal</option>
                        </select>
                    </div>
                )}
                <div className="form-field">
                    <label>Grade</label>
                    <select value={data.grade || ""} onChange={(e) => onFieldChange("grade", e.target.value)} disabled={readonly}>
                        <option value="">-- Choisir --</option>
                        <option value="AG">AG</option>
                        <option value="SP">SP</option>
                        <option value="1AG">1AG</option>
                        <option value="2AG">2AG</option>
                        <option value="1SP">1SP</option>
                        <option value="2SP">2SP</option>
                    </select>
                </div>
                <div className="form-field">
                    <label>Affectation</label>
                    <select value={data.instanceId || ""} onChange={(e) => onFieldChange("instanceId", e.target.value)} disabled={readonly}>
                        <option value="">-- Choisir une instance --</option>
                        {instances.map((i) => (<option key={i.id} value={i.id}>{i.nomInstance} ({i.ville})</option>))}
                    </select>
                </div>
                {isNouveauMode && (
                    <div className="form-field">
                        <label>Rôle initial *</label>
                        <select value={data.role || ""} onChange={(e) => onFieldChange("role", e.target.value)} required disabled={readonly}>
                            <option value="">-- Choisir --</option>
                            <option value="GREFFIER">Greffier</option>
                            <option value="PROCUREUR_GENERAL">Procureur Général</option>
                            <option value="PROCUREUR">Procureur</option>
                            <option value="PRESIDENT_TRIBUNAL">Président Tribunal</option>
                            <option value="JUGE_INSTRUCTION">Juge d'instruction</option>
                            <option value="AVOCAT">Avocat</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                )}
                {data.role === "AVOCAT" && (
                    <>
                        <div className="form-field">
                            <label>Barreau</label>
                            <select value={data.barreau || ""} onChange={(e) => onFieldChange("barreau", e.target.value)} disabled={readonly}>
                                <option value="">-- Choisir un barreau --</option>
                                {barreaux.map((b) => (<option key={b.id} value={b.nom}>{b.nom} ({b.province})</option>))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Numéro de l'ordre</label>
                            <input value={data.numeroOrdre || ""} onChange={(e) => onFieldChange("numeroOrdre", e.target.value)} disabled={readonly} placeholder="ex: KIN-2024-001" />
                        </div>
                    </>
                )}
                <div className="form-field">
                    <label>Date de naissance</label>
                    <input type="date" value={data.dateNaissance || ""} onChange={(e) => onFieldChange("dateNaissance", e.target.value)} disabled={readonly} />
                </div>
                <div className="form-field">
                    <label>Lieu de naissance</label>
                    <input value={data.lieuNaissance || ""} onChange={(e) => onFieldChange("lieuNaissance", e.target.value)} disabled={readonly} />
                </div>
                <div className="form-field">
                    <label>District</label>
                    <input value={data.districtOrigine || ""} onChange={(e) => onFieldChange("districtOrigine", e.target.value)} disabled={readonly} />
                </div>
                <div className="form-field">
                    <label>Secteur</label>
                    <input value={data.secteur || ""} onChange={(e) => onFieldChange("secteur", e.target.value)} disabled={readonly} />
                </div>
                <div className="form-field">
                    <label>Village</label>
                    <input value={data.villageOrigine || ""} onChange={(e) => onFieldChange("villageOrigine", e.target.value)} disabled={readonly} />
                </div>
                <div className="form-field">
                    <label>Diplôme</label>
                    <input value={data.diplome || ""} onChange={(e) => onFieldChange("diplome", e.target.value)} disabled={readonly} />
                </div>
                <div className="form-field">
                    <label>Université</label>
                    <input value={data.universite || ""} onChange={(e) => onFieldChange("universite", e.target.value)} disabled={readonly} />
                </div>
                {data.role !== "AVOCAT" && !readonly && (
                    <div className="form-field">
                        <label>{isNouveauMode ? "Mot de passe *" : "Nouveau mot de passe (optionnel)"}</label>
                        <input type="password" placeholder={isNouveauMode ? "" : "Laisser vide pour ne pas changer"} value={data.motDePasse || ""} onChange={(e) => onFieldChange("motDePasse", e.target.value)} required={isNouveauMode && data.role !== "AVOCAT"} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <AppLayout>
            <h2 className="dossiers-title">Administration</h2>
            <p className="dossiers-subtitle">
                {estAdmin ? "Gérez le personnel, les avocats, les instances et les affectations." : "Consultez la liste du personnel."}
            </p>

            {/* ----- Tabs ----- */}
            <div className="admin-tabs">
                <button className={mode === "personnel" ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => { setMode("personnel"); setMessage(null); fermerFormulaire(); }}>
                    Personnel
                </button>
                <button className={mode === "avocats" ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => { setMode("avocats"); setMessageAvocat(null); fermerFormulaireAvocat(); }}>
                    Avocats
                </button>
                {estAdmin && (
                    <>
                        <button className={mode === "nouveau" ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => { setMode("nouveau"); setFormData(utilisateurVide); setMessage(null); setUtilisateurSelectionne(null); }}>
                            Ajouter
                        </button>
                        <button className={mode === "instances" ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => { setMode("instances"); setMessageInstance(null); fermerInstanceFormulaire(); }}>
                            Instances
                        </button>
                        <button className={mode === "barreaux" ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => { setMode("barreaux"); setMessageBarreau(null); setBarreauForm(barreauVide); }}>
                            Barreaux
                        </button>
                        <button className={mode === "villes" ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => { setMode("villes"); setMessageVille(null); setVilleForm(villeVide); }}>
                            Villes
                        </button>
                    </>
                )}
            </div>

            {message && <p className={`admin-message admin-message-${message.type}`}>{message.texte}</p>}

            {/* ============================================================
                TAB "PERSONNEL" - NUR Nicht-Avocats
            ============================================================ */}
            {mode === "personnel" && (
                <>
                    <div className="dossiers-search-card">
                        <div className="dossiers-search-grid">
                            <div className="form-field">
                                <label>Nom</label>
                                <input type="text" value={filtreNom} onChange={(e) => setFiltreNom(e.target.value)} placeholder="ex: Beto..." />
                            </div>
                            <div className="form-field">
                                <label>Numéro Matricule</label>
                                <input type="text" value={filtreMatricule} onChange={(e) => setFiltreMatricule(e.target.value)} placeholder="ex: 56LK..." />
                            </div>
                            <div className="form-field">
                                <label>Province</label>
                                <select value={filtreProvince} onChange={(e) => { setFiltreProvince(e.target.value); setFiltreVille(""); setFiltreInstance(""); }}>
                                    <option value="">Toutes les provinces</option>
                                    {PROVINCES_DRC.map((p) => (<option key={p} value={p}>{p}</option>))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Ville</label>
                                <select value={filtreVille} onChange={(e) => setFiltreVille(e.target.value)} disabled={villesFiltrees.length === 0}>
                                    <option value="">Toutes les villes</option>
                                    {villesFiltrees.map((v) => (<option key={v} value={v}>{v}</option>))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Affectation</label>
                                <select value={filtreInstance} onChange={(e) => setFiltreInstance(e.target.value)}>
                                    <option value="">Toutes</option>
                                    {instances.filter(i => (!filtreProvince || i.province === filtreProvince) && (!filtreVille || i.ville === filtreVille)).map((i) => (<option key={i.id} value={i.id}>{i.nomInstance} ({i.ville})</option>))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Role</label>
                                <select value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)}>
                                    <option value="">Tous</option>
                                    <option value="Magistrat">Magistrat</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Greffier">Greffier</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Type</label>
                                <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)}>
                                    <option value="">Tous</option>
                                    <option value="PENAL">Parquet</option>
                                    <option value="CIVIL">Tribunal</option>
                                </select>
                            </div>
                        </div>
                        <button type="button" className="dossiers-search-button" disabled={chargement} onClick={handleChercher}>
                            {chargement ? "Recherche..." : "Chercher"}
                        </button>
                    </div>

                    {utilisateurSelectionne && (
                        <>
                            <form className="admin-form-card" onSubmit={handleModifier}>
                                <div className="admin-found-header">
                                    <span><strong>Matricule:</strong> {utilisateurSelectionne.numeroMatricule || "-"}</span>
                                    <span><strong>Nom:</strong> {utilisateurSelectionne.nom} {utilisateurSelectionne.postNom}</span>
                                    <span><strong>Role:</strong> {utilisateurSelectionne.titre || "-"}</span>
                                    <span><strong>Type:</strong> {utilisateurSelectionne.typeDroit === "PENAL" ? "Parquet" : utilisateurSelectionne.typeDroit === "CIVIL" ? "Tribunal" : "-"}</span>
                                    <span><strong>Grade:</strong> {utilisateurSelectionne.grade || "-"}</span>
                                    <span><strong>Instance:</strong> {utilisateurSelectionne.instance?.nomInstance || "-"}</span>
                                </div>
                                {renderFelder(false, formData, handleField, !estAdmin || modeFormulaire === "voir")}
                                <div className="admin-actions">
                                    {estAdmin && modeFormulaire === "voir" && (
                                        <button type="button" className="admin-button-primary" onClick={() => setModeFormulaire("modifier")}>Modifier</button>
                                    )}
                                    {modeFormulaire === "modifier" && (
                                        <button type="submit" className="admin-button-primary" disabled={chargementForm}>
                                            {chargementForm ? "Sauvegarde..." : "Enregistrer les modifications"}
                                        </button>
                                    )}
                                    <button type="button" className="admin-button-secondary" onClick={fermerFormulaire}>Fermer</button>
                                    {estAdmin && (utilisateurSelectionne.actif ? (
                                        <button type="button" className="admin-button-danger" onClick={() => handleToggleAcces(false)}>Désactiver l'accès</button>
                                    ) : (
                                        <button type="button" className="admin-button-success" onClick={() => handleToggleAcces(true)}>Activer l'accès</button>
                                    ))}
                                </div>
                            </form>
                            <DocumentsPersonnel utilisateurId={utilisateurSelectionne.id} nomMitarbeiter={`${utilisateurSelectionne.nom} ${utilisateurSelectionne.postNom || ""}`} />
                        </>
                    )}

                    {chargement && <p className="dossiers-aucun">Chargement...</p>}
                    {!chargement && !rechercheEffectuee && <p className="dossiers-aucun">Utilisez le formulaire ci-dessus pour rechercher un membre du personnel.</p>}
                    {!chargement && rechercheEffectuee && (
                        <div className="dossiers-table-card">
                            <p className="dossiers-aucun" style={{ marginBottom: "8px" }}>{utilisateursFiltres.length} personne(s) trouvée(s)</p>
                            <table className="dossiers-table">
                                <thead>
                                <tr>
                                    <th>Accès</th><th>Matricule</th><th>Nom</th><th>Post Nom</th>
                                    <th>Prénom</th><th>Sexe</th><th>Lieu de N.</th><th>Date de N.</th>
                                    <th>Role</th><th>Type</th><th>Grade</th><th>Affectation</th>
                                </tr>
                                </thead>
                                <tbody>
                                {utilisateursFiltres.length === 0 ? (
                                    <tr><td colSpan={12} style={{ textAlign: "center", padding: "20px", color: "var(--color-text-muted)" }}>Aucun personnel trouvé.</td></tr>
                                ) : (
                                    utilisateursFiltres.map((u) => (
                                        <tr key={u.id} onClick={() => handleRowClick(u)} className="dossiers-row-clickable">
                                            <td><span className={`status-dot ${u.actif ? "status-actif" : "status-ferme"}`} /></td>
                                            <td>{u.numeroMatricule || "-"}</td>
                                            <td>{u.nom}</td><td>{u.postNom || "-"}</td><td>{u.prenom || "-"}</td>
                                            <td>{u.sexe || "-"}</td><td>{u.lieuNaissance || "-"}</td><td>{u.dateNaissance || "-"}</td>
                                            <td>{u.titre || "-"}</td>
                                            <td>{u.typeDroit === "PENAL" ? "Parquet" : u.typeDroit === "CIVIL" ? "Tribunal" : "-"}</td>
                                            <td>{u.grade || "-"}</td><td>{u.instance?.nomInstance || "-"}</td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ============================================================
                TAB "AVOCATS" - NUR Avocats
            ============================================================ */}
            {mode === "avocats" && (
                <>
                    {messageAvocat && <p className={`admin-message admin-message-${messageAvocat.type}`}>{messageAvocat.texte}</p>}

                    <div className="dossiers-search-card">
                        <div className="dossiers-search-grid">
                            <div className="form-field">
                                <label>Nom</label>
                                <input type="text" value={filtreNomAvocat} onChange={(e) => setFiltreNomAvocat(e.target.value)} placeholder="ex: Nzau..." />
                            </div>
                            <div className="form-field">
                                <label>Numéro de l'ordre</label>
                                <input type="text" value={filtreNumeroOrdre} onChange={(e) => setFiltreNumeroOrdre(e.target.value)} placeholder="ex: KIN-2024..." />
                            </div>
                            <div className="form-field">
                                <label>Barreau</label>
                                <input type="text" value={filtreBarreauAvocat} onChange={(e) => setFiltreBarreauAvocat(e.target.value)} placeholder="ex: Kinshasa..." />
                            </div>
                        </div>
                        <button type="button" className="dossiers-search-button" disabled={chargementAvocats} onClick={handleChercherAvocats}>
                            {chargementAvocats ? "Recherche..." : "Chercher"}
                        </button>
                    </div>

                    {avocatSelectionne && (
                        <>
                            <form className="admin-form-card" onSubmit={handleModifierAvocat}>
                                <div className="admin-found-header">
                                    <span><strong>Nom:</strong> {avocatSelectionne.nom} {avocatSelectionne.postNom}</span>
                                    <span><strong>Numéro de l'ordre:</strong> {avocatSelectionne.numeroOrdre || "-"}</span>
                                    <span><strong>Barreau:</strong> {avocatSelectionne.barreau || "-"}</span>
                                </div>
                                {renderFelder(false, formDataAvocat, handleFieldAvocat, !estAdmin || modeFormulaireAvocat === "voir")}
                                <div className="admin-actions">
                                    {estAdmin && modeFormulaireAvocat === "voir" && (
                                        <button type="button" className="admin-button-primary" onClick={() => setModeFormulaireAvocat("modifier")}>Modifier</button>
                                    )}
                                    {modeFormulaireAvocat === "modifier" && (
                                        <button type="submit" className="admin-button-primary" disabled={chargementForm}>
                                            {chargementForm ? "Sauvegarde..." : "Enregistrer les modifications"}
                                        </button>
                                    )}
                                    <button type="button" className="admin-button-secondary" onClick={fermerFormulaireAvocat}>Fermer</button>
                                    {estAdmin && (avocatSelectionne.actif ? (
                                        <button type="button" className="admin-button-danger" onClick={() => handleToggleAccesAvocat(false)}>Désactiver l'accès</button>
                                    ) : (
                                        <button type="button" className="admin-button-success" onClick={() => handleToggleAccesAvocat(true)}>Activer l'accès</button>
                                    ))}
                                </div>
                            </form>
                            <DocumentsPersonnel utilisateurId={avocatSelectionne.id} nomMitarbeiter={`${avocatSelectionne.nom} ${avocatSelectionne.postNom || ""}`} />
                        </>
                    )}

                    {chargementAvocats && <p className="dossiers-aucun">Chargement...</p>}
                    {!chargementAvocats && !rechercheAvocatsEffectuee && <p className="dossiers-aucun">Utilisez le formulaire ci-dessus pour rechercher un avocat.</p>}
                    {!chargementAvocats && rechercheAvocatsEffectuee && (
                        <div className="dossiers-table-card">
                            <p className="dossiers-aucun" style={{ marginBottom: "8px" }}>{avocatsFiltres.length} avocat(s) trouvé(s)</p>
                            <table className="dossiers-table">
                                <thead>
                                <tr>
                                    <th>Accès</th><th>Nom</th><th>Post Nom</th><th>Prénom</th>
                                    <th>Numéro de l'ordre</th><th>Barreau</th>
                                </tr>
                                </thead>
                                <tbody>
                                {avocatsFiltres.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--color-text-muted)" }}>Aucun avocat trouvé.</td></tr>
                                ) : (
                                    avocatsFiltres.map((u) => (
                                        <tr key={u.id} onClick={() => handleAvocatClick(u)} className="dossiers-row-clickable">
                                            <td><span className={`status-dot ${u.actif ? "status-actif" : "status-ferme"}`} /></td>
                                            <td>{u.nom}</td><td>{u.postNom || "-"}</td><td>{u.prenom || "-"}</td>
                                            <td>{u.numeroOrdre || "-"}</td><td>{u.barreau || "-"}</td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ============================================================
                TAB "AJOUTER" - nur ADMIN
            ============================================================ */}
            {mode === "nouveau" && estAdmin && (
                <form className="admin-form-card" onSubmit={handleCreer}>
                    {renderFelder(true, formData, handleField, false)}
                    {formData.role === "AVOCAT" && (
                        <p className="admin-hint">
                            ℹ️ Les avocats n'ont pas besoin de mot de passe ni de matricule :
                            ils ne se connectent jamais à JusticePro.
                        </p>
                    )}
                    <button type="submit" className="admin-button-primary" disabled={chargementForm}>
                        {chargementForm ? "Création..." : "Créer"}
                    </button>
                </form>
            )}

            {/* ============================================================
                TAB "INSTANCES" - nur ADMIN
            ============================================================ */}
            {mode === "instances" && estAdmin && (
                <>
                    {messageInstance && <p className={`admin-message admin-message-${messageInstance.type}`}>{messageInstance.texte}</p>}
                    <form className="admin-form-card" onSubmit={handleSauvegarderInstance}>
                        <h3 style={{ marginBottom: "16px" }}>{instanceSelectionnee ? "Modifier l'instance" : "Ajouter une nouvelle instance"}</h3>
                        <div className="admin-form-grid">
                            <div className="form-field">
                                <label>Province *</label>
                                <select value={instanceForm.province} onChange={(e) => handleInstanceField("province", e.target.value)} required>
                                    <option value="">-- Choisir une province --</option>
                                    {PROVINCES_DRC.map((p) => (<option key={p} value={p}>{p}</option>))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Ville *</label>
                                <select value={instanceForm.ville} onChange={(e) => handleInstanceField("ville", e.target.value)} required disabled={!instanceForm.province}>
                                    <option value="">-- Choisir une ville --</option>
                                    {villes
                                        .filter(v => !instanceForm.province || v.province === instanceForm.province)
                                        .sort((a, b) => a.nom.localeCompare(b.nom))
                                        .map(v => (
                                            <option key={v.province + "-" + v.nom} value={v.nom}>{v.nom}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Type d'instance *</label>
                                <select value={instanceForm.typeInstance} onChange={(e) => handleInstanceField("typeInstance", e.target.value)} required>
                                    <option value="">-- Choisir un type --</option>
                                    {TYPES_INSTANCE.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Catégorie</label>
                                <select value={instanceForm.categorie|| ""} onChange={(e) => handleInstanceField("categorie", e.target.value)}>
                                    <option value="">-- Choisir --</option>
                                    <option value="Tripaix">Tripaix</option>
                                    <option value="Tribunal de Grandes Instances">Tribunal de Grandes Instances</option>
                                    <option value="Cours d'Appel">Cours d'Appel</option>
                                    <option value="Cours de Cassation">Cours de Cassation</option>
                                    <option value="Tribunal Administratif">Tribunal Administratif</option>
                                    <option value="Cour Administrative d'Appel">Cour Administrative d'Appel</option>
                                    <option value="Conseil d'Etat">Conseil d'Etat</option>
                                    <option value="Cour Constitutionnelle">Cour Constitutionnelle</option>
                                    <option value="Tribunal Militaire de Garnison">Tribunal Militaire de Garnison</option>
                                    <option value="Cours Militaire">Cours Militaire</option>
                                    <option value="Haute Cour Militaire">Haute Cour Militaire</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Branche</label>
                                <input value={instanceForm.branche || ""} onChange={(e) => handleInstanceField("branche", e.target.value)} placeholder="ex: Magistrature du siège..." />
                            </div>
                            <div className="form-field">
                                <label>Nom de l'instance *</label>
                                <input value={instanceForm.nomInstance} onChange={(e) => handleInstanceField("nomInstance", e.target.value)} required placeholder="ex: Tripaix Matete..." />
                            </div>
                        </div>
                        <div className="admin-actions">
                            <button type="submit" className="admin-button-primary" disabled={chargementInstance}>
                                {chargementInstance ? "Sauvegarde..." : instanceSelectionnee ? "Enregistrer les modifications" : "Ajouter l'instance"}
                            </button>
                            {instanceSelectionnee && <button type="button" className="admin-button-secondary" onClick={fermerInstanceFormulaire}>Fermer</button>}
                        </div>
                    </form>
                    <div className="dossiers-table-card">
                        <p className="dossiers-aucun" style={{ marginBottom: "8px" }}>{instances.length} instance(s) enregistrée(s)</p>
                        <table className="dossiers-table">
                            <thead><tr><th>Province</th><th>Ville</th><th>Type</th><th>Catégorie</th><th>Branche</th><th>Nom de l'instance</th><th>Actions</th></tr></thead>
                            <tbody>
                            {instances.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "var(--color-text-muted)" }}>Aucune instance enregistrée.</td></tr>
                            ) : (
                                instances.map((i) => (
                                    <tr key={i.id} className="dossiers-row-clickable" onClick={() => ouvrirInstanceFormulaire(i)}>
                                        <td>{i.province || "-"}</td><td>{i.ville || "-"}</td>
                                        <td>{i.typeInstance || "-"}</td><td>{i.categorie || "-"}</td><td>{i.branche || "-"}</td><td>{i.nomInstance || "-"}</td>
                                        <td><button type="button" className="admin-button-danger" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={(e) => { e.stopPropagation(); handleSupprimerInstance(i.id); }}>Supprimer</button></td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ============================================================
                TAB "BARREAUX" - nur ADMIN
            ============================================================ */}
            {mode === "barreaux" && estAdmin && (
                <>
                    {messageBarreau && <p className={`admin-message admin-message-${messageBarreau.type}`}>{messageBarreau.texte}</p>}
                    <form className="admin-form-card" onSubmit={handleAjouterBarreau}>
                        <h3 style={{ marginBottom: "16px" }}>Ajouter un nouveau barreau</h3>
                        <div className="admin-form-grid">
                            <div className="form-field">
                                <label>Province *</label>
                                <select value={barreauForm.province} onChange={(e) => handleBarreauField("province", e.target.value)} required>
                                    <option value="">-- Choisir une province --</option>
                                    {PROVINCES_DRC.map((p) => (<option key={p} value={p}>{p}</option>))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Nom du barreau *</label>
                                <input value={barreauForm.nom} onChange={(e) => handleBarreauField("nom", e.target.value)} required placeholder="ex: Barreau de Kinshasa/Gombe" />
                            </div>
                        </div>
                        <div className="admin-actions">
                            <button type="submit" className="admin-button-primary" disabled={chargementBarreau}>
                                {chargementBarreau ? "Ajout..." : "Ajouter le barreau"}
                            </button>
                        </div>
                    </form>
                    <div className="dossiers-table-card">
                        <p className="dossiers-aucun" style={{ marginBottom: "8px" }}>{barreaux.length} barreau(x) enregistré(s)</p>
                        <table className="dossiers-table">
                            <thead><tr><th>Province</th><th>Nom du barreau</th><th>Actions</th></tr></thead>
                            <tbody>
                            {barreaux.length === 0 ? (
                                <tr><td colSpan={3} style={{ textAlign: "center", padding: "20px", color: "var(--color-text-muted)" }}>Aucun barreau enregistré.</td></tr>
                            ) : (
                                barreaux.map((b) => (
                                    <tr key={b.id}>
                                        <td>{b.province || "-"}</td><td>{b.nom || "-"}</td>
                                        <td><button type="button" className="admin-button-danger" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => handleSupprimerBarreau(b.id)}>Supprimer</button></td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ============================================================
                TAB "VILLES" - nur ADMIN
            ============================================================ */}
            {mode === "villes" && estAdmin && (
                <>
                    {messageVille && (
                        <p className={`admin-message admin-message-${messageVille.type}`}>
                            {messageVille.texte}
                        </p>
                    )}
                    <div className="admin-form-card">
                        <h3 style={{ marginBottom: "16px" }}>Ajouter une ville</h3>
                        <form onSubmit={creerVille}>
                            <div className="admin-form-grid">
                                <div className="form-field">
                                    <label>Province *</label>
                                    <select value={villeForm.province}
                                            onChange={e => setVilleForm({ ...villeForm, province: e.target.value })}
                                            required>
                                        <option value="">-- Choisir --</option>
                                        {PROVINCES_DRC.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Nom de la ville *</label>
                                    <input value={villeForm.nom}
                                           onChange={e => setVilleForm({ ...villeForm, nom: e.target.value })}
                                           placeholder="ex: Kinshasa..."
                                           required />
                                </div>
                            </div>
                            <button type="submit" className="admin-button-primary">
                                Ajouter la ville
                            </button>
                        </form>
                    </div>

                    <div className="admin-found-header">
                        <p className="dossiers-aucun" style={{ marginBottom: "8px" }}>{villes.length} ville(s) enregistrée(s)</p>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>Province</th>
                                <th>Ville</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {villes.length === 0 ? (
                                <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>Aucune ville enregistrée.</td></tr>
                            ) : (
                                villes
                                    .sort((a, b) => a.province.localeCompare(b.province) || a.nom.localeCompare(b.nom))
                                    .map((v) => (
                                        <tr key={v.id}>
                                            <td>{v.province || "-"}</td>
                                            <td>{v.nom || "-"}</td>
                                            <td><button type="button" className="admin-button-danger" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => supprimerVille(v.id)}>Supprimer</button></td>
                                        </tr>
                                    ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </AppLayout>
    );
}