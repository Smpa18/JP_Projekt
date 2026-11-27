package com.codesoupir.justicepro.model;

import com.codesoupir.justicepro.enums.Role;
import com.codesoupir.justicepro.enums.TypeDroit;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

/**
 * Ein Mitarbeiter des Justizsystems (Greffier, Procureur, Juge...).
 * Wird auch für den Login benutzt:
 *   - "Numéro de matricule" -> numeroMatricule
 *   - "Mot de passe"        -> motDePasse
 *
 * SONDERFALL AVOCAT:
 *   - Avocats loggen sich NIE in JusticePro ein.
 *   - Sie haben kein Matricule (null erlaubt).
 *   - Sie werden nur im Plainte-Formular per Numéro de l'ordre gesucht.
 *   - Felder barreau + numeroOrdre sind nur für Avocats relevant.
 */
@Entity
@Table(name = "utilisateurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Login-Name des Mitarbeiters.
     * Bei Avocats: null (sie loggen sich nie ein).
     * Bei allen anderen: eindeutig und nicht null.
     */
    @Column(unique = true, length = 20)
    private String numeroMatricule;

    private String nom;
    private String postNom;
    private String prenom;

    @Column(length = 1)
    private String sexe; // "M" oder "F"

    private LocalDate dateNaissance;
    private String lieuNaissance;

    /**
     * BCrypt-verschlüsseltes Passwort.
     * Bei Avocats: zufällig generiert (sie kennen es nicht).
     * Wird NIEMALS an das Frontend gesendet (JsonIgnore).
     */
    @Column(nullable = false)
    @JsonIgnore
    private String motDePasse;

    /**
     * JusticePro-Funktion des Mitarbeiters.
     * GREFFIER, PROCUREUR, JUGE_INSTRUCTION, AVOCAT, ADMIN...
     * Bestimmt was der Mitarbeiter in JusticePro sehen und tun darf.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /**
     * In welchem Bereich arbeitet die Person.
     * PENAL = Parquet, CIVIL = Tribunal.
     * Kann leer sein (z.B. bei Avocats).
     */
    @Enumerated(EnumType.STRING)
    private TypeDroit typeDroit;

    // ----- Akademische / berufliche Daten -----
    private String grade;   // z.B. "AG", "SP"
    private String titre;   // Berufstitel z.B. "Magistrat", "Avocat"
    private String diplome;
    private String universite;

    // ----- Herkunft -----
    private String secteur;
    private String villageOrigine;
    private String districtOrigine;

    // ----- Zuordnung zu einem Gericht -----
    @ManyToOne
    @JoinColumn(name = "instance_id")
    private Instance instance; // "Affectation" im Mockup

    /**
     * Account aktiv oder deaktiviert.
     * actif=true  → Mitarbeiter kann sich einloggen.
     * actif=false → Mitarbeiter ist gesperrt (Daten bleiben erhalten).
     * Nur ADMIN kann das ändern.
     */
    @Column(nullable = false)
    private boolean actif = true;

    // ----- AVOCAT-SPEZIFISCHE FELDER -----
    // Diese Felder sind NUR für Avocats relevant.
    // Bei allen anderen Mitarbeitern sind sie null.

    /**
     * Anwaltsvereinigung der der Avocat angehört.
     * z.B. "Barreau de Kinshasa", "Barreau du Nord-Kivu"
     * Nur für Avocats relevant.
     */
    private String barreau;

    /**
     * Mitgliedsnummer des Avocats beim Barreau.
     * z.B. "KIN-2024-001"
     * Wird im Plainte-Formular benutzt um den Avocat zu suchen.
     * Nur für Avocats relevant.
     */
    private String numeroOrdre;
}