package com.codesoupir.justicepro.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

/**
 * Gemeinsame Basis-Klasse für Plaignant und Suspect.
 * MappedSuperclass bedeutet: Diese Felder werden NICHT in einer
 * eigenen Tabelle gespeichert, sondern in JEDE Tabelle der
 * Unterklassen (plaignants, suspects) übernommen.
 *
 * ÄNDERUNGEN:
 *  - districtOrigine → secteur (umbenannt)
 *  - Neue Felder: etatCivil, nomPere, nomMere, nombreEnfants,
 *                 numeroTelephone, adresseEmail
 *  - Neue Felder: adresse, nationalite
 *  - Neue Felder: niveauEtude, profession
 */
@MappedSuperclass
@Getter
@Setter
public abstract class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nom ist Pflichtfeld — alle anderen optional
    private String nom;
    private String postNom;
    private String prenom;

    @Column(length = 1)
    private String sexe;          // "M" oder "F"

    private LocalDate dateNaissance;
    private String lieuNaissance;

    // ----- Herkunft -----
    private String secteur;
    private String villageOrigine;
    private String territoire;

    // ----- Persönliche Daten -----
    private String etatCivil;        // Ledig, Verheiratet, Geschieden, Verwitwet
    private String nomPere;
    private String nomMere;
    private Integer nombreEnfants;
    private String numeroTelephone;
    private String adresseEmail;

    // ----- Adresse und Nationalität -----
    private String adresse;          // Physische Adresse der Person
    private String nationalite;      // Nationalität der Person

    // ----- Bildung und Beruf -----
    private String niveauEtude;      // Bildungsstand (z.B. Grundschule, Gymnasium, Universität)
    private String profession;       // Beruf der Person

    private boolean assistance;
}