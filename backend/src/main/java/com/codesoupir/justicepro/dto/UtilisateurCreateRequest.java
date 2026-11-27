package com.codesoupir.justicepro.dto;

import com.codesoupir.justicepro.enums.Role;
import com.codesoupir.justicepro.enums.TypeDroit;
import lombok.Data;
import java.time.LocalDate;

/**
 * Formular "Administration -> Ajouter un personnel".
 * Enthält ALLE Felder aus dem Mockup (Seiten 14-17):
 *
 *  - titre:         Berufstitel (z.B. "Magistrat") = "Role" im Mockup
 *  - grade:         beruflicher Rang (z.B. "AG", "SP")
 *  - typeDroit:     PENAL (Parquet) ou CIVIL (Tribunal)
 *  - role:          JusticePro-Rolle (GREFFIER, PROCUREUR, etc.)
 *  - instanceId:    Zugehöriges Gericht/Parquet (Affectation)
 *
 * AVOCAT-spezifische Felder:
 *  - barreau:       Anwaltsvereinigung (z.B. "Barreau de Kinshasa/Gombe")
 *  - numeroOrdre:   Mitgliedsnummer beim Barreau (z.B. "KIN-2024-001")
 *  - territoire:    Territoire d'origine
 */
@Data
public class UtilisateurCreateRequest {
    private String numeroMatricule;
    private String nom;
    private String postNom;
    private String prenom;
    private String sexe;
    private LocalDate dateNaissance;
    private String lieuNaissance;
    private String motDePasse;

    /**
     * Type = PENAL (Parquet) ou CIVIL (Tribunal).
     * In welchem Bereich der Mitarbeiter arbeitet.
     * Bei Avocats leer (sie gehören zu keinem Bereich).
     */
    private TypeDroit typeDroit;

    /**
     * Grade = beruflicher Rang (z.B. "AG", "SP").
     */
    private String grade;

    /**
     * Titre = Berufstitel (z.B. "Magistrat").
     * Entspricht dem "Role"-Feld im Mockup.
     * Bei Avocats automatisch "Avocat" gesetzt.
     */
    private String titre;

    private String diplome;
    private String universite;
    private String secteur;
    private String villageOrigine;
    private String districtOrigine;
    private String territoire;
    private Long instanceId;

    /**
     * JusticePro-Rolle (GREFFIER, PROCUREUR, AVOCAT, ADMIN, etc.).
     * Bestimmt was der Benutzer in der App sehen und tun darf.
     */
    private Role role;

    /**
     * Barreau = Anwaltsvereinigung (z.B. "Barreau de Kinshasa/Gombe").
     * NUR für Avocats relevant.
     * Kommt aus dem Barreau-Dropdown (barreaux-Tabelle in der DB).
     */
    private String barreau;

    /**
     * Numéro de l'ordre = Mitgliedsnummer beim Barreau.
     * NUR für Avocats relevant.
     * Wird im Plainte-Formular für die Avocat-Suche benutzt.
     * z.B. "KIN-2024-001"
     */
    private String numeroOrdre;
}