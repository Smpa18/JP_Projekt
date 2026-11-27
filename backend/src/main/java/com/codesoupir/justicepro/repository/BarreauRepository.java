package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.Barreau;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Datenbankzugriff für Barreaux.
 * Ermöglicht es alle Barreaux einer Province zu laden
 * und neue Barreaux hinzuzufügen.
 */
public interface BarreauRepository extends JpaRepository<Barreau, Long> {

    /**
     * Lädt alle Barreaux einer bestimmten Province, alphabetisch sortiert.
     * Wird benutzt wenn der Admin eine Province wählt und das
     * Barreau-Dropdown sich automatisch anpassen soll.
     */
    List<Barreau> findByProvinceOrderByNomAsc(String province);

    /**
     * Lädt alle Barreaux aller Provinces, sortiert nach Province dann Name.
     * Wird beim ersten Laden der Administrator-Seite benutzt.
     */
    List<Barreau> findAllByOrderByProvinceAscNomAsc();
}