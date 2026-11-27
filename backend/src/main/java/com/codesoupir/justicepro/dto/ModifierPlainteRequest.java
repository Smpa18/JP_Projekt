package com.codesoupir.justicepro.dto;

import lombok.Data;
import java.util.List;

/**
 * Request-DTO zum Bearbeiten einer Plainte.
 * Enthält alle Felder von Plaignant und Suspects.
 *
 * ÄNDERUNGEN:
 *  - adresse und nationalite für Plaignant hinzugefügt
 *  - adresse und nationalite für SuspectDTO hinzugefügt
 *  - niveauEtude und profession für Plaignant hinzugefügt
 *  - niveauEtude und profession für SuspectDTO hinzugefügt
 *  - Nur nom ist Pflichtfeld im Frontend — alle anderen optional
 */
@Data
public class ModifierPlainteRequest {

    // ----- Plaignant -----
    private String plaignantNom;              // Pflichtfeld
    private String plaignantPostNom;
    private String plaignantPrenom;
    private String plaignantSexe;
    private String plaignantLieuNaissance;
    private String plaignantVillageOrigine;
    private String plaignantSecteur;
    private String plaignantTerritoire;
    private boolean plaignantAssistance;
    private String plaignantEtatCivil;
    private String plaignantNomPere;
    private String plaignantNomMere;
    private Integer plaignantNombreEnfants;
    private String plaignantNumeroTelephone;
    private String plaignantAdresseEmail;
    // Adresse und Nationalität
    private String plaignantAdresse;
    private String plaignantNationalite;
    // Bildung und Beruf
    private String plaignantNiveauEtude;
    private String plaignantProfession;

    private List<String> numerosOrdrePlaignant;
    private List<SuspectDTO> suspects;
    private List<String> numerosOrdreSuspect;

    private String descriptionPlainte;
    private String procesVerbalAudition;
    private String observation;
    private String carnetPersonnel;
    private String chargeRelaxion;

    /**
     * DTO für einen Suspect in der Plainte.
     * Wird in der Liste suspects benutzt.
     */
    @Data
    public static class SuspectDTO {
        private String nom;                   // Pflichtfeld
        private String postNom;
        private String prenom;
        private String sexe;
        private String lieuNaissance;
        private String villageOrigine;
        private String secteur;
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
}