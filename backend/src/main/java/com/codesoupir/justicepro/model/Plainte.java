package com.codesoupir.justicepro.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.util.List;

/**
 * Die "Plainte" ist die ursprüngliche Beschwerde/Anzeige
 * (das Formular mit Plaignant, Suspects, Avocats und Beschreibung).
 *
 * Jede Plainte ist mit genau EINEM Dossier verknüpft
 * (das Dossier wird beim Speichern automatisch erstellt).
 *
 * ÄNDERUNGEN:
 *  - Mehrere Suspects möglich (OneToMany statt ManyToOne)
 *  - Mehrere Avocats für Plaignant + Suspect möglich (ManyToMany)
 *  - 4 neue Felder: procesVerbalAudition, observation,
 *                   carnetPersonnel, chargeRelaxion
 */
@Entity
@Table(name = "plaintes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plainte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String numero; // z.B. "PL-2026-000123"

    private LocalDate datePlainte;

    // ----- Plaignant (eine Person) -----
    @ManyToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "plaignant_id")
    private Plaignant plaignant;

    /**
     * Mehrere Suspects möglich.
     * Früher: ein einzelner Suspect (ManyToOne).
     * Jetzt: eine Liste von Suspects (OneToMany).
     * cascade = PERSIST: Suspects werden automatisch gespeichert
     * wenn die Plainte gespeichert wird.
     */
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "plainte_id")
    private List<Suspect> suspects;

    /**
     * Mehrere Avocats für den Plaignant möglich.
     * Gesucht per Numéro de l'ordre (nicht Matricule).
     * ManyToMany: ein Avocat kann mehrere Plaignants vertreten.
     */
    @ManyToMany
    @JoinTable(
            name = "plainte_avocats_plaignant",
            joinColumns = @JoinColumn(name = "plainte_id"),
            inverseJoinColumns = @JoinColumn(name = "utilisateur_id")
    )
    private List<Utilisateur> avocatsPlaignant;

    /**
     * Mehrere Avocats für den/die Suspect(s) möglich.
     * Gesucht per Numéro de l'ordre (nicht Matricule).
     */
    @ManyToMany
    @JoinTable(
            name = "plainte_avocats_suspect",
            joinColumns = @JoinColumn(name = "plainte_id"),
            inverseJoinColumns = @JoinColumn(name = "utilisateur_id")
    )
    private List<Utilisateur> avocatsSuspect;

    // ----- Wer hat die Plainte registriert -----
    @ManyToOne
    @JoinColumn(name = "greffier_id")
    private Utilisateur greffier;

    private String institution; // z.B. "Parquet près le Tribunal de Paix de Kalamu"

    /**
     * Großes Textfeld - Hauptbeschreibung der Plainte.
     * Wird im Formular sehr groß dargestellt damit der Greffier
     * nicht scrollen muss.
     */
    @Column(columnDefinition = "TEXT")
    private String descriptionPlainte;

    /**
     * Procès verbal d'audition.
     * Protokoll der Anhörung - wird vom Greffier ausgefüllt.
     * Großes Textfeld wie Description.
     */
    @Column(columnDefinition = "TEXT")
    private String procesVerbalAudition;

    /**
     * Observation.
     * Bemerkungen des Greffiers zum Dossier.
     * Großes Textfeld wie Description.
     */
    @Column(columnDefinition = "TEXT")
    private String observation;

    /**
     * Carnet personnel.
     * Persönliche Notizen des Greffiers (nur für ihn sichtbar).
     * Entspricht der bisherigen "Annotation personnelle".
     * Großes Textfeld wie Description.
     */
    @Column(columnDefinition = "TEXT")
    private String carnetPersonnel;

    /**
     * Charge de relaxion.
     * Entlastungsgründe / Freilassungsgründe.
     * Großes Textfeld wie Description.
     */
    @Column(columnDefinition = "TEXT")
    private String chargeRelaxion;

    // ----- Verknüpfung zum zugehörigen Dossier -----
    @OneToOne
    @JoinColumn(name = "dossier_id")
    private Dossier dossier;

    @PrePersist
    public void prePersist() {
        if (datePlainte == null) {
            datePlainte = LocalDate.now();
        }
    }
}