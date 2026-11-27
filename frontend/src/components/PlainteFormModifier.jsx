import { useState, useEffect } from "react";
import api from "../services/api";
import "./PlainteFormModifier.css";

/**
 * Formular zum Bearbeiten einer Plainte.
 *
 * LAYOUT:
 *  - Plaignant (links) + Suspects (rechts) nebeneinander
 *  - Description, Procès Verbal, Observation, Charge/Relaxion volle Breite
 *
 * PROPS:
 *  - dossierId: ID des Dossiers
 *  - onSauvegarde: Callback nach Speichern oder Abbrechen
 *  - cacherProcessVerbal: wenn true → Procès Verbal versteckt
 *  - endpointLibre: wenn true → benutzt /plainte/libre (kein Stade-Check)
 *    Greffier: false (nur bei ENREGISTRE erlaubt)
 *    Procureur/PG: true (jederzeit bearbeitbar)
 */
export default function PlainteFormModifier({ dossierId, onSauvegarde, cacherProcessVerbal = false, endpointLibre = false }) {

    // ----- Plaignant -----
    const [plaignantNom, setPlaignantNom] = useState("");
    const [plaignantPostNom, setPlaignantPostNom] = useState("");
    const [plaignantPrenom, setPlaignantPrenom] = useState("");
    const [plaignantSexe, setPlaignantSexe] = useState("");
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
    // Neue Felder
    const [plaignantNiveauEtude, setPlaignantNiveauEtude] = useState("");
    const [plaignantProfession, setPlaignantProfession] = useState("");

    // ----- Avocats du Plaignant -----

    const [avocatsPlaignant, setAvocatsPlaignant] = useState([]);
    const [numeroOrdrePlaignantInput, setNumeroOrdrePlaignantInput] = useState("");
    const [erreurAvocatPlaignant, setErreurAvocatPlaignant] = useState("");
    const [suggestionsAvocatPlaignant, setSuggestionsAvocatPlaignant] = useState([]);
    // ----- Suspects -----
    const [suspects, setSuspects] = useState([]);


    // ----- Avocats des Suspects -----
    const [avocatsSuspect, setAvocatsSuspect] = useState([]);
    const [numeroOrdreSuspectInput, setNumeroOrdreSuspectInput] = useState("");
    const [erreurAvocatSuspect, setErreurAvocatSuspect] = useState("");
    const [suggestionsAvocatSuspect, setSuggestionsAvocatSuspect] = useState([]);

    // ----- Textfelder -----
    const [descriptionPlainte, setDescriptionPlainte] = useState("");
    const [procesVerbalAudition, setProcessVerbalAudition] = useState("");
    const [observation, setObservation] = useState("");
    const [carnetPersonnel, setCarnetPersonnel] = useState("");
    const [chargeRelaxion, setChargeRelaxion] = useState("");

    // ----- Status -----
    const [chargement, setChargement] = useState(true);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => { chargerPlainte(); }, [dossierId]);

    async function chargerPlainte() {
        setChargement(true);
        try {
            const res = await api.get(`/dossiers/${dossierId}/plainte`);
            const p = res.data;
            setPlaignantNom(p.plaignant?.nom || "");
            setPlaignantPostNom(p.plaignant?.postNom || "");
            setPlaignantPrenom(p.plaignant?.prenom || "");
            setPlaignantSexe(p.plaignant?.sexe || "");
            setPlaignantLieuNaissance(p.plaignant?.lieuNaissance || "");
            setPlaignantVillageOrigine(p.plaignant?.villageOrigine || "");
            setPlaignantSecteur(p.plaignant?.secteur || "");
            setPlaignantTerritoire(p.plaignant?.territoire || "");
            setPlaignantAssistance(p.plaignant?.assistance || false);
            setPlaignantEtatCivil(p.plaignant?.etatCivil || "");
            setPlaignantNomPere(p.plaignant?.nomPere || "");
            setPlaignantNomMere(p.plaignant?.nomMere || "");
            setPlaignantNombreEnfants(p.plaignant?.nombreEnfants ?? "");
            setPlaignantNumeroTelephone(p.plaignant?.numeroTelephone || "");
            setPlaignantAdresseEmail(p.plaignant?.adresseEmail || "");
            setPlaignantAdresse(p.plaignant?.adresse || "");
            setPlaignantNationalite(p.plaignant?.nationalite || "");
            // Neue Felder
            setPlaignantNiveauEtude(p.plaignant?.niveauEtude || "");
            setPlaignantProfession(p.plaignant?.profession || "");
            setAvocatsPlaignant(p.avocatsPlaignant || []);
            setAvocatsSuspect(p.avocatsSuspect || []);
            setSuspects((p.suspects || []).map(s => ({
                nom: s.nom || "", postNom: s.postNom || "", prenom: s.prenom || "",
                sexe: s.sexe || "", lieuNaissance: s.lieuNaissance || "",
                villageOrigine: s.villageOrigine || "", secteur: s.secteur || "",
                territoire: s.territoire || "", assistance: s.assistance || false,
                etatCivil: s.etatCivil || "", nomPere: s.nomPere || "",
                nomMere: s.nomMere || "", nombreEnfants: s.nombreEnfants ?? "",
                numeroTelephone: s.numeroTelephone || "", adresseEmail: s.adresseEmail || "",
                adresse: s.adresse || "", nationalite: s.nationalite || "",
                // Neue Felder
                niveauEtude: s.niveauEtude || "", profession: s.profession || "",
            })));
            setDescriptionPlainte(p.descriptionPlainte || "");
            setProcessVerbalAudition(p.procesVerbalAudition || "");
            setObservation(p.observation || "");
            setCarnetPersonnel(p.carnetPersonnel || "");
            setChargeRelaxion(p.chargeRelaxion || "");
        } catch {
            setMessage({ type: "erreur", texte: "Erreur lors du chargement de la plainte." });
        } finally {
            setChargement(false);
        }
    }

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

    function ajouterSuspect() {
        setSuspects(prev => [...prev, {
            nom: "", postNom: "", prenom: "", sexe: "",
            lieuNaissance: "", villageOrigine: "", secteur: "",
            territoire: "", assistance: false, etatCivil: "",
            nomPere: "", nomMere: "", nombreEnfants: "",
            numeroTelephone: "", adresseEmail: "",
            adresse: "", nationalite: "",
            niveauEtude: "", profession: "",
        }]);
    }

    function updateSuspect(index, champ, valeur) {
        setSuspects(prev => prev.map((s, i) => i === index ? { ...s, [champ]: valeur } : s));
    }

    function supprimerSuspect(index) {
        setSuspects(prev => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!plaignantNom.trim()) {
            setMessage({ type: "erreur", texte: "Le nom du plaignant est obligatoire." });
            return;
        }
        setEnvoiEnCours(true);
        setMessage(null);
        try {
            // endpointLibre=true → /plainte/libre (P und PG, ohne Stade-Check)
            // endpointLibre=false → /plainte (Greffier, nur bei ENREGISTRE)
            const endpoint = endpointLibre
                ? `/dossiers/${dossierId}/plainte/libre`
                : `/dossiers/${dossierId}/plainte`;
            await api.put(endpoint, {
                plaignantNom, plaignantPostNom, plaignantPrenom,
                plaignantSexe, plaignantLieuNaissance, plaignantVillageOrigine,
                plaignantSecteur, plaignantTerritoire, plaignantAssistance,
                plaignantEtatCivil, plaignantNomPere, plaignantNomMere,
                plaignantNombreEnfants: plaignantNombreEnfants === "" ? null : Number(plaignantNombreEnfants),
                plaignantNumeroTelephone, plaignantAdresseEmail,
                plaignantAdresse, plaignantNationalite,
                // Neue Felder
                plaignantNiveauEtude, plaignantProfession,
                numerosOrdrePlaignant: avocatsPlaignant.map(a => a.numeroOrdre).filter(Boolean),
                suspects: suspects.map(s => ({
                    ...s,
                    nombreEnfants: s.nombreEnfants === "" ? null : Number(s.nombreEnfants),
                })),
                numerosOrdreSuspect: avocatsSuspect.map(a => a.numeroOrdre).filter(Boolean),
                descriptionPlainte,
                procesVerbalAudition,
                observation,
                carnetPersonnel,
                chargeRelaxion,
            });
            setMessage({ type: "succes", texte: "Plainte sauvegardée avec succès." });
            setTimeout(() => onSauvegarde(), 1500);
        } catch (err) {
            setMessage({ type: "erreur", texte: err.response?.data?.erreur || "Erreur lors de la sauvegarde." });
        } finally {
            setEnvoiEnCours(false);
        }
    }

    if (chargement) return <p>Chargement de la plainte...</p>;

    return (
        <form onSubmit={handleSubmit} className="plainte-modifier-form">

            {message && (
                <p className={`plainte-modifier-message plainte-modifier-message-${message.type}`}>
                    {message.texte}
                </p>
            )}

            {/* ============================================================
                PLAIGNANT (links) + SUSPECTS (rechts) nebeneinander
            ============================================================ */}
            <div className="plainte-zwei-spalten">

                {/* ===== LINKE SPALTE: PLAIGNANT ===== */}
                <div>
                    <h4 className="plainte-modifier-section-titre">Plaignant</h4>
                    <div className="plainte-modifier-grid">
                        {/* Nom — einziges Pflichtfeld */}
                        <div className="plainte-modifier-field">
                            <label>Nom <span style={{ color: "var(--color-danger)" }}>*</span></label>
                            <input
                                value={plaignantNom}
                                onChange={e => setPlaignantNom(e.target.value)}
                                required
                                style={{ borderColor: !plaignantNom.trim() ? "var(--color-danger)" : "" }}
                            />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Post Nom</label>
                            <input value={plaignantPostNom} onChange={e => setPlaignantPostNom(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Prénom</label>
                            <input value={plaignantPrenom} onChange={e => setPlaignantPrenom(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Sexe</label>
                            <select value={plaignantSexe} onChange={e => setPlaignantSexe(e.target.value)}>
                                <option value="">--</option>
                                <option value="M">Masculin</option>
                                <option value="F">Féminin</option>
                            </select>
                        </div>
                        <div className="plainte-modifier-field">
                            <label>État civil</label>
                            <select value={plaignantEtatCivil} onChange={e => setPlaignantEtatCivil(e.target.value)}>
                                <option value="">--</option>
                                <option value="Célibataire">Célibataire</option>
                                <option value="Marié(e)">Marié(e)</option>
                                <option value="Divorcé(e)">Divorcé(e)</option>
                                <option value="Veuf/Veuve">Veuf/Veuve</option>
                            </select>
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Nationalité</label>
                            <input value={plaignantNationalite} onChange={e => setPlaignantNationalite(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Lieu de naissance</label>
                            <input value={plaignantLieuNaissance} onChange={e => setPlaignantLieuNaissance(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Village d'origine</label>
                            <input value={plaignantVillageOrigine} onChange={e => setPlaignantVillageOrigine(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Secteur</label>
                            <input value={plaignantSecteur} onChange={e => setPlaignantSecteur(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Territoire</label>
                            <input value={plaignantTerritoire} onChange={e => setPlaignantTerritoire(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Nom du père</label>
                            <input value={plaignantNomPere} onChange={e => setPlaignantNomPere(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Nom de la mère</label>
                            <input value={plaignantNomMere} onChange={e => setPlaignantNomMere(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Nombre d'enfants</label>
                            <input type="number" min="0" value={plaignantNombreEnfants}
                                   onChange={e => setPlaignantNombreEnfants(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Téléphone</label>
                            <input value={plaignantNumeroTelephone} onChange={e => setPlaignantNumeroTelephone(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Email</label>
                            <input type="email" value={plaignantAdresseEmail} onChange={e => setPlaignantAdresseEmail(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>Adresse</label>
                            <input value={plaignantAdresse} onChange={e => setPlaignantAdresse(e.target.value)} />
                        </div>
                        {/* Neue Felder */}
                        <div className="plainte-modifier-field">
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
                        <div className="plainte-modifier-field">
                            <label>Profession</label>
                            <input value={plaignantProfession} onChange={e => setPlaignantProfession(e.target.value)} />
                        </div>
                        <div className="plainte-modifier-field">
                            <label>
                                <input type="checkbox" checked={plaignantAssistance}
                                       onChange={e => setPlaignantAssistance(e.target.checked)} />
                                {" "}Assistance
                            </label>
                        </div>
                    </div>

                    {/* Avocats du Plaignant */}
                    <div className="plainte-avocat-section">
                        <h5>Avocats du Plaignant</h5>
                        <div className="plainte-avocat-input-row" style={{ position: "relative" }}>
                            <input type="text" placeholder="Tapez le numéro d'ordre..."
                                   value={numeroOrdrePlaignantInput}
                                   onChange={e => rechercherAvocatPlaignant(e.target.value)}
                                   autoComplete="off" />
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
                <div>
                    <h4 className="plainte-modifier-section-titre">Suspects</h4>
                    {suspects.map((s, index) => (
                        <div key={index} className="plainte-suspect-bloc">
                            <div className="plainte-suspect-header">
                                <strong>Suspect {index + 1}</strong>
                                <button type="button" className="plainte-suspect-supprimer"
                                        onClick={() => supprimerSuspect(index)}>Supprimer</button>
                            </div>
                            <div className="plainte-modifier-grid">
                                {/* Nom — einziges Pflichtfeld */}
                                <div className="plainte-modifier-field">
                                    <label>Nom <span style={{ color: "var(--color-danger)" }}>*</span></label>
                                    <input value={s.nom} onChange={e => updateSuspect(index, "nom", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Post Nom</label>
                                    <input value={s.postNom} onChange={e => updateSuspect(index, "postNom", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Prénom</label>
                                    <input value={s.prenom} onChange={e => updateSuspect(index, "prenom", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Sexe</label>
                                    <select value={s.sexe} onChange={e => updateSuspect(index, "sexe", e.target.value)}>
                                        <option value="">--</option>
                                        <option value="M">Masculin</option>
                                        <option value="F">Féminin</option>
                                    </select>
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>État civil</label>
                                    <select value={s.etatCivil} onChange={e => updateSuspect(index, "etatCivil", e.target.value)}>
                                        <option value="">--</option>
                                        <option value="Célibataire">Célibataire</option>
                                        <option value="Marié(e)">Marié(e)</option>
                                        <option value="Divorcé(e)">Divorcé(e)</option>
                                        <option value="Veuf/Veuve">Veuf/Veuve</option>
                                    </select>
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Nationalité</label>
                                    <input value={s.nationalite} onChange={e => updateSuspect(index, "nationalite", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Lieu de naissance</label>
                                    <input value={s.lieuNaissance} onChange={e => updateSuspect(index, "lieuNaissance", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Village d'origine</label>
                                    <input value={s.villageOrigine} onChange={e => updateSuspect(index, "villageOrigine", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Secteur</label>
                                    <input value={s.secteur} onChange={e => updateSuspect(index, "secteur", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Territoire</label>
                                    <input value={s.territoire} onChange={e => updateSuspect(index, "territoire", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Nom du père</label>
                                    <input value={s.nomPere} onChange={e => updateSuspect(index, "nomPere", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Nom de la mère</label>
                                    <input value={s.nomMere} onChange={e => updateSuspect(index, "nomMere", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Nombre d'enfants</label>
                                    <input type="number" min="0" value={s.nombreEnfants}
                                           onChange={e => updateSuspect(index, "nombreEnfants", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Téléphone</label>
                                    <input value={s.numeroTelephone} onChange={e => updateSuspect(index, "numeroTelephone", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Email</label>
                                    <input type="email" value={s.adresseEmail}
                                           onChange={e => updateSuspect(index, "adresseEmail", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
                                    <label>Adresse</label>
                                    <input value={s.adresse} onChange={e => updateSuspect(index, "adresse", e.target.value)} />
                                </div>
                                {/* Neue Felder */}
                                <div className="plainte-modifier-field">
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
                                <div className="plainte-modifier-field">
                                    <label>Profession</label>
                                    <input value={s.profession} onChange={e => updateSuspect(index, "profession", e.target.value)} />
                                </div>
                                <div className="plainte-modifier-field">
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

                    {/* Avocats des Suspects */}
                    <div className="plainte-avocat-section">
                        <h5>Avocats des Suspects</h5>
                        <div className="plainte-avocat-input-row" style={{ position: "relative" }}>
                            <input type="text" placeholder="Tapez le numéro d'ordre..."
                                   value={numeroOrdreSuspectInput}
                                   onChange={e => rechercherAvocatSuspect(e.target.value)}
                                   autoComplete="off" />
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
            <div className="plainte-description-card">
                <label>Description de la plainte</label>
                <textarea rows={8} value={descriptionPlainte}
                          onChange={(e) => setDescriptionPlainte(e.target.value)}
                          placeholder="Décrivez les faits de la plainte..."
                          className="plainte-textarea-grand" />
            </div>


            {/* Observation */}
            <div className="plainte-description-card">
                <label>Observation</label>
                <textarea rows={8} value={observation}
                          onChange={(e) => setObservation(e.target.value)}
                          placeholder="Observations..."
                          className="plainte-textarea-grand" />
            </div>

            {/* Charge / Relaxion */}
            <div className="plainte-description-card">
                <label>Charge / Relaxion</label>
                <textarea rows={8} value={chargeRelaxion}
                          onChange={(e) => setChargeRelaxion(e.target.value)}
                          placeholder="Charge ou relaxion..."
                          className="plainte-textarea-grand" />
            </div>

            <div className="plainte-modifier-actions">
                <button type="submit" disabled={envoiEnCours}>
                    {envoiEnCours ? "Sauvegarde..." : "Sauvegarder les modifications"}
                </button>
                <button type="button" onClick={onSauvegarde}>Annuler</button>
            </div>
        </form>
    );
}