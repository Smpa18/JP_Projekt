package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.Ville;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Datenbankzugriff für Städte der DRC.
 * Ermöglicht es, alle Städte einer Province zu laden
 * und neue Städte hinzuzufügen.
 */
public interface VilleRepository extends JpaRepository<Ville, Long> {

    /**
     * Lädt alle Städte einer bestimmten Province, alphabetisch sortiert.
     * Wird benutzt wenn der Admin eine Province wählt und das
     * Stadt-Dropdown sich automatisch anpassen soll.
     */
    List<Ville> findByProvinceOrderByNomAsc(String province);

    /**
     * Lädt alle Städte aller Provinces, sortiert nach Province dann Stadt.
     * Wird beim ersten Laden der Administrator-Seite benutzt.
     */
    List<Ville> findAllByOrderByProvinceAscNomAsc();
}