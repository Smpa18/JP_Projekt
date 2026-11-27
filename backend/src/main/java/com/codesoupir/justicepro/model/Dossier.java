package com.codesoupir.justicepro.model;

import com.codesoupir.justicepro.enums.Stade;
import com.codesoupir.justicepro.enums.StatutDossier;
import com.codesoupir.justicepro.enums.TypeDroit;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

/**
 * Das "Dossier" ist der eigentliche Verfahrensakt.
 * Durchläuft den Workflow über das Feld "stade".
 *
 * FELDER:
 *  - qualification:     Qualifikation des Falls (Text, z.B. RMI/RMP/RMA)
 *  - relaxion:          Checkbox "Relaxion"
 *  - detention:         Checkbox "Détention"
 *  - liberteProvisoire: Checkbox "Liberté provisoire"
 *  - sansSuite:         Checkbox "Sans suite"
 *  - fixation:          Checkbox "Fixation"
 *  - classifie:         ob die Classification (droit) vom PG bestätigt wurde
 *  - mapAutorise:       ob der PG dem Procureur erlaubt hat den MAP auszustellen
 */
@Entity
@Table(name = "dossiers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String numeroDossier;

    private LocalDate dateCreation;
    private LocalDate dateFermeture;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Stade stade;

    @Enumerated(EnumType.STRING)
    private TypeDroit droit; // PENAL ou CIVIL - wird als "Classification" angezeigt

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutDossier statut;

    /**
     * Markiert ob die Classification (droit=PENAL/CIVIL) vom PG
     * BEWUSST bestätigt wurde. Solange false, wird "Classification"
     * im Frontend als "-" angezeigt, AUCH WENN droit bereits intern
     * gesetzt ist (z.B. automatisch durch envoyerAuPG()).
     * Wird auf true gesetzt sobald der PG die Classification
     * im Frontend explizit auswählt (DossierService.mettreAJourInfos).
     */
    @Builder.Default
    private Boolean classifie = false;

    /**
     * Markiert ob der PG dem Procureur die Erlaubnis gegeben hat
     * den MAP auszustellen.
     *
     * ABLAUF:
     *  - false (Standard): P darf den MAP-Button NICHT sehen
     *  - P drückt "Demander l'autorisation MAP" → Stade = DEMANDE_MAP
     *  - PG drückt "Confirmer MAP" → mapAutorise = true, Stade = EN_INSTRUCTION_P
     *    → P sieht jetzt den MAP-Button und kann ihn drücken
     *  - PG drückt "Annuler" → mapAutorise = false, Stade = EN_INSTRUCTION_P
     *    → P muss weiter arbeiten
     *  - Nach dem MAP ausstellen (NOTIFICATION_MAP_P) wird mapAutorise
     *    nicht mehr benötigt (der Stade kontrolliert dann den Flow).
     */
    @Builder.Default
    private Boolean mapAutorise = false;

    private String chambre;

    /**
     * Qualification du dossier.
     * Freitext-Feld für die rechtliche Qualifikation des Falls.
     * z.B. "Meurtre", "Vol avec violence", etc.
     */
    @Column(columnDefinition = "TEXT")
    private String qualification;

    /**
     * Relaxion - Freilassung des Suspects.
     * true = Suspect wurde freigelassen.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean relaxion = false;

    /**
     * Détention - Suspect befindet sich in Haft.
     * true = Suspect ist inhaftiert.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean detention = false;

    /**
     * Liberté provisoire - vorläufige Freilassung.
     * true = Suspect wurde vorläufig freigelassen.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean liberteProvisoire = false;

    /**
     * Sans suite - Verfahren eingestellt.
     * true = Verfahren wurde eingestellt (keine weiteren Maßnahmen).
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean sansSuite = false;

    /**
     * Fixation - Termin festgesetzt.
     * true = Verhandlungstermin wurde festgesetzt.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean fixation = false;

    // ----- Verknüpfungen zu anderen Tabellen -----
    @ManyToOne
    @JoinColumn(name = "instance_id")
    private Instance instance;

    @ManyToOne
    @JoinColumn(name = "instance_origine_id")
    private Instance instanceOrigine;

    @ManyToOne
    @JoinColumn(name = "procureur_id")
    private Utilisateur procureur;

    @ManyToOne
    @JoinColumn(name = "juge_instruction_id")
    private Utilisateur jugeInstruction;

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) dateCreation = LocalDate.now();
        if (statut == null) statut = StatutDossier.ACTIF;
        if (stade == null) stade = Stade.ENREGISTRE;
    }
}