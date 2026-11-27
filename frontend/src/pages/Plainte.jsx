import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import "./Plainte.css";

/**
 * Seite zum Erfassen einer neuen Plainte.
 * Nur für GREFFIER zugänglich.
 *
 * FELDER:
 *  - Plaignant: Nom (Pflichtfeld), alle anderen optional
 *  - Suspects: beliebig viele, Nom Pflichtfeld
 *  - Description, Observation, Charge/Relaxion
 *
 * ÄNDERUNGEN:
 *  - Autocomplete für Avocats per Numéro d'ordre
 *  - Nationalité direkt nach État civil
 *  - Adresse direkt nach Kontakt
 *  - Profession nach Niveau d'étude
 */
export default function Plainte() {
    const navigate = useNavigate();

    // ----- Plaignant Felder -----
    const [plaignantNom, setPlaignantNom] = useState("");
    const [plaignantPostNom, setPlaignantPostNom] = useState("");
    const [plaignantPrenom, setPlaignantPrenom] = useState("");
    const [plaignantSexe, setPlaignantSexe] = useState("");
    const [plaignantDateNaissance, setPlaignantDateNaissance] = useState("");
    const [plaignantLieuNaissance, setPlaignantLieuNaissance] = useState("");
    const [plaignantVillageOrigine, setPlaignantVillageOrigine] = useState("");
    const [plaignantSecteur, setPlaignantSecteur] = useState("");
    const [plaignantTerritoire, setPlaignantTerritoire] = useState("");
    const [plaignantAssistance, setPlaignantAssistance] = useState(false);
    const [plaignantEtatCivil, setPlaignantEtatCivil] = useState("");
    const [plaignantNomPere, setPlaignantNomPere] = useState("");
    const [plaignantNomMere, setPlaignantNomMere] = useState("");
    const [plaignantNombreEnfants, setPlaignantNombreEnfants] = useState("");
    const [plaignantNumeroTelephone, setPlaignantNumeroTelephone] = useState("");
    const [plaignantAdresseEmail, setPlaignantAdresseEmail] = useState("");
    const [plaignantAdresse, setPlaignantAdresse] = useState("");
    const [plaignantNationalite, setPlaignantNationalite] = useState("");
    const [plaignantNiveauEtude, setPlaignantNiveauEtude] = useState("");
    const [plaignantProfession, setPlaignantProfession] = useState("");

    // ----- Avocats du Plaignant -----
    const [avocatsPlaignant, setAvocatsPlaignant] = useState([]);
    const [numeroOrdrePlaignantInput, setNumeroOrdrePlaignantInput] = useState("");
    const [erreurAvocatPlaignant, setErreurAvocatPlaignant] = useState("");
    const [suggestionsAvocatPlaignant, setSuggestionsAvocatPlaignant] = useState([]);

    // ----- Suspects -----
    const [suspects, setSuspects] = useState([{
        nom: "", postNom: "", prenom: "", sexe: "",
        dateNaissance: "", lieuNaissance: "", villageOrigine: "",
        secteur: "", territoire: "", assistance: false,
        etatCivil: "", nomPere: "", nomMere: "",
        nombreEnfants: "", numeroTelephone: "", adresseEmail: "",
        adresse: "", nationalite: "",
        niveauEtude: "", profession: "",
    }]);

    // ----- Avocats des Suspects -----
    const [avocatsSuspect, setAvocatsSuspect] = useState([]);
    const [numeroOrdreSuspectInput, setNumeroOrdreSuspectInput] = useState("");
    const [erreurAvocatSuspect, setErreurAvocatSuspect] = useState("");
    const [suggestionsAvocatSuspect, setSuggestionsAvocatSuspect] = useState([]);

    // ----- Textfelder -----
    const [descriptionPlainte, setDescriptionPlainte] = useState("");
    const [observation, setObservation] = useState("");
    const [chargeRelaxion, setChargeRelaxion] = useState("");

    // ----- Status -----
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState("");

    /**
     * Autocomplete für Avocats du Plaignant.
     * Sucht per Numéro d'ordre während der Greffier tippt.
     */
    async function rechercherAvocatPlaignant(valeur) {
        setNumeroOrdrePlaignantInput(valeur);
        if (!valeur.trim()) { setSuggestionsAvocatPlaignant([]); return; }
        try {
            const res = await api.get("/utilisateurs/recherche-avocat", {
                params: { numeroOrdre: valeur.trim() }
            });
            setSuggestionsAvocatPlaignant(res.data);
        } catch { setSuggestionsAvocatPlaignant([]); }
    }

    /**
     * Avocat aus Vorschlagsliste auswählen (Plaignant).
     */
    function selectionnerAvocatPlaignant(avocat) {
        if (avocatsPlaignant.find(a => a.id === avocat.id)) {
            setErreurAvocatPlaignant("Cet avocat est déjà ajouté.");
        } else {
            setAvocatsPlaignant(prev => [...prev, avocat]);
            setErreurAvocatPlaignant("");
        }
        setNumeroOrdrePlaignantInput("");
        setSuggestionsAvocatPlaignant([]);
    }

    /**
     * Autocomplete für Avocats des Suspects.
     * Sucht per Numéro d'ordre während der Greffier tippt.
     */
    async function rechercherAvocatSuspect(valeur) {
        setNumeroOrdreSuspectInput(valeur);
        if (!valeur.trim()) { setSuggestionsAvocatSuspect([]); return; }
        try {
            const res = await api.get("/utilisateurs/recherche-avocat", {
                params: { numeroOrdre: valeur.trim() }
            });
            setSuggestionsAvocatSuspect(res.data);
        } catch { setSuggestionsAvocatSuspect([]); }
    }

    /**
     * Avocat aus Vorschlagsliste auswählen (Suspect).
     */
    function selectionnerAvocatSuspect(avocat) {
        if (avocatsSuspect.find(a => a.id === avocat.id)) {
            setErreurAvocatSuspect("Cet avocat est déjà ajouté.");
        } else {
            setAvocatsSuspect(prev => [...prev, avocat]);
            setErreurAvocatSuspect("");
        }
        setNumeroOrdreSuspectInput("");
        setSuggestionsAvocatSuspect([]);
    }

    /**
     * Neuen leeren Suspect hinzufügen.
     */
    function ajouterSuspect() {
        setSuspects(prev => [...prev, {
            nom: "", postNom: "", prenom: "", sexe: "",
            dateNaissance: "", lieuNaissance: "", villageOrigine: "",
            secteur: "", territoire: "", assistance: false,
            etatCivil: "", nomPere: "", nomMere: "",
            nombreEnfants: "", numeroTelephone: "", adresseEmail: "",
            adresse: "", nationalite: "",
            niveauEtude: "", profession: "",
        }]);
    }

    /**
     * Feld eines Suspects aktualisieren.
     */
    function updateSuspect(index, champ, valeur) {
        setSuspects(prev => prev.map((s, i) => i === index ? { ...s, [champ]: valeur } : s));
    }

    /**
     * Suspect aus der Liste entfernen.
     */
    function supprimerSuspect(index) {
        setSuspects(prev => prev.filter((_, i) => i !== index));
    }

    /**
     * Plainte an Backend senden.
     */
    async function handleSubmit(e) {
        e.preventDefault();
        if (!plaignantNom.trim()) {
            setErreur("Le nom du plaignant est obligatoire.");
            return;
        }
        setEnvoiEnCours(true);
        setErreur("");
        try {
            await api.post("/plaintes", {
                plaignant: {
                    nom: plaignantNom,
                    postNom: plaignantPostNom,
                    prenom: plaignantPrenom,
                    sexe: plaignantSexe,
                    dateNaissance: plaignantDateNaissance || null,
                    lieuNaissance: plaignantLieuNaissance,
                    villageOrigine: plaignantVillageOrigine,
                    secteur: plaignantSecteur,
                    territoire: plaignantTerritoire,
                    assistance: plaignantAssistance,
                    etatCivil: plaignantEtatCivil,
                    nomPere: plaignantNomPere,
                    nomMere: plaignantNomMere,
                    nombreEnfants: plaignantNombreEnfants === "" ? null : Number(plaignantNombreEnfants),
                    numeroTelephone: plaignantNumeroTelephone,
                    adresseEmail: plaignantAdresseEmail,
                    adresse: plaignantAdresse,
                    nationalite: plaignantNationalite,
                    niveauEtude: plaignantNiveauEtude,
                    profession: plaignantProfession,
                },
                suspects: suspects.map(s => ({
                    nom: s.nom,
                    postNom: s.postNom,
                    prenom: s.prenom,
                    sexe: s.sexe,
                    dateNaissance: s.dateNaissance || null,
                    lieuNaissance: s.lieuNaissance,
                    villageOrigine: s.villageOrigine,
                    secteur: s.secteur,
                    territoire: s.territoire,
                    assistance: s.assistance,
                    etatCivil: s.etatCivil,
                    nomPere: s.nomPere,
                    nomMere: s.nomMere,
                    nombreEnfants: s.nombreEnfants === "" ? null : Number(s.nombreEnfants),
                    numeroTelephone: s.numeroTelephone,
                    adresseEmail: s.adresseEmail,
                    adresse: s.adresse,
                    nationalite: s.nationalite,
                    niveauEtude: s.niveauEtude,
                    profession: s.profession,
                })),
                numerosOrdrePlaignant: avocatsPlaignant.map(a => a.numeroOrdre).filter(Boolean),
                numerosOrdreSuspect: avocatsSuspect.map(a => a.numeroOrdre).filter(Boolean),
                descriptionPlainte,
                observation,
                chargeRelaxion,
            });
            navigate("/dossiers");
        } catch (err) {
            setErreur(err.response?.data?.erreur || "Erreur lors de l'enregistrement.");
        } finally {
            setEnvoiEnCours(false);
        }
    }

    return (
        <AppLayout>
            <h2 className="plainte-titre">Enregistrer une plainte</h2>

            {erreur && <p className="plainte-erreur">{erreur}</p>}

            <form onSubmit={handleSubmit} className="plainte-form">

                {/* ============================================================
                    PLAIGNANT + SUSPECTS nebeneinander
                ============================================================ */}
                <div className="plainte-zwei-spalten">

                    {/* ===== LINKE SPALTE: PLAIGNANT ===== */}
                    <div className="plainte-section-card">
                        <h3 className="plainte-section-titre">Plaignant</h3>
                        <div className="plainte-grid">

                            {/* Nom — einziges Pflichtfeld */}
                            <div className="form-field">
                                <label>Nom <span className="plainte-requis">*</span></label>
                                <input value={plaignantNom}
                                       onChange={e => setPlaignantNom(e.target.value)}
                                       required />
                            </div>
                            <div className="form-field">
                                <label>Post Nom</label>
                                <input value={plaignantPostNom}
                                       onChange={e => setPlaignantPostNom(e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Prénom</label>
                                <input value={plaignantPrenom}
                                       onChange={e => setPlaignantPrenom(e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Sexe</label>
                                <select value={plaignantSexe} onChange={e => setPlaignantSexe(e.target.value)}>
                                    <option value="">--</option>
                                    <option value="M">Masculin</option>
                                    <option value="F">Féminin</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Date de naissance</label>
                                <input type="date" value={plaignantDateNaissance}
                                       onChange={e => setPlaignantDateNaissance(e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Lieu de naissance</label>
                                <input value={plaignantLieuNaissance}
                                       onChange={e => setPlaignantLieuNaissance(e.target.value)} />
                            </div>
                            {/* État civil + Nationalité direkt danach */}
                            <div className="form-field">
                                <label>État civil</label>
                                <select value={plaignantEtatCivil} onChange={e => setPlaignantEtatCivil(e.target.value)}>
                                    <option value="">--</option>
                                    <option value="Célibataire">Célibataire</option>
                                    <option value="Marié(e)">Marié(e)</option>
                                    <option value="Divorcé(e)">Divorcé(e)</option>
                                    <option value="Veuf/Veuve">Veuf/Veuve</option>
                                </select>
                            </div>
                            {/* Nationalité direkt nach État civil */}
                            <div className="form-field">
                                <label>Nationalité</label>
                                <input value={plaignantNationalite}
                                       onChange={e => setPlaignantNationalite(e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Village d'origine</label>
                                <input value={plaignantVillageOrigine}
                                       onChange={e => setPlaignantVillageOrigine(e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Secteur</label>
                                <input value={plaignantSecteur}
                                       onChange={e => setPlaignantSecteur(e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Territoire</label>
                                <input value={plaignantTerritoire}
                                       onChange={e => setPlaignantTerritoire(e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Nom du père</label>
                                <input value={plaignantNomPere}
                                       onChange={e => setPlaignantNomPere(e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Nom de la mère</label>
                                <input value={plaignantNomMere}
                                       onChange={e => setPlaignantNomMere(e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Nombre d'enfants</label>
                                <input type="number" min="0" value={plaignantNombreEnfants}
                                       onChange={e => setPlaignantNombreEnfants(e.target.value)} />
                            </div>
                            {/* Kontakt */}
                            <div className="form-field">
                                <label>Téléphone</label>
                                <input value={plaignantNumeroTelephone}
                                       onChange={e => setPlaignantNumeroTelephone(e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Email</label>
                                <input type="email" value={plaignantAdresseEmail}
                                       onChange={e => setPlaignantAdresseEmail(e.target.value)} />
                            </div>
                            {/* Adresse direkt nach Kontakt */}
                            <div className="form-field">
                                <label>Adresse</label>
                                <input value={plaignantAdresse}
                                       onChange={e => setPlaignantAdresse(e.target.value)} />
                            </div>
                            {/* Bildung und Beruf */}
                            <div className="form-field">
                                <label>Niveau d'étude</label>
                                <select value={plaignantNiveauEtude} onChange={e => setPlaignantNiveauEtude(e.target.value)}>
                                    <option value="">--</option>
                                    <option value="Aucun">Aucun</option>
                                    <option value="Primaire">Primaire</option>
                                    <option value="Secondaire">Secondaire</option>
                                    <option value="Universitaire">Universitaire</option>
                                    <option value="Post-universitaire">Post-universitaire</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Profession</label>
                                <input value={plaignantProfession}
                                       onChange={e => setPlaignantProfession(e.target.value)} />
                            </div>
                            <div className="form-field plainte-checkbox-field">
                                <label>
                                    <input type="checkbox" checked={plaignantAssistance}
                                           onChange={e => setPlaignantAssistance(e.target.checked)} />
                                    {" "}Assistance
                                </label>
                            </div>
                        </div>

                        {/* Avocats du Plaignant — Autocomplete */}
                        <div className="plainte-avocat-section">
                            <h5>Avocats du Plaignant</h5>
                            <div className="plainte-avocat-input-row" style={{ position: "relative" }}>
                                <input type="text"
                                       placeholder="Tapez le numéro d'ordre..."
                                       value={numeroOrdrePlaignantInput}
                                       onChange={e => rechercherAvocatPlaignant(e.target.value)}
                                       autoComplete="off" />
                                {/* Autocomplete Vorschläge */}
                                {suggestionsAvocatPlaignant.length > 0 && (
                                    <div className="plainte-avocat-suggestions">
                                        {suggestionsAvocatPlaignant.map(a => (
                                            <div key={a.id}
                                                 className="plainte-avocat-suggestion-item"
                                                 onClick={() => selectionnerAvocatPlaignant(a)}>
                                                {a.nom} {a.postNom} — {a.numeroOrdre}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {erreurAvocatPlaignant && <p className="plainte-avocat-erreur">{erreurAvocatPlaignant}</p>}
                            <div className="plainte-avocat-tags">
                                {avocatsPlaignant.map(a => (
                                    <div key={a.id} className="plainte-avocat-tag">
                                        <span>{a.nom} {a.postNom} — {a.numeroOrdre}</span>
                                        <button type="button" onClick={() =>
                                            setAvocatsPlaignant(prev => prev.filter(x => x.id !== a.id))}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ===== RECHTE SPALTE: SUSPECTS ===== */}
                    <div className="plainte-section-card">
                        <h3 className="plainte-section-titre">Suspects</h3>

                        {suspects.map((s, index) => (
                            <div key={index} className="plainte-suspect-bloc">
                                <div className="plainte-suspect-header">
                                    <strong>Suspect {index + 1}</strong>
                                    <button type="button" className="plainte-suspect-supprimer"
                                            onClick={() => supprimerSuspect(index)}>Supprimer</button>
                                </div>
                                <div className="plainte-grid">
                                    <div className="form-field">
                                        <label>Nom <span className="plainte-requis">*</span></label>
                                        <input value={s.nom}
                                               onChange={e => updateSuspect(index, "nom", e.target.value)} />
                                    </div>
                                    <div className="form-field">
                                        <label>Post Nom</label>
                                        <input value={s.postNom}
                                               onChange={e => updateSuspect(index, "postNom", e.target.value)} />
                                    </div>
                                    <div className="form-field">
                                        <label>Prénom</label>
                                        <input value={s.prenom}
                                               onChange={e => updateSuspect(index, "prenom", e.target.value)} />
                                    </div>
                                    <div className="form-field">
                                        <label>Sexe</label>
                                        <select value={s.sexe} onChange={e => updateSuspect(index, "sexe", e.target.value)}>
                                            <option value="">--</option>
                                            <option value="M">Masculin</option>
                                            <option value="F">Féminin</option>
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label>Date de naissance</label>
                                        <input type="date" value={s.dateNaissance}
                                               onChange={e => updateSuspect(index, "dateNaissance", e.target.value)} />
                                    </div>
                                    <div className="form-field">
                                        <label>Lieu de naissance</label>
                                        <input value={s.lieuNaissance}
                                               onChange={e => updateSuspect(index, "lieuNaissance", e.target.value)} />
                                    </div>
                                    {/* État civil + Nationalité direkt danach */}
                                    <div className="form-field">
                                        <label>État civil</label>
                                        <select value={s.etatCivil} onChange={e => updateSuspect(index, "etatCivil", e.target.value)}>
                                            <option value="">--</option>
                                            <option value="Célibataire">Célibataire</option>
                                            <option value="Marié(e)">Marié(e)</option>
                                            <option value="Divorcé(e)">Divorcé(e)</option>
                                            <option value="Veuf/Veuve">Veuf/Veuve</option>
                                        </select>
                                    </div>
                                    {/* Nationalité direkt nach État civil */}
                                    <div className="form-field">
                                        <label>Nationalité</label>
                                        <input value={s.nationalite}
                                               onChange={e => updateSuspect(index, "nationalite", e.target.value)} />
                                    </div>
                                    <div className="form-field">
                                        <label>Village d'origine</label>
                                        <input value={s.villageOrigine}
                                               onChange={e => updateSuspect(index, "villageOrigine", e.target.value)} />
                                    </div>
                                    <div className="form-field">
                                        <label>Secteur</label>
                                        <input value={s.secteur}
                                               onChange={e => updateSuspect(index, "secteur", e.target.value)} />
                                    </div>
                                    <div className="form-field">
                                        <label>Territoire</label>
                                        <input value={s.territoire}
                                               onChange={e => updateSuspect(index, "territoire", e.target.value)} />
                                    </div>
                                    <div className="form-field">
                                        <label>Nom du père</label>
                                        <input value={s.nomPere}
                                               onChange={e => updateSuspect(index, "nomPere", e.target.value)} />
                                    </div>
                                    <div className="form-field">
                                        <label>Nom de la mère</label>
                                        <input value={s.nomMere}
                                               onChange={e => updateSuspect(index, "nomMere", e.target.value)} />
                                    </div>
                                    <div className="form-field">
                                        <label>Nombre d'enfants</label>
                                        <input type="number" min="0" value={s.nombreEnfants}
                                               onChange={e => updateSuspect(index, "nombreEnfants", e.target.value)} />
                                    </div>
                                    {/* Kontakt */}
                                    <div className="form-field">
                                        <label>Téléphone</label>
                                        <input value={s.numeroTelephone}
                                               onChange={e => updateSuspect(index, "numeroTelephone", e.target.value)} />
                                    </div>
                                    <div className="form-field">
                                        <label>Email</label>
                                        <input type="email" value={s.adresseEmail}
                                               onChange={e => updateSuspect(index, "adresseEmail", e.target.value)} />
                                    </div>
                                    {/* Adresse direkt nach Kontakt */}
                                    <div className="form-field">
                                        <label>Adresse</label>
                                        <input value={s.adresse}
                                               onChange={e => updateSuspect(index, "adresse", e.target.value)} />
                                    </div>
                                    {/* Bildung und Beruf */}
                                    <div className="form-field">
                                        <label>Niveau d'étude</label>
                                        <select value={s.niveauEtude} onChange={e => updateSuspect(index, "niveauEtude", e.target.value)}>
                                            <option value="">--</option>
                                            <option value="Aucun">Aucun</option>
                                            <option value="Primaire">Primaire</option>
                                            <option value="Secondaire">Secondaire</option>
                                            <option value="Universitaire">Universitaire</option>
                                            <option value="Post-universitaire">Post-universitaire</option>
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label>Profession</label>
                                        <input value={s.profession}
                                               onChange={e => updateSuspect(index, "profession", e.target.value)} />
                                    </div>
                                    <div className="form-field plainte-checkbox-field">
                                        <label>
                                            <input type="checkbox" checked={s.assistance}
                                                   onChange={e => updateSuspect(index, "assistance", e.target.checked)} />
                                            {" "}Assistance
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button type="button" className="plainte-ajouter-suspect" onClick={ajouterSuspect}>
                            + Ajouter un suspect
                        </button>

                        {/* Avocats des Suspects — Autocomplete */}
                        <div className="plainte-avocat-section">
                            <h5>Avocats des Suspects</h5>
                            <div className="plainte-avocat-input-row" style={{ position: "relative" }}>
                                <input type="text"
                                       placeholder="Tapez le numéro d'ordre..."
                                       value={numeroOrdreSuspectInput}
                                       onChange={e => rechercherAvocatSuspect(e.target.value)}
                                       autoComplete="off" />
                                {/* Autocomplete Vorschläge */}
                                {suggestionsAvocatSuspect.length > 0 && (
                                    <div className="plainte-avocat-suggestions">
                                        {suggestionsAvocatSuspect.map(a => (
                                            <div key={a.id}
                                                 className="plainte-avocat-suggestion-item"
                                                 onClick={() => selectionnerAvocatSuspect(a)}>
                                                {a.nom} {a.postNom} — {a.numeroOrdre}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {erreurAvocatSuspect && <p className="plainte-avocat-erreur">{erreurAvocatSuspect}</p>}
                            <div className="plainte-avocat-tags">
                                {avocatsSuspect.map(a => (
                                    <div key={a.id} className="plainte-avocat-tag">
                                        <span>{a.nom} {a.postNom} — {a.numeroOrdre}</span>
                                        <button type="button" onClick={() =>
                                            setAvocatsSuspect(prev => prev.filter(x => x.id !== a.id))}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="plainte-section-card">
                    <h3 className="plainte-section-titre">Description de la plainte</h3>
                    <textarea
                        rows={8}
                        value={descriptionPlainte}
                        onChange={e => setDescriptionPlainte(e.target.value)}
                        placeholder="Décrivez les faits de la plainte..."
                        className="plainte-textarea"
                    />
                </div>

                {/* Observation */}
                <div className="plainte-section-card">
                    <h3 className="plainte-section-titre">Observation</h3>
                    <textarea
                        rows={8}
                        value={observation}
                        onChange={e => setObservation(e.target.value)}
                        placeholder="Observations..."
                        className="plainte-textarea"
                    />
                </div>

                {/* Charge / Relaxion */}
                <div className="plainte-section-card">
                    <h3 className="plainte-section-titre">Charge / Relaxion</h3>
                    <textarea
                        rows={8}
                        value={chargeRelaxion}
                        onChange={e => setChargeRelaxion(e.target.value)}
                        placeholder="Charge ou relaxion..."
                        className="plainte-textarea"
                    />
                </div>

                <div className="plainte-actions">
                    <button type="submit" className="plainte-submit" disabled={envoiEnCours}>
                        {envoiEnCours ? "Enregistrement..." : "Enregistrer la plainte"}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}