package com.codesoupir.justicepro.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Das Urteil zu genau einem Dossier.
 * Enthält den freien Text + die Checkboxen aus
 * "Fermeture de procédure / Condamner".
 */
@Entity
@Table(name = "verdicts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Verdict {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "dossier_id", unique = true)
    private Dossier dossier;

    // Freier Text aus dem "Verdict" Textfeld
    @Column(columnDefinition = "TEXT")
    private String texteVerdict;

    // ----- Checkboxen aus "Fermeture de procédure" -----
    private Boolean condamnation;
    private Boolean sursis;
    private Boolean liberteProvisoire;
    private Boolean miseEnLiberte;
    private Boolean incarceration;

    // ----- Nur relevant wenn incarceration = true -----
    private String lieuIncarceration;  // z.B. "Pr. Makala"
    private LocalDate incarcerationDe; // Start-Datum
    private LocalDate incarcerationA;  // End-Datum
    private Integer dureeJours;        // wird später automatisch berechnet!

    @ManyToOne
    @JoinColumn(name = "rendu_par_id")
    private Utilisateur renduPar; // Juge d'instruction / Président

    private LocalDateTime dateVerdict;

    @PrePersist
    public void prePersist() {
        if (dateVerdict == null) {
            dateVerdict = LocalDateTime.now();
        }
    }
}