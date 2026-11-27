package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.Annotation;
import com.codesoupir.justicepro.enums.TypeAnnotation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnnotationRepository extends JpaRepository<Annotation, Long> {

    // Alle öffentlichen Annotations zu einem Dossier
    List<Annotation> findByDossierIdAndType(Long dossierId, TypeAnnotation type);

    // Persönliche Annotations NUR vom angegebenen Autor
    List<Annotation> findByDossierIdAndTypeAndAuteurId(
            Long dossierId, TypeAnnotation type, Long auteurId);
}