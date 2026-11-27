package com.codesoupir.justicepro.service;

import com.codesoupir.justicepro.dto.AnnotationRequest;
import com.codesoupir.justicepro.enums.TypeAnnotation;
import com.codesoupir.justicepro.model.Annotation;
import com.codesoupir.justicepro.model.Dossier;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.AnnotationRepository;
import com.codesoupir.justicepro.repository.DossierRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Annotations (Notizen) zu einem Dossier.
 *
 * WICHTIG - Sichtbarkeitsregel:
 *  - Type PUBLIQUE      -> alle Benutzer sehen ALLE öffentlichen Annotations
 *  - Type PERSONNELLE   -> jeder Benutzer sieht NUR SEINE EIGENEN Notizen
 */
@Service
@RequiredArgsConstructor
public class AnnotationService {

    private final AnnotationRepository annotationRepository;
    private final DossierRepository dossierRepository;
    private final CurrentUserService currentUserService;

    /** Gibt alle Annotations zurück, die der aktuelle Benutzer sehen darf. */
    public List<Annotation> getAnnotationsVisibles(Long dossierId) {
        Utilisateur user = currentUserService.getUtilisateurConnecte();

        List<Annotation> result = new ArrayList<>();
        // 1. Alle öffentlichen Annotations
        result.addAll(annotationRepository.findByDossierIdAndType(dossierId, TypeAnnotation.PUBLIQUE));
        // 2. NUR die eigenen persönlichen Annotations
        result.addAll(annotationRepository.findByDossierIdAndTypeAndAuteurId(
                dossierId, TypeAnnotation.PERSONNELLE, user.getId()));

        return result;
    }

    public Annotation creerAnnotation(Long dossierId, AnnotationRequest req) {
        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new EntityNotFoundException("Dossier introuvable"));

        Annotation annotation = Annotation.builder()
                .dossier(dossier)
                .contenu(req.getContenu())
                .type(req.getType())
                .auteur(currentUserService.getUtilisateurConnecte())
                .build();

        return annotationRepository.save(annotation);
    }

    /** Löschen - nur der Autor darf seine EIGENEN Annotations löschen. */
    public void supprimerAnnotation(Long annotationId) {
        Annotation a = annotationRepository.findById(annotationId)
                .orElseThrow(() -> new EntityNotFoundException("Annotation introuvable"));

        Utilisateur user = currentUserService.getUtilisateurConnecte();

        if (!a.getAuteur().getId().equals(user.getId())) {
            throw new SecurityException("Vous ne pouvez supprimer que vos propres annotations.");
        }
        annotationRepository.delete(a);
    }
}