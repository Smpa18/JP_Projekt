package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.DocumentPersonnel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Datenbankzugriff für Dokumente der Mitarbeiter.
 * Ermöglicht es, alle Dokumente eines bestimmten Mitarbeiters
 * anhand seiner ID zu laden.
 */
public interface DocumentPersonnelRepository extends JpaRepository<DocumentPersonnel, Long> {

    /**
     * Lädt alle Dokumente eines bestimmten Mitarbeiters.
     * Wird benutzt, wenn der Admin das Profil eines Mitarbeiters
     * öffnet und seine hochgeladenen Dokumente sehen möchte.
     */
    List<DocumentPersonnel> findByUtilisateurId(Long utilisateurId);
}