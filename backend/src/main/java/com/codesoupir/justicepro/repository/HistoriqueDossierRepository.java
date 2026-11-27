package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.HistoriqueDossier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository für HistoriqueDossier.
 * Lädt alle Historique-Einträge eines Dossiers sortiert nach Datum.
 */
@Repository
public interface HistoriqueDossierRepository extends JpaRepository<HistoriqueDossier, Long> {

    // Alle Einträge eines Dossiers — neueste zuerst
    List<HistoriqueDossier> findByDossierIdOrderByDateActionDesc(Long dossierId);
}