package com.codesoupir.justicepro.controller;

import com.codesoupir.justicepro.dto.*;
import com.codesoupir.justicepro.enums.Role;
import com.codesoupir.justicepro.enums.Stade;
import com.codesoupir.justicepro.enums.StatutDossier;
import com.codesoupir.justicepro.model.Annotation;
import com.codesoupir.justicepro.model.Dossier;
import com.codesoupir.justicepro.model.HistoriqueDossier;
import com.codesoupir.justicepro.model.Notification;
import com.codesoupir.justicepro.model.PieceJointe;
import com.codesoupir.justicepro.model.Plainte;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.HistoriqueDossierRepository;
import com.codesoupir.justicepro.service.AnnotationService;
import com.codesoupir.justicepro.service.CurrentUserService;
import com.codesoupir.justicepro.service.DossierService;
import com.codesoupir.justicepro.service.PdfService;
import com.codesoupir.justicepro.service.PieceJointeService;
import com.codesoupir.justicepro.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;

/**
 * Controller für alle Dossier-Operationen:
 * Suche, Detailansicht, Workflow-Aktionen, Annotations, Pièces jointes.
 */
@RestController
@RequestMapping("/api/dossiers")
@RequiredArgsConstructor
public class DossierController {

    private final DossierService dossierService;
    private final WorkflowService workflowService;
    private final HistoriqueDossierRepository historiqueDossierRepository;
    private final AnnotationService annotationService;
    private final PieceJointeService pieceJointeService;
    private final CurrentUserService currentUserService;
    private final PdfService pdfService;

    /**
     * Suche für "Tous les dossiers" — alle Rollen sehen ALLE Dossiers
     * aller Instances, ohne Einschränkung. Nur zum Lesen/Konsultieren.
     *
     * Archivierte Dossiers (FERME + 5 Jahre) erscheinen ebenfalls hier —
     * das DTO enthält archive=true damit das Frontend einen Badge anzeigt.
     */
    @GetMapping("/tous")
    public List<DossierListDTO> rechercherTous(
            @RequestParam(required = false) String numero,
            @RequestParam(required = false) LocalDate dateDe,
            @RequestParam(required = false) LocalDate dateA,
            @RequestParam(required = false) StatutDossier statut,
            @RequestParam(required = false) String procureur,
            @RequestParam(required = false) String jugeInstruction,
            @RequestParam(required = false) String nomPlaignant,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String instance) {

        return dossierService.rechercherTous(numero, dateDe, dateA, statut, procureur,
                jugeInstruction, nomPlaignant, province, instance);
    }

    /**
     * Suche für die normale Seite "Dossiers" — mit rollenspezifischer
     * Sichtbarkeits-Einschränkung (siehe DossierService.rechercher).
     */
    @GetMapping
    public List<DossierListDTO> rechercher(
            @RequestParam(required = false) String numero,
            @RequestParam(required = false) LocalDate dateDe,
            @RequestParam(required = false) LocalDate dateA,
            @RequestParam(required = false) StatutDossier statut,
            @RequestParam(required = false) String procureur,
            @RequestParam(required = false) String jugeInstruction,
            @RequestParam(required = false) String nomPlaignant,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String instance) {

        Utilisateur utilisateurConnecte = currentUserService.getUtilisateurConnecte();
        return dossierService.rechercher(numero, dateDe, dateA, statut, procureur,
                jugeInstruction, nomPlaignant, province, instance, utilisateurConnecte);
    }

    /**
     * Detailansicht eines Dossiers (GET /api/dossiers/{id}).
     *
     * ZUGRIFFS-REGELN:
     *  - ADMIN → sieht alles (nur lesen)
     *  - FERME → alle Rollen dürfen lesen
     *  - PROCUREUR_GENERAL → nur eigene Instance
     *  - GREFFIER → nur eigene Instance
     *  - PROCUREUR → alle Dossiers seiner Instance (Access),
     *                bearbeiten nur seine eigenen (Encours, Frontend)
     *  - Andere → aktuell alle Dossiers (Voie Civile noch nicht gebaut)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Dossier> getDetail(@PathVariable Long id) {
        Utilisateur utilisateur = currentUserService.getUtilisateurConnecte();
        Dossier dossier = dossierService.getById(id);
        Role role = utilisateur.getRole();
        Stade stade = dossier.getStade();

        // ----- ADMIN sieht IMMER alles, ohne Einschränkung -----
        if (role == Role.ADMIN) {
            return ResponseEntity.ok(dossier);
        }

        // ----- FERME: ALLE Rollen dürfen das geschlossene Dossier sehen -----
        if (stade == Stade.FERME) {
            return ResponseEntity.ok(dossier);
        }

        // ----- Instance-Check für GREFFIER, PG und PROCUREUR -----
        boolean meilleureInstance = utilisateur.getInstance() != null
                && dossier.getInstance() != null
                && dossier.getInstance().getId().equals(utilisateur.getInstance().getId());

        if (role == Role.PROCUREUR_GENERAL) {
            if (!meilleureInstance) return ResponseEntity.status(403).build();
            return ResponseEntity.ok(dossier);
        }

        if (role == Role.GREFFIER) {
            if (!meilleureInstance) return ResponseEntity.status(403).build();
            return ResponseEntity.ok(dossier);
        }

        // PROCUREUR sieht ALLE Dossiers seiner Instance (Access).
        // Bearbeiten nur seine eigenen (Encours) — gesteuert im Frontend.
        if (role == Role.PROCUREUR) {
            if (!meilleureInstance) return ResponseEntity.status(403).build();
            return ResponseEntity.ok(dossier);
        }

        // Alle anderen Rollen (JUGE_INSTRUCTION, PRESIDENT_TRIBUNAL)
        // sehen aktuell alle Dossiers.
        return ResponseEntity.ok(dossier);
    }

    /**
     * Aktualisiert die Info-Felder eines Dossiers:
     * qualification, droit (classification), relaxion, detention,
     * liberteProvisoire, sansSuite, fixation.
     */
    @PutMapping("/{id}/infos")
    public Dossier mettreAJourInfos(@PathVariable Long id, @RequestBody DossierInfosRequest req) {
        return dossierService.mettreAJourInfos(id, req);
    }

    /* =================== VOIE PÉNALE =================== */

    /**
     * Klassifiziert das Dossier und schickt es weiter.
     * HINWEIS: nicht mehr im Frontend benutzt (envoyerAuPG ersetzt es).
     */
    @PostMapping("/{id}/classifier")
    public Dossier classifier(@PathVariable Long id, @RequestBody ClassifierRequest req) {
        return workflowService.classifierEtEnvoyer(id, req);
    }

    /**
     * GREFFIER: schickt die Plainte direkt an den PG.
     * Setzt droit=PENAL automatisch, classifie=false.
     */
    @PostMapping("/{id}/envoyer-pg")
    public Dossier envoyerAuPG(@PathVariable Long id) {
        return workflowService.envoyerAuPG(id);
    }

    /**
     * GREFFIER: korrigiert Plaignant/Suspect/Beschreibung.
     * Nur erlaubt solange Stade=ENREGISTRE.
     */
    @PutMapping("/{id}/plainte")
    public Dossier modifierPlainte(@PathVariable Long id, @RequestBody ModifierPlainteRequest req) {
        return workflowService.modifierPlainte(id, req);
    }

    /**
     * Liefert die Plainte-Daten zu einem Dossier.
     */
    @GetMapping("/{id}/plainte")
    public Plainte getPlainte(@PathVariable Long id) {
        return dossierService.getPlainteByDossierId(id);
    }

    /**
     * PG: weist dem Dossier einen Procureur (OMP) zu.
     * Geht direkt zu EN_INSTRUCTION_P.
     */
    @PostMapping("/{id}/assigner-procureur")
    public Dossier assignerProcureur(@PathVariable Long id, @RequestBody AssignerProcureurRequest req) {
        return workflowService.assignerProcureur(id, req);
    }

    /**
     * GREFFIER: bestätigt die Zuweisung des Procureur.
     * HINWEIS: nicht mehr erreicht (assignerProcureur geht direkt zu EN_INSTRUCTION_P).
     */
    @PostMapping("/{id}/valider-assignation-procureur")
    public Dossier validerAssignationProcureur(@PathVariable Long id) {
        return workflowService.validerAssignationProcureur(id);
    }

    /**
     * Liefert alle Notifications eines Dossiers.
     * Wird von DossierDetail.jsx benutzt um Notifications anzuzeigen
     * mit 👁️ Voir + ⬇️ Download Buttons.
     */
    @GetMapping("/{id}/notifications")
    public List<Notification> listerNotifications(@PathVariable Long id) {
        return workflowService.listerNotifications(id);
    }

    /**
     * Lädt alle Historique-Einträge eines Dossiers.
     * Neueste Einträge zuerst.
     */
    @GetMapping("/{id}/historique")
    public List<HistoriqueDossier> listerHistorique(@PathVariable Long id) {
        return historiqueDossierRepository.findByDossierIdOrderByDateActionDesc(id);
    }

    /**
     * Stellt eine Notification aus (INVITATION, MC, MA, AR).
     * MAP wird automatisch durch confirmerAutorisationMap ausgestellt.
     * Gibt die Notification zurück damit das Frontend das PDF laden kann.
     */
    @PostMapping("/{id}/notifications")
    public Notification emettreNotification(@PathVariable Long id, @RequestBody NotificationRequest req) {
        return workflowService.emettreNotification(id, req);
    }

    /**
     * Liefert das PDF einer Notification.
     * Wird benutzt für:
     *  - Direkter Download nach dem Ausstellen (DossierDetail.jsx)
     *  - 👁️ Voir im Browser → window.open(blobUrl)
     *  - ⬇️ Download auf Disk → link.download
     * Content-Disposition: inline damit der Browser das PDF anzeigen kann.
     */
    @GetMapping("/{id}/notifications/{notificationId}/pdf")
    public ResponseEntity<byte[]> telechargerNotificationPdf(
            @PathVariable Long id, @PathVariable Long notificationId) {

        Notification notification = workflowService.findNotification(notificationId);
        byte[] pdf = pdfService.genererPdfNotification(notification);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"notification_"
                + notification.getType() + "_" + notificationId + ".pdf\"");

        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    /**
     * PROCUREUR: schickt seine Décision an den PG zur Bestätigung.
     * P hat Relaxion/Détention/etc. gesetzt und wartet auf PG.
     * Solange DECISION_EN_ATTENTE kann P die Décision nicht mehr ändern.
     *
     * EN_INSTRUCTION_P -> DECISION_EN_ATTENTE
     */
    @PostMapping("/{id}/envoyer-decision")
    public Dossier envoyerDecision(@PathVariable Long id) {
        return workflowService.envoyerDecision(id);
    }

    /**
     * PG: bestätigt die Décision des Procureur (Confirmer).
     * PG ist einverstanden — Décision bleibt gesetzt, P kann weiterarbeiten.
     *
     * DECISION_EN_ATTENTE -> EN_INSTRUCTION_P (Décision bleibt)
     */
    @PostMapping("/{id}/confirmer-decision")
    public Dossier confirmerDecision(@PathVariable Long id) {
        return workflowService.confirmerDecision(id);
    }

    /**
     * PG: lehnt die Décision des Procureur ab (Annuler).
     * PG ist NICHT einverstanden — alle Décision-Felder werden zurückgesetzt.
     * P muss eine neue Décision wählen und erneut schicken.
     *
     * DECISION_EN_ATTENTE -> EN_INSTRUCTION_P (Décision zurückgesetzt)
     */
    @PostMapping("/{id}/annuler-decision")
    public Dossier annulerDecision(@PathVariable Long id) {
        return workflowService.annulerDecision(id);
    }

    /**
     * PROCUREUR: sendet eine Anfrage an den PG um die Erlaubnis
     * den MAP auszustellen. Passiert nach:
     *  - Plaignant gehört (INVITATION)
     *  - Suspect gehört (MC, MA, AR)
     *  - Décision vom PG bestätigt
     *
     * EN_INSTRUCTION_P -> DEMANDE_MAP
     */
    @PostMapping("/{id}/demander-autorisation-map")
    public Dossier demanderAutorisationMap(@PathVariable Long id) {
        return workflowService.demanderAutorisationMap(id);
    }

    /**
     * PG: bestätigt die MAP-Anfrage des Procureur.
     * MAP wird AUTOMATISCH ausgestellt — P muss nicht mehr manuell drücken.
     *
     * DEMANDE_MAP -> NOTIFICATION_MAP_P (MAP automatisch ausgestellt)
     */
    @PostMapping("/{id}/confirmer-autorisation-map")
    public Dossier confirmerAutorisationMap(@PathVariable Long id) {
        return workflowService.confirmerAutorisationMap(id);
    }

    /**
     * PG: lehnt die MAP-Anfrage des Procureur ab.
     * P muss weiter arbeiten.
     *
     * DEMANDE_MAP -> EN_INSTRUCTION_P (mapAutorise=false)
     */
    @PostMapping("/{id}/annuler-autorisation-map")
    public Dossier annulerAutorisationMap(@PathVariable Long id) {
        return workflowService.annulerAutorisationMap(id);
    }

    /**
     * PROCUREUR + PG: bestätigen gemeinsam die MAP-Notification.
     * NOTIFICATION_MAP_P -> VALIDATION_NOTIFICATION_MAP_P
     */
    @PostMapping("/{id}/valider-notification-map")
    public Dossier validerNotificationMap(@PathVariable Long id) {
        return workflowService.validerNotificationMap(id);
    }

    /**
     * PG: validiert die MAP-Notification final (Confirmer).
     * VALIDATION_NOTIFICATION_MAP_P -> MAP_VALIDE_P
     */
    @PostMapping("/{id}/valider-map")
    public Dossier validerMap(@PathVariable Long id) {
        return workflowService.validerMap(id);
    }

    /**
     * PG: lehnt die MAP-Notification ab (Annuler).
     * VALIDATION_NOTIFICATION_MAP_P -> EN_INSTRUCTION_P
     */
    @PostMapping("/{id}/annuler-map")
    public Dossier annulerMap(@PathVariable Long id) {
        return workflowService.annulerMap(id);
    }

    /**
     * GREFFIER: bestätigt das vom PG validierte MAP.
     * MAP_VALIDE_P -> MAPE
     */
    @PostMapping("/{id}/confirmer-map")
    public Dossier confirmerMap(@PathVariable Long id) {
        return workflowService.confirmerMap(id);
    }

    /* =================== VOIE CIVILE =================== */

    /**
     * ZUKÜNFTIG: Voie Civile komplett implementieren.
     */
    @PostMapping("/{id}/assigner-chambre")
    public Dossier assignerChambre(@PathVariable Long id, @RequestBody AssignerChambreRequest req) {
        return workflowService.assignerChambre(id, req);
    }

    @PostMapping("/{id}/valider-assignation-chambre")
    public Dossier validerAssignationChambre(@PathVariable Long id) {
        return workflowService.validerAssignationChambre(id);
    }

    @PostMapping("/{id}/valider-map-civil")
    public Dossier validerMapCivil(@PathVariable Long id) {
        return workflowService.validerMapCivil(id);
    }

    /* =================== GEMEINSAM =================== */

    /**
     * JUGE D'INSTRUCTION / PRÉSIDENT TRIBUNAL: fällt das Urteil
     * und schließt das Dossier (-> FERME).
     */
    @PostMapping("/{id}/condamner")
    public Dossier condamner(@PathVariable Long id, @RequestBody VerdictRequest req) {
        return workflowService.condamner(id, req);
    }

    /**
     * PG / PRÉSIDENT TRIBUNAL: öffnet ein geschlossenes Dossier wieder.
     */
    @PostMapping("/{id}/reouvrir")
    public Dossier reouvrir(@PathVariable Long id) {
        return workflowService.reouvrirDossier(id);
    }

    /**
     * PG / PRÉSIDENT TRIBUNAL: verschiebt das Dossier zu einer anderen Instance.
     */
    @PostMapping("/{id}/changer-instance")
    public Dossier changerInstance(@PathVariable Long id, @RequestBody ChangerInstanceRequest req) {
        return workflowService.changerInstance(id, req);
    }

    /**
     * PG / PRÉSIDENT TRIBUNAL: schickt das Dossier zurück zur Instance,
     * von der es zuletzt kam.
     */
    @PostMapping("/{id}/retourner-instance")
    public Dossier retournerInstance(@PathVariable Long id) {
        return workflowService.retournerInstanceEnvoi(id);
    }

    /* =================== ANNOTATIONS =================== */

    @GetMapping("/{id}/annotations")
    public List<Annotation> getAnnotations(@PathVariable Long id) {
        return annotationService.getAnnotationsVisibles(id);
    }

    @PostMapping("/{id}/annotations")
    public Annotation creerAnnotation(@PathVariable Long id, @RequestBody AnnotationRequest req) {
        return annotationService.creerAnnotation(id, req);
    }

    @DeleteMapping("/annotations/{annotationId}")
    public void supprimerAnnotation(@PathVariable Long annotationId) {
        annotationService.supprimerAnnotation(annotationId);
    }

    /* =================== PIÈCES JOINTES =================== */

    @GetMapping("/{id}/pieces")
    public List<PieceJointe> listerPieces(@PathVariable Long id) {
        return pieceJointeService.listerPieces(id);
    }

    @PostMapping("/{id}/pieces")
    public PieceJointe ajouterPiece(@PathVariable Long id,
                                    @RequestParam MultipartFile fichier,
                                    @RequestParam String genre,
                                    @RequestParam(required = false) String commentaire) throws IOException {
        return pieceJointeService.ajouterPiece(id, fichier, genre, commentaire);
    }

    @DeleteMapping("/pieces/{pieceId}")
    public void supprimerPiece(@PathVariable Long pieceId) throws IOException {
        pieceJointeService.supprimerPiece(pieceId);
    }

    /**
     * Lädt eine Pièce jointe herunter oder öffnet sie im Browser.
     * Content-Type wird automatisch erkannt (PDF, Bild etc.).
     * Content-Disposition: inline damit der Browser die Datei anzeigen kann.
     * Das Frontend entscheidet ob 👁️ Voir (window.open) oder ⬇️ Download (link.download).
     */
    @GetMapping("/pieces/{pieceId}/download")
    public ResponseEntity<byte[]> telechargerPiece(@PathVariable Long pieceId) throws IOException {
        PieceJointe piece = pieceJointeService.getPieceById(pieceId);
        Path chemin = Paths.get(piece.getChemin());
        byte[] contenu = Files.readAllBytes(chemin);

        String contentType = Files.probeContentType(chemin);
        if (contentType == null) contentType = "application/octet-stream";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + piece.getNomFichier() + "\"");

        return ResponseEntity.ok().headers(headers).body(contenu);
    }

}