package com.codesoupir.justicepro.service;

import com.codesoupir.justicepro.dto.*;
import com.codesoupir.justicepro.enums.*;
import com.codesoupir.justicepro.model.*;
import com.codesoupir.justicepro.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * ============================================================
 *  WORKFLOW-SERVICE - das Herzstück von JusticePro
 * ============================================================
 * ABLAUF VOIE PÉNALE (Parquet):
 *  ENREGISTRE (Greffier erfasst Plainte)
 *  → ASSIGNATION_PG (Greffier schickt an PG, droit=PENAL automatisch, classifie=false)
 *  → EN_INSTRUCTION_P (PG attribuiert OMP - direkt, kein Greffier-Schritt mehr)
 *     - P hört Plaignant (INVITATION)
 *     - P hört Suspect (MC, MA, AR)
 *     - P setzt Décision + drückt "Envoyer la décision au PG"
 *  → DECISION_EN_ATTENTE (PG sieht Décision von P)
 *     - PG Confirmer → EN_INSTRUCTION_P (Décision bestätigt)
 *     - PG Annuler   → EN_INSTRUCTION_P (Décision zurückgesetzt)
 *  → DEMANDE_MAP (P fragt PG um Erlaubnis MAP auszustellen)
 *     - PG Confirmer → MAP wird AUTOMATISCH ausgestellt → NOTIFICATION_MAP_P
 *     - PG Annuler   → EN_INSTRUCTION_P
 *  → NOTIFICATION_MAP_P (MAP automatisch ausgestellt)
 *  → VALIDATION_NOTIFICATION_MAP_P (PG validiert)
 *  → MAP_VALIDE_P → MAPE → FERME
 */
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final DossierRepository dossierRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final InstanceRepository instanceRepository;
    private final VerdictRepository verdictRepository;
    private final NotificationRepository notificationRepository;
    private final PlainteRepository plainteRepository;
    private final CurrentUserService currentUserService;
    private final HistoriqueDossierRepository historiqueDossierRepository;
    /* ===================== HILFSMETHODEN ===================== */

    /**
     * Sucht ein Dossier anhand seiner ID.
     * Wirft EntityNotFoundException wenn nicht gefunden.
     */
    private Dossier findDossier(Long id) {
        return dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier introuvable: " + id));
    }

    /**
     * Sucht eine Notification anhand ihrer ID.
     * Wird benutzt um danach das PDF zu generieren.
     */
    public Notification findNotification(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification introuvable: " + notificationId));
    }

    /**
     * Gibt alle Notifications eines Dossiers zurück.
     */
    public List<Notification> listerNotifications(Long dossierId) {
        return notificationRepository.findByDossierId(dossierId);
    }

    /**
     * Prüft ob das Dossier im erwarteten Stade ist.
     * Wirft IllegalStateException wenn der Stade nicht passt.
     */
    private void pruefeStade(Dossier d, Stade... erlaubteStades) {
        for (Stade s : erlaubteStades) {
            if (d.getStade() == s) return;
        }
        throw new IllegalStateException(
                "Action impossible : le dossier est au stade '" + d.getStade() +
                        "', mais cette action nécessite l'un des stades suivants : " +
                        Arrays.toString(erlaubteStades));
    }

    /**
     * Erstellt einen Historique-Eintrag für eine Aktion auf einem Dossier.
     * Wird nach jeder Workflow-Aktion aufgerufen.
     */
    private void enregistrerHistorique(Dossier dossier, String description, Stade stadeAvant) {
        Utilisateur utilisateur = currentUserService.getUtilisateurConnecte();
        HistoriqueDossier historique = HistoriqueDossier.builder()
                .dossier(dossier)
                .dateAction(LocalDateTime.now())
                .description(description)
                .effectuePar(utilisateur != null
                        ? utilisateur.getNom() + " " + (utilisateur.getPostNom() != null ? utilisateur.getPostNom() : "")
                        : "Système")
                .stadeAvant(stadeAvant != null ? stadeAvant.name() : null)
                .stadeApres(dossier.getStade() != null ? dossier.getStade().name() : null)
                .build();
        historiqueDossierRepository.save(historique);
    }

    /* ===================== VOIE PÉNALE ===================== */

    /**
     * GREFFIER: klassifiziert die Plainte und sendet sie weiter.
     * Wird nicht mehr im Frontend benutzt — envoyerAuPG ersetzt das.
     */
    @PreAuthorize("hasRole('GREFFIER')")
    @Transactional
    public Dossier classifierEtEnvoyer(Long dossierId, ClassifierRequest req) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.ENREGISTRE);
        d.setDroit(req.getDroit());
        d.setStade(req.getDroit() == TypeDroit.PENAL ? Stade.ASSIGNATION_PG : Stade.FIXE);
        return dossierRepository.save(d);
    }

    /**
     * GREFFIER: schickt Plainte direkt an PG.
     * droit=PENAL automatisch, classifie=false.
     *
     * ENREGISTRE -> ASSIGNATION_PG
     */
    @PreAuthorize("hasRole('GREFFIER')")
    @Transactional
    public Dossier envoyerAuPG(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.ENREGISTRE);
        Stade stadeAvant = d.getStade();
        d.setDroit(TypeDroit.PENAL);
        d.setClassifie(false);
        d.setStade(Stade.ASSIGNATION_PG);
        dossierRepository.save(d);
        enregistrerHistorique(d, "Dossier an den Procureur Général geschickt", stadeAvant);
        return d;
    }

    /**
     * GREFFIER: korrigiert die Daten der Plainte.
     * Nur erlaubt solange Stade = ENREGISTRE.
     */
    @PreAuthorize("hasRole('GREFFIER')")
    @Transactional
    public Dossier modifierPlainte(Long dossierId, ModifierPlainteRequest req) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.ENREGISTRE);

        Plainte plainte = plainteRepository.findByDossier_Id(dossierId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aucune plainte associée à ce dossier."));

        // ----- Plaignant aktualisieren -----
        Plaignant plaignant = plainte.getPlaignant();
        if (plaignant != null) {
            plaignant.setNom(req.getPlaignantNom());
            plaignant.setPostNom(req.getPlaignantPostNom());
            plaignant.setPrenom(req.getPlaignantPrenom());
            plaignant.setSexe(req.getPlaignantSexe());
            plaignant.setLieuNaissance(req.getPlaignantLieuNaissance());
            plaignant.setVillageOrigine(req.getPlaignantVillageOrigine());
            plaignant.setSecteur(req.getPlaignantSecteur());
            plaignant.setTerritoire(req.getPlaignantTerritoire());
            plaignant.setAssistance(req.isPlaignantAssistance());
            plaignant.setEtatCivil(req.getPlaignantEtatCivil());
            plaignant.setNomPere(req.getPlaignantNomPere());
            plaignant.setNomMere(req.getPlaignantNomMere());
            plaignant.setNombreEnfants(req.getPlaignantNombreEnfants());
            plaignant.setNumeroTelephone(req.getPlaignantNumeroTelephone());
            plaignant.setAdresseEmail(req.getPlaignantAdresseEmail());
            plaignant.setAdresse(req.getPlaignantAdresse());
            plaignant.setNationalite(req.getPlaignantNationalite());
            // Neue Felder: Bildung und Beruf
            plaignant.setNiveauEtude(req.getPlaignantNiveauEtude());
            plaignant.setProfession(req.getPlaignantProfession());
        }

        // ----- Avocats du Plaignant -----
        if (req.getNumerosOrdrePlaignant() != null) {
            List<Utilisateur> avocatsPlaignant = new ArrayList<>();
            for (String numeroOrdre : req.getNumerosOrdrePlaignant()) {
                if (numeroOrdre != null && !numeroOrdre.isBlank()) {
                    Utilisateur avocat = utilisateurRepository
                            .findByNumeroOrdreAndRole(numeroOrdre, Role.AVOCAT)
                            .orElseThrow(() -> new EntityNotFoundException(
                                    "Avocat introuvable avec le numéro d'ordre: " + numeroOrdre));
                    avocatsPlaignant.add(avocat);
                }
            }
            plainte.setAvocatsPlaignant(avocatsPlaignant);
        }

        // ----- Suspects aktualisieren -----
        if (req.getSuspects() != null) {
            if (plainte.getSuspects() == null) {
                plainte.setSuspects(new ArrayList<>());
            } else {
                plainte.getSuspects().clear();
            }
            for (ModifierPlainteRequest.SuspectDTO dto : req.getSuspects()) {
                Suspect suspect = new Suspect();
                suspect.setNom(dto.getNom());
                suspect.setPostNom(dto.getPostNom());
                suspect.setPrenom(dto.getPrenom());
                suspect.setSexe(dto.getSexe());
                suspect.setLieuNaissance(dto.getLieuNaissance());
                suspect.setVillageOrigine(dto.getVillageOrigine());
                suspect.setSecteur(dto.getSecteur());
                suspect.setTerritoire(dto.getTerritoire());
                suspect.setAssistance(dto.isAssistance());
                suspect.setEtatCivil(dto.getEtatCivil());
                suspect.setNomPere(dto.getNomPere());
                suspect.setNomMere(dto.getNomMere());
                suspect.setNombreEnfants(dto.getNombreEnfants());
                suspect.setNumeroTelephone(dto.getNumeroTelephone());
                suspect.setAdresseEmail(dto.getAdresseEmail());
                suspect.setAdresse(dto.getAdresse());
                suspect.setNationalite(dto.getNationalite());
                // Neue Felder: Bildung und Beruf
                suspect.setNiveauEtude(dto.getNiveauEtude());
                suspect.setProfession(dto.getProfession());
            }
        }

        // ----- Avocats des Suspects -----
        if (req.getNumerosOrdreSuspect() != null) {
            List<Utilisateur> avocatsSuspect = new ArrayList<>();
            for (String numeroOrdre : req.getNumerosOrdreSuspect()) {
                if (numeroOrdre != null && !numeroOrdre.isBlank()) {
                    Utilisateur avocat = utilisateurRepository
                            .findByNumeroOrdreAndRole(numeroOrdre, Role.AVOCAT)
                            .orElseThrow(() -> new EntityNotFoundException(
                                    "Avocat introuvable avec le numéro d'ordre: " + numeroOrdre));
                    avocatsSuspect.add(avocat);
                }
            }
            plainte.setAvocatsSuspect(avocatsSuspect);
        }

        // ----- Textfelder -----
        plainte.setDescriptionPlainte(req.getDescriptionPlainte());
        plainte.setProcesVerbalAudition(req.getProcesVerbalAudition());
        plainte.setObservation(req.getObservation());
        plainte.setCarnetPersonnel(req.getCarnetPersonnel());
        plainte.setChargeRelaxion(req.getChargeRelaxion());

        plainteRepository.save(plainte);
        return d;
    }

    /**
     * PROCUREUR / PG: bearbeitet Plainte OHNE Stade-Check.
     * Greffier benutzt modifierPlainte() mit Stade-Check (nur ENREGISTRE).
     */
    @PreAuthorize("hasAnyRole('PROCUREUR', 'PROCUREUR_GENERAL')")
    @Transactional
    public Dossier modifierPlainteLibre(Long dossierId, ModifierPlainteRequest req) {
        Dossier d = findDossier(dossierId);

        Plainte plainte = plainteRepository.findByDossier_Id(dossierId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aucune plainte associée à ce dossier."));

        // ----- Plaignant aktualisieren -----
        Plaignant plaignant = plainte.getPlaignant();
        if (plaignant != null) {
            plaignant.setNom(req.getPlaignantNom());
            plaignant.setPostNom(req.getPlaignantPostNom());
            plaignant.setPrenom(req.getPlaignantPrenom());
            plaignant.setSexe(req.getPlaignantSexe());
            plaignant.setLieuNaissance(req.getPlaignantLieuNaissance());
            plaignant.setVillageOrigine(req.getPlaignantVillageOrigine());
            plaignant.setSecteur(req.getPlaignantSecteur());
            plaignant.setTerritoire(req.getPlaignantTerritoire());
            plaignant.setAssistance(req.isPlaignantAssistance());
            plaignant.setEtatCivil(req.getPlaignantEtatCivil());
            plaignant.setNomPere(req.getPlaignantNomPere());
            plaignant.setNomMere(req.getPlaignantNomMere());
            plaignant.setNombreEnfants(req.getPlaignantNombreEnfants());
            plaignant.setNumeroTelephone(req.getPlaignantNumeroTelephone());
            plaignant.setAdresseEmail(req.getPlaignantAdresseEmail());
            plaignant.setAdresse(req.getPlaignantAdresse());
            plaignant.setNationalite(req.getPlaignantNationalite());
            // Neue Felder: Bildung und Beruf
            plaignant.setNiveauEtude(req.getPlaignantNiveauEtude());
            plaignant.setProfession(req.getPlaignantProfession());
        }

        // ----- Avocats du Plaignant -----
        if (req.getNumerosOrdrePlaignant() != null) {
            List<Utilisateur> avocatsPlaignant = new ArrayList<>();
            for (String numeroOrdre : req.getNumerosOrdrePlaignant()) {
                if (numeroOrdre != null && !numeroOrdre.isBlank()) {
                    Utilisateur avocat = utilisateurRepository
                            .findByNumeroOrdreAndRole(numeroOrdre, Role.AVOCAT)
                            .orElseThrow(() -> new EntityNotFoundException(
                                    "Avocat introuvable avec le numéro d'ordre: " + numeroOrdre));
                    avocatsPlaignant.add(avocat);
                }
            }
            plainte.setAvocatsPlaignant(avocatsPlaignant);
        }

        // ----- Suspects aktualisieren -----
        if (req.getSuspects() != null) {
            if (plainte.getSuspects() == null) {
                plainte.setSuspects(new ArrayList<>());
            } else {
                plainte.getSuspects().clear();
            }
            for (ModifierPlainteRequest.SuspectDTO dto : req.getSuspects()) {
                Suspect suspect = new Suspect();
                suspect.setNom(dto.getNom());
                suspect.setPostNom(dto.getPostNom());
                suspect.setPrenom(dto.getPrenom());
                suspect.setSexe(dto.getSexe());
                suspect.setLieuNaissance(dto.getLieuNaissance());
                suspect.setVillageOrigine(dto.getVillageOrigine());
                suspect.setSecteur(dto.getSecteur());
                suspect.setTerritoire(dto.getTerritoire());
                suspect.setAssistance(dto.isAssistance());
                suspect.setEtatCivil(dto.getEtatCivil());
                suspect.setNomPere(dto.getNomPere());
                suspect.setNomMere(dto.getNomMere());
                suspect.setNombreEnfants(dto.getNombreEnfants());
                suspect.setNumeroTelephone(dto.getNumeroTelephone());
                suspect.setAdresseEmail(dto.getAdresseEmail());
                suspect.setAdresse(dto.getAdresse());
                suspect.setNationalite(dto.getNationalite());
                // Neue Felder: Bildung und Beruf
                suspect.setNiveauEtude(dto.getNiveauEtude());
                suspect.setProfession(dto.getProfession());
            }
        }

        // ----- Avocats des Suspects -----
        if (req.getNumerosOrdreSuspect() != null) {
            List<Utilisateur> avocatsSuspect = new ArrayList<>();
            for (String numeroOrdre : req.getNumerosOrdreSuspect()) {
                if (numeroOrdre != null && !numeroOrdre.isBlank()) {
                    Utilisateur avocat = utilisateurRepository
                            .findByNumeroOrdreAndRole(numeroOrdre, Role.AVOCAT)
                            .orElseThrow(() -> new EntityNotFoundException(
                                    "Avocat introuvable avec le numéro d'ordre: " + numeroOrdre));
                    avocatsSuspect.add(avocat);
                }
            }
            plainte.setAvocatsSuspect(avocatsSuspect);
        }

        // ----- Textfelder -----
        plainte.setDescriptionPlainte(req.getDescriptionPlainte());
        plainte.setProcesVerbalAudition(req.getProcesVerbalAudition());
        plainte.setObservation(req.getObservation());
        plainte.setCarnetPersonnel(req.getCarnetPersonnel());
        plainte.setChargeRelaxion(req.getChargeRelaxion());

        plainteRepository.save(plainte);
        return d;
    }

    /**
     * PG: weist dem Dossier einen Procureur (OMP) zu.
     * Geht DIREKT zu EN_INSTRUCTION_P.
     *
     * ASSIGNATION_PG -> EN_INSTRUCTION_P
     */
    @PreAuthorize("hasRole('PROCUREUR_GENERAL')")
    @Transactional
    public Dossier assignerProcureur(Long dossierId, AssignerProcureurRequest req) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.ASSIGNATION_PG);
        Utilisateur procureur = utilisateurRepository.findById(req.getProcureurId())
                .orElseThrow(() -> new EntityNotFoundException("Procureur introuvable"));
        Stade stadeAvant = d.getStade();
        d.setProcureur(procureur);
        d.setStade(Stade.EN_INSTRUCTION_P);
        dossierRepository.save(d);
        enregistrerHistorique(d, "OMP zugewiesen: " + procureur.getNom() + " " + (procureur.getPostNom() != null ? procureur.getPostNom() : ""), stadeAvant);
        return d;
    }

    /**
     * GREFFIER: bestätigt die Zuweisung des Procureur.
     * Wird nicht mehr erreicht — assignerProcureur geht direkt zu EN_INSTRUCTION_P.
     */
    @PreAuthorize("hasRole('GREFFIER')")
    @Transactional
    public Dossier validerAssignationProcureur(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.ASSIGNE_GREFF);
        d.setStade(Stade.EN_INSTRUCTION_P);
        return dossierRepository.save(d);
    }

    /**
     * Stellt eine Notification aus (INVITATION, MC, MA, AR).
     * MAP wird automatisch durch confirmerAutorisationMap ausgestellt.
     */
    @PreAuthorize("hasAnyRole('PROCUREUR', 'JUGE_INSTRUCTION')")
    @Transactional
    public Notification emettreNotification(Long dossierId, NotificationRequest req) {
        Dossier d = findDossier(dossierId);
        Notification notif = Notification.builder()
                .dossier(d)
                .type(req.getType())
                .lieu(req.getLieu())
                .emisPar(currentUserService.getUtilisateurConnecte())
                .build();
        notif = notificationRepository.save(notif);
        if (req.getType() == TypeNotification.MAP) {
            if (d.getDroit() == TypeDroit.PENAL) {
                pruefeStade(d, Stade.EN_INSTRUCTION_P);
                d.setStade(Stade.NOTIFICATION_MAP_P);
            } else {
                pruefeStade(d, Stade.EN_INSTRUCTION_CH);
                d.setStade(Stade.NOTIFICATION_MAP_T);
            }
            dossierRepository.save(d);
        }
        return notif;
    }

    /**
     * PROCUREUR: schickt Décision an PG zur Bestätigung.
     *
     * EN_INSTRUCTION_P -> DECISION_EN_ATTENTE
     */
    @PreAuthorize("hasRole('PROCUREUR')")
    @Transactional
    public Dossier envoyerDecision(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.EN_INSTRUCTION_P);
        d.setStade(Stade.DECISION_EN_ATTENTE);
        return dossierRepository.save(d);
    }

    /**
     * PG: bestätigt die Décision des Procureur.
     *
     * DECISION_EN_ATTENTE -> EN_INSTRUCTION_P (Décision bleibt)
     */
    @PreAuthorize("hasRole('PROCUREUR_GENERAL')")
    @Transactional
    public Dossier confirmerDecision(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.DECISION_EN_ATTENTE);
        Stade stadeAvant = d.getStade();
        d.setStade(Stade.EN_INSTRUCTION_P);
        dossierRepository.save(d);
        enregistrerHistorique(d, "Décision des OMP vom PG bestätigt", stadeAvant);
        return d;
    }

    /**
     * PG: lehnt die Décision des Procureur ab.
     * Alle Décision-Felder werden zurückgesetzt.
     *
     * DECISION_EN_ATTENTE -> EN_INSTRUCTION_P (Décision zurückgesetzt)
     */
    @PreAuthorize("hasRole('PROCUREUR_GENERAL')")
    @Transactional
    public Dossier annulerDecision(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.DECISION_EN_ATTENTE);
        d.setRelaxion(false);
        d.setDetention(false);
        d.setLiberteProvisoire(false);
        d.setSansSuite(false);
        d.setFixation(false);
        d.setStade(Stade.EN_INSTRUCTION_P);
        return dossierRepository.save(d);
    }

    /**
     * PROCUREUR: sendet Anfrage an PG um MAP ausstellen zu dürfen.
     *
     * EN_INSTRUCTION_P -> DEMANDE_MAP
     */
    @PreAuthorize("hasRole('PROCUREUR')")
    @Transactional
    public Dossier demanderAutorisationMap(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.EN_INSTRUCTION_P);
        d.setStade(Stade.DEMANDE_MAP);
        return dossierRepository.save(d);
    }

    /**
     * PG: bestätigt MAP-Anfrage.
     * MAP wird AUTOMATISCH ausgestellt.
     *
     * DEMANDE_MAP -> NOTIFICATION_MAP_P (MAP automatisch ausgestellt)
     */
    @PreAuthorize("hasRole('PROCUREUR_GENERAL')")
    @Transactional
    public Dossier confirmerAutorisationMap(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.DEMANDE_MAP);
        // MAP automatisch ausstellen im Namen des zugewiesenen Procureur
        Notification mapNotification = Notification.builder()
                .dossier(d)
                .type(TypeNotification.MAP)
                .lieu("Pr. Makala")
                .emisPar(d.getProcureur())
                .build();
        notificationRepository.save(mapNotification);
        d.setStade(Stade.NOTIFICATION_MAP_P);
        d.setMapAutorise(true);
        return dossierRepository.save(d);
    }

    /**
     * PG: lehnt MAP-Anfrage ab.
     *
     * DEMANDE_MAP -> EN_INSTRUCTION_P
     */
    @PreAuthorize("hasRole('PROCUREUR_GENERAL')")
    @Transactional
    public Dossier annulerAutorisationMap(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.DEMANDE_MAP);
        d.setStade(Stade.EN_INSTRUCTION_P);
        d.setMapAutorise(false);
        return dossierRepository.save(d);
    }

    /**
     * PROCUREUR + PG: bestätigen gemeinsam die MAP-Notification.
     *
     * NOTIFICATION_MAP_P -> VALIDATION_NOTIFICATION_MAP_P
     */
    @PreAuthorize("hasAnyRole('PROCUREUR', 'PROCUREUR_GENERAL')")
    @Transactional
    public Dossier validerNotificationMap(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.NOTIFICATION_MAP_P);
        d.setStade(Stade.VALIDATION_NOTIFICATION_MAP_P);
        return dossierRepository.save(d);
    }

    /**
     * PG: validiert die MAP-Notification final.
     *
     * VALIDATION_NOTIFICATION_MAP_P -> MAP_VALIDE_P
     */
    @PreAuthorize("hasRole('PROCUREUR_GENERAL')")
    @Transactional
    public Dossier validerMap(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.VALIDATION_NOTIFICATION_MAP_P);
        d.setStade(Stade.MAP_VALIDE_P);
        return dossierRepository.save(d);
    }

    /**
     * PG: lehnt MAP-Notification ab.
     *
     * VALIDATION_NOTIFICATION_MAP_P -> EN_INSTRUCTION_P
     */
    @PreAuthorize("hasRole('PROCUREUR_GENERAL')")
    @Transactional
    public Dossier annulerMap(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.VALIDATION_NOTIFICATION_MAP_P);
        d.setStade(Stade.EN_INSTRUCTION_P);
        d.setMapAutorise(false);
        return dossierRepository.save(d);
    }

    /**
     * GREFFIER: bestätigt das vom PG validierte MAP.
     *
     * MAP_VALIDE_P -> MAPE
     */
    @PreAuthorize("hasRole('GREFFIER')")
    @Transactional
    public Dossier confirmerMap(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.MAP_VALIDE_P);
        d.setStade(Stade.MAPE);
        return dossierRepository.save(d);
    }

    /* ===================== VOIE CIVILE ===================== */

    /**
     * PRÉSIDENT DU TRIBUNAL: weist Chambre + Juge zu.
     *
     * ASSIGNATION_PT -> ASSIGNE_GREFF_T
     */
    @PreAuthorize("hasRole('PRESIDENT_TRIBUNAL')")
    @Transactional
    public Dossier assignerChambre(Long dossierId, AssignerChambreRequest req) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.ASSIGNATION_PT);
        Utilisateur juge = utilisateurRepository.findById(req.getJugeInstructionId())
                .orElseThrow(() -> new EntityNotFoundException("Juge introuvable"));
        d.setChambre(req.getChambre());
        d.setJugeInstruction(juge);
        d.setStade(Stade.ASSIGNE_GREFF_T);
        return dossierRepository.save(d);
    }

    /**
     * GREFFIER (Tribunal): bestätigt Chambre-Zuweisung.
     *
     * ASSIGNE_GREFF_T -> EN_INSTRUCTION_CH
     */
    @PreAuthorize("hasRole('GREFFIER')")
    @Transactional
    public Dossier validerAssignationChambre(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.ASSIGNE_GREFF_T);
        d.setStade(Stade.EN_INSTRUCTION_CH);
        return dossierRepository.save(d);
    }

    /**
     * PRÉSIDENT TRIBUNAL: validiert MAP-Notification (Voie Civile).
     *
     * NOTIFICATION_MAP_T -> MAP_VALIDE_CH
     */
    @PreAuthorize("hasRole('PRESIDENT_TRIBUNAL')")
    @Transactional
    public Dossier validerMapCivil(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.NOTIFICATION_MAP_T);
        d.setStade(Stade.MAP_VALIDE_CH);
        return dossierRepository.save(d);
    }

    /* ===================== GEMEINSAME AKTIONEN ===================== */

    /**
     * JUGE / PRÉSIDENT TRIBUNAL: fällt das Urteil → FERME.
     */
    @PreAuthorize("hasAnyRole('JUGE_INSTRUCTION', 'PRESIDENT_TRIBUNAL')")
    @Transactional
    public Dossier condamner(Long dossierId, VerdictRequest req) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.EN_INSTRUCTION_P, Stade.EN_INSTRUCTION_CH,
                Stade.MAPE, Stade.MAP_VALIDE_CH);
        Verdict verdict = verdictRepository.findByDossierId(dossierId)
                .orElse(Verdict.builder().dossier(d).build());
        verdict.setTexteVerdict(req.getTexteVerdict());
        verdict.setCondamnation(req.isCondamnation());
        verdict.setSursis(req.isSursis());
        verdict.setLiberteProvisoire(req.isLiberteProvisoire());
        verdict.setMiseEnLiberte(req.isMiseEnLiberte());
        verdict.setIncarceration(req.isIncarceration());
        verdict.setLieuIncarceration(req.getLieuIncarceration());
        verdict.setIncarcerationDe(req.getIncarcerationDe());
        verdict.setIncarcerationA(req.getIncarcerationA());
        verdict.setRenduPar(currentUserService.getUtilisateurConnecte());
        verdict.setDateVerdict(LocalDateTime.now());
        if (req.isIncarceration() && req.getIncarcerationDe() != null
                && req.getIncarcerationA() != null) {
            long jours = ChronoUnit.DAYS.between(req.getIncarcerationDe(), req.getIncarcerationA());
            verdict.setDureeJours((int) jours);
        }
        verdictRepository.save(verdict);
        d.setStade(Stade.FERME);
        d.setStatut(StatutDossier.FERME);
        d.setDateFermeture(LocalDate.now());
        return dossierRepository.save(d);
    }

    /**
     * PG / PRÉSIDENT TRIBUNAL: öffnet geschlossenes Dossier wieder.
     *
     * FERME -> EN_INSTRUCTION_P / EN_INSTRUCTION_CH
     */
    @PreAuthorize("hasAnyRole('PROCUREUR_GENERAL', 'PRESIDENT_TRIBUNAL')")
    @Transactional
    public Dossier reouvrirDossier(Long dossierId) {
        Dossier d = findDossier(dossierId);
        pruefeStade(d, Stade.FERME);
        d.setStade(d.getDroit() == TypeDroit.PENAL ? Stade.EN_INSTRUCTION_P : Stade.EN_INSTRUCTION_CH);
        d.setStatut(StatutDossier.ACTIF);
        d.setDateFermeture(null);
        return dossierRepository.save(d);
    }

    /**
     * PG / PRÉSIDENT TRIBUNAL: verschiebt Dossier zu anderer Instance.
     */
    @PreAuthorize("hasAnyRole('PROCUREUR_GENERAL', 'PRESIDENT_TRIBUNAL')")
    @Transactional
    public Dossier changerInstance(Long dossierId, ChangerInstanceRequest req) {
        Dossier d = findDossier(dossierId);
        Instance nouvelle = instanceRepository.findById(req.getNouvelleInstanceId())
                .orElseThrow(() -> new EntityNotFoundException("Instance introuvable"));
        Stade stadeAvant = d.getStade();
        d.setInstanceOrigine(d.getInstance());
        d.setInstance(nouvelle);
        dossierRepository.save(d);
        enregistrerHistorique(d, "Dossier an Instance übertragen: " + nouvelle.getNomInstance(), stadeAvant);
        return d;
    }

    /**
     * PG / PRÉSIDENT TRIBUNAL: schickt Dossier zurück zur ursprünglichen Instance.
     */
    @PreAuthorize("hasAnyRole('PROCUREUR_GENERAL', 'PRESIDENT_TRIBUNAL')")
    @Transactional
    public Dossier retournerInstanceEnvoi(Long dossierId) {
        Dossier d = findDossier(dossierId);
        if (d.getInstanceOrigine() == null) {
            throw new IllegalStateException(
                    "Ce dossier n'a pas d'instance d'origine enregistrée.");
        }
        Instance instanceActuelle = d.getInstance();
        d.setInstance(d.getInstanceOrigine());
        d.setInstanceOrigine(instanceActuelle);
        return dossierRepository.save(d);
    }
}