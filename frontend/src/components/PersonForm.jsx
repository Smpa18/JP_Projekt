import "./PersonForm.css";

const ETAT_CIVIL_OPTIONS = ["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf/Veuve"];

export default function PersonForm({ titre, data, onChange }) {

    function handleFieldChange(field, value) {
        onChange({ ...data, [field]: value });
    }

    return (
        <div className="person-form-card">
            <h3 className="person-form-title">{titre}</h3>

            <div className="person-form-grid">
                <div className="form-field">
                    <label>Nom</label>
                    <input type="text" value={data.nom || ""} onChange={(e) => handleFieldChange("nom", e.target.value)} required />
                </div>
                <div className="form-field">
                    <label>Post Nom</label>
                    <input type="text" value={data.postNom || ""} onChange={(e) => handleFieldChange("postNom", e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Prénom</label>
                    <input type="text" value={data.prenom || ""} onChange={(e) => handleFieldChange("prenom", e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Sexe</label>
                    <select value={data.sexe || ""} onChange={(e) => handleFieldChange("sexe", e.target.value)}>
                        <option value="">-- Choisir --</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                    </select>
                </div>
                <div className="form-field">
                    <label>État civil</label>
                    <select value={data.etatCivil || ""} onChange={(e) => handleFieldChange("etatCivil", e.target.value)}>
                        <option value="">-- Choisir --</option>
                        {ETAT_CIVIL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
                <div className="form-field">
                    <label>Date de naissance</label>
                    <input type="date" value={data.dateNaissance || ""} onChange={(e) => handleFieldChange("dateNaissance", e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Lieu de naissance</label>
                    <input type="text" value={data.lieuNaissance || ""} onChange={(e) => handleFieldChange("lieuNaissance", e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Village d'origine</label>
                    <input type="text" value={data.villageOrigine || ""} onChange={(e) => handleFieldChange("villageOrigine", e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Secteur</label>
                    <input type="text" value={data.secteur || ""} onChange={(e) => handleFieldChange("secteur", e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Territoire</label>
                    <input type="text" value={data.territoire || ""} onChange={(e) => handleFieldChange("territoire", e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Nom du père</label>
                    <input type="text" value={data.nomPere || ""} onChange={(e) => handleFieldChange("nomPere", e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Nom de la mère</label>
                    <input type="text" value={data.nomMere || ""} onChange={(e) => handleFieldChange("nomMere", e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Nombre d'enfants</label>
                    <input type="number" min="0" value={data.nombreEnfants || ""} onChange={(e) => handleFieldChange("nombreEnfants", e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Numéro de téléphone</label>
                    <input type="text" value={data.numeroTelephone || ""} onChange={(e) => handleFieldChange("numeroTelephone", e.target.value)} />
                </div>
                <div className="form-field">
                    <label>Adresse email</label>
                    <input type="email" value={data.adresseEmail || ""} onChange={(e) => handleFieldChange("adresseEmail", e.target.value)} />
                </div>
                <div className="form-field form-field-checkbox">
                    <label>
                        <input type="checkbox" checked={data.assistance || false} onChange={(e) => handleFieldChange("assistance", e.target.checked)} />
                        Assistance (avocat présent)
                    </label>
                </div>
            </div>
        </div>
    );
}