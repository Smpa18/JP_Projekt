package com.codesoupir.justicepro.model;

import com.codesoupir.justicepro.enums.TypeNotification;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

/**
 * Eine offizielle Anordnung im Verfahren:
 * MC = Mise en Cause, MA = Mandat d'Amener,
 * AR = Avis deRecherche, MAP = Mandat d'Arrêt Provisoire
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "dossier_id")
    private Dossier dossier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeNotification type;

    private LocalDate dateEmission;

    @ManyToOne
    @JoinColumn(name = "emis_par_id")
    private Utilisateur emisPar;

    private String lieu; // z.B. "Pr. Makala" (nur bei MAP relevant)

    private boolean confirme;

    @PrePersist
    public void prePersist() {
        if (dateEmission == null) {
            dateEmission = LocalDate.now();
        }
    }
}