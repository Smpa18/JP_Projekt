package com.codesoupir.justicepro.dto;

import com.codesoupir.justicepro.enums.Role;
import com.codesoupir.justicepro.enums.TypeDroit;
import lombok.Data;
import java.time.LocalDate;

/**
 * Formular "Administration -> Modifier / Enregistrer".
 *
 * Alle Felder sind OPTIONAL (können null sein) - im Service
 * wird nur das geändert, was hier tatsächlich mitgeschickt wird.
 *
 * 3 VERSCHIEDENE Felder (nicht verwechseln!):
 *  - titre:     Berufstitel (z.B. "Magistrat") = "Role" im Mockup
 *  - grade:     beruflicher Rang (z.B. "AG", "SP")
 *  - typeDroit: PENAL (Parquet) ou CIVIL (Tribunal)
 *
 * AVOCAT-spezifische Felder:
 *  - barreau:     Anwaltsvereinigung
 *  - numeroOrdre: Mitgliedsnummer beim Barreau
 */
@Data
public class UtilisateurUpdateRequest {

    private String nom;
    private String postNom;
    private String prenom;
    private String sexe;
    private LocalDate dateNaissance;
    private String lieuNaissance;

    // Optional - nur ausfüllen wenn Passwort geändert werden soll
    private String motDePasse;

    // JusticePro-Funktion (GREFFIER, PROCUREUR, AVOCAT, etc.)
    private Role role;

    // Type = PENAL (Parquet) ou CIVIL (Tribunal)
    // Bei Avocats: null
    private TypeDroit typeDroit;

    // ----- Berufliche Daten -----
    private String grade;
    private String titre;
    private String diplome;
    private String universite;

    // ----- Herkunft -----
    private String secteur;
    private String villageOrigine;
    private String districtOrigine;

    // ----- Versetzung -----
    private Long instanceId;

    /**
     * Barreau = Anwaltsvereinigung (z.B. "Barreau de Kinshasa/Gombe").
     * NUR für Avocats relevant.
     */
    private String barreau;

    /**
     * Numéro de l'ordre = Mitgliedsnummer beim Barreau.
     * NUR für Avocats relevant.
     * Wird im Plainte-Formular für die Avocat-Suche benutzt.
     */
    private String numeroOrdre;
}