package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.Dossier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

/**
 * JpaSpecificationExecutor erlaubt SPÄTER dynamische Filter
 * für die Suchmaske "Dossiers/Action enattente"
 * (Status + Datum + Procureur + Juge gleichzeitig, alle optional).
 */
public interface DossierRepository extends JpaRepository<Dossier, Long>,
        JpaSpecificationExecutor<Dossier> {

    Optional<Dossier> findByNumeroDossier(String numeroDossier);
}