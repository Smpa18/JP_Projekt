package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.enums.Role;
import com.codesoupir.justicepro.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    /**
     * Wird für den LOGIN benutzt (Numéro de matricule).
     * Spring Security ruft diese Methode auf, wenn jemand sich einloggt.
     */
    Optional<Utilisateur> findByNumeroMatricule(String numeroMatricule);

    /**
     * Für die Avocat-Suche per Teilstring (Numéro de matricule).
     * Wird im Plainte-Formular benutzt wenn der Greffier einen
     * Avocat per Matricule sucht.
     */
    List<Utilisateur> findByNumeroMatriculeContainingIgnoreCase(String suchbegriff);

    /**
     * Sucht einen Avocat per Numéro de l'ordre UND Role=AVOCAT.
     * Wird in WorkflowService.modifierPlainte() benutzt wenn der
     * Greffier einen Avocat per Numéro de l'ordre zum Plaignant
     * oder Suspect hinzufügt.
     * Das Feld "numeroOrdre" ist in Utilisateur.java gespeichert.
     */
    Optional<Utilisateur> findByNumeroOrdreAndRole(String numeroOrdre, Role role);

    /**
     * Autocomplete für die Avocat-Suche per Numéro de l'ordre.
     * Wird im Plainte-Formular benutzt während der Greffier tippt:
     * gibt alle Avocats zurück deren Numéro de l'ordre den eingegebenen
     * Text enthält (case-insensitive Teilstring-Suche).
     * So erscheinen die passenden Avocats schon während der Eingabe.
     */
    List<Utilisateur> findByNumeroOrdreContainingIgnoreCaseAndRole(String suchbegriff, Role role);

    /**
     * Lädt alle Mitarbeiter nach Rolle.
     * Wird im Admin-Controller benutzt um z.B. alle Greffiers
     * oder alle Procureurs zu laden.
     */
    List<Utilisateur> findByRole(Role role);
}