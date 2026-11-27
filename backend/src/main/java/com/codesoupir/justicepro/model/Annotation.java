package com.codesoupir.justicepro.model;

import com.codesoupir.justicepro.enums.TypeAnnotation;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Notiz zu einem Dossier.
 * - PUBLIQUE    -> von allen Mitarbeitern sichtbar
 * - PERSONNELLE -> nur vom Autor selbst sichtbar (Regel kommt im Service!)
 */
@Entity
@Table(name = "annotations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Annotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "dossier_id")
    private Dossier dossier;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeAnnotation type;

    @ManyToOne
    @JoinColumn(name = "auteur_id")
    private Utilisateur auteur;

    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;

    @PrePersist
    public void prePersist() {
        dateCreation = LocalDateTime.now();
        dateModification = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        dateModification = LocalDateTime.now();
    }
}