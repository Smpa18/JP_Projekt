package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.Plainte;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Datenbank-Zugriff für Plaintes (Beschwerden/Anzeigen).
 */
public interface PlainteRepository extends JpaRepository<Plainte, Long> {

    // Wird für das PDF "Récépissé de plainte" benutzt (per Numéro suchen)
    Optional<Plainte> findByNumero(String numero);

    // NEU: Wird benutzt, um die Plainte zu einem Dossier zu finden,
    // z.B. um sie nachträglich zu korrigieren (siehe WorkflowService.modifierPlainte).
    // Spring Data JPA erkennt automatisch an "Dossier_Id", dass hier
    // über das Feld "dossier" -> "id" gesucht werden soll.
    Optional<Plainte> findByDossier_Id(Long dossierId);
}