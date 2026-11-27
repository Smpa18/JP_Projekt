package com.codesoupir.justicepro.dto;

import lombok.Data;
import java.time.LocalDate;

/**
 * DTO für Plaignant und Suspect beim Erstellen einer neuen Plainte.
 * Wird in PlainteCreateRequest benutzt.
 *
 * ÄNDERUNGEN:
 *  - adresse und nationalite hinzugefügt
 *  - niveauEtude und profession hinzugefügt
 */
@Data
public class PersonneDTO {
    // Pflichtfeld — alle anderen optional
    private String nom;
    private String postNom;
    private String prenom;
    private String sexe;
    private LocalDate dateNaissance;
    private String lieuNaissance;
    private String secteur;
    private String villageOrigine;
    private String territoire;
    private boolean assistance;
    private String etatCivil;
    private String nomPere;
    private String nomMere;
    private Integer nombreEnfants;
    private String numeroTelephone;
    private String adresseEmail;
    // Adresse und Nationalität
    private String adresse;
    private String nationalite;
    // Bildung und Beruf
    private String niveauEtude;
    private String profession;
}