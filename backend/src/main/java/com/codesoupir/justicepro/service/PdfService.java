package com.codesoupir.justicepro.service;

import com.codesoupir.justicepro.model.Dossier;
import com.codesoupir.justicepro.model.Notification;
import com.codesoupir.justicepro.model.Plainte;
import com.codesoupir.justicepro.model.Suspect;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

/**
 * Erstellt offizielle PDF-Dokumente für JusticePro:
 *  - Récépissé de plainte (Beweis-Beleg beim Einreichen einer Plainte)
 *  - Notification (Invitation, MC, MA, AR, MAP) - der offizielle
 *    "Papier-Beleg", den der Procureur/Juge erstellt, sobald er
 *    eine dieser Anordnungen ausstellt.
 *
 * Nutzt OpenPDF (kostenlose, LGPL/MPL-lizenzierte Bibliothek -
 * funktioniert komplett OFFLINE, kein Internet nötig).
 *
 * ÄNDERUNGEN:
 *  - Suspect (einzeln) → Suspects (Liste, mehrere möglich)
 */
@Service
public class PdfService {

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy");

    /* ============================================================
     *  RÉCÉPISSÉ DE PLAINTE
     * ============================================================ */

    /**
     * Erzeugt den offiziellen Récépissé-Beleg für eine neu eingereichte Plainte.
     * Enthält: Plaignant, alle Suspects, Greffier, Dossier-Nummer, Datum.
     * Wird beim Erstellen einer Plainte automatisch generiert.
     */
    public byte[] genererRecepissePlainte(Plainte plainte) {
        try {
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);

            document.open();

            // ----- Kopfzeile -----
            Font titreFont = new Font(Font.HELVETICA, 18, Font.BOLD);
            Paragraph titre = new Paragraph("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", titreFont);
            titre.setAlignment(Element.ALIGN_CENTER);
            document.add(titre);

            Font sousTitreFont = new Font(Font.HELVETICA, 12, Font.NORMAL);
            Paragraph justice = new Paragraph("JUSTICE - PAIX - TRAVAIL", sousTitreFont);
            justice.setAlignment(Element.ALIGN_CENTER);
            justice.setSpacingAfter(20);
            document.add(justice);

            Font docTitreFont = new Font(Font.HELVETICA, 16, Font.BOLD);
            Paragraph docTitre = new Paragraph("RÉCÉPISSÉ DE PLAINTE", docTitreFont);
            docTitre.setAlignment(Element.ALIGN_CENTER);
            docTitre.setSpacingAfter(30);
            document.add(docTitre);

            // ----- Institution -----
            Font normalFont = new Font(Font.HELVETICA, 11, Font.NORMAL);
            Font boldFont = new Font(Font.HELVETICA, 11, Font.BOLD);

            if (plainte.getInstitution() != null) {
                document.add(new Paragraph("Institution : " + plainte.getInstitution(), normalFont));
            }
            document.add(new Paragraph(" "));

            // ----- Wichtigste Beweis-Informationen -----
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingBefore(10);
            infoTable.setSpacingAfter(20);

            ajouterLigne(infoTable, "Numéro de la plainte :", plainte.getNumero(), boldFont, boldFont);
            ajouterLigne(infoTable, "Date d'enregistrement :",
                    plainte.getDatePlainte() != null ? plainte.getDatePlainte().format(DATE_FORMAT) : "-",
                    boldFont, normalFont);

            if (plainte.getDossier() != null) {
                ajouterLigne(infoTable, "Numéro du dossier :",
                        plainte.getDossier().getNumeroDossier(), boldFont, boldFont);
            }
            if (plainte.getGreffier() != null) {
                ajouterLigne(infoTable, "Greffier :",
                        plainte.getGreffier().getNom() + " " + plainte.getGreffier().getPrenom(),
                        boldFont, normalFont);
            }

            document.add(infoTable);

            // ----- Plaignant -----
            if (plainte.getPlaignant() != null) {
                document.add(new Paragraph("Plaignant", boldFont));
                document.add(new Paragraph(
                        plainte.getPlaignant().getNom() + " " +
                                plainte.getPlaignant().getPostNom() + " " +
                                plainte.getPlaignant().getPrenom(), normalFont));
                document.add(new Paragraph(" "));
            }

            // ----- Suspects (Liste - mehrere möglich) -----
            // Früher: einzelner Suspect (getSuspect()).
            // Jetzt: Liste von Suspects (getSuspects()).
            // Alle Suspects werden einzeln im PDF aufgelistet.
            if (plainte.getSuspects() != null && !plainte.getSuspects().isEmpty()) {
                document.add(new Paragraph(
                        plainte.getSuspects().size() == 1 ? "Suspect" : "Suspects",
                        boldFont));
                for (Suspect s : plainte.getSuspects()) {
                    document.add(new Paragraph(
                            s.getNom() + " " + s.getPostNom() + " " + s.getPrenom(),
                            normalFont));
                }
                document.add(new Paragraph(" "));
            }

            // ----- Hinweistext (rechtlicher Wert des Dokuments) -----
            document.add(new Paragraph(" "));
            Font italicFont = new Font(Font.HELVETICA, 10, Font.ITALIC);
            // ----- Description de la plainte -----
            if (plainte.getDescriptionPlainte() != null && !plainte.getDescriptionPlainte().isBlank()) {
                document.add(new Paragraph("Description de la plainte", boldFont));
                document.add(new Paragraph(plainte.getDescriptionPlainte(), normalFont));
                document.add(new Paragraph(" "));
            }
            Paragraph note = new Paragraph(
                    "Ce récépissé fait foi du dépôt de la présente plainte à la date indiquée ci-dessus. " +
                            "Veuillez le conserver précieusement, il pourra vous être demandé pour le suivi de votre dossier.",
                    italicFont);
            note.setSpacingBefore(30);
            document.add(note);

            document.close();
            return out.toByteArray();

        } catch (DocumentException e) {
            throw new RuntimeException("Erreur lors de la génération du PDF : " + e.getMessage(), e);
        }
    }

    /* ============================================================
     *  NOTIFICATION - Invitation, MC, MA, AR, MAP
     * ============================================================ */

    /**
     * Erzeugt ein offizielles PDF-Dokument für eine ausgestellte Notification.
     * Wird IMMER aufgerufen, sobald der Procureur oder Juge d'instruction
     * eine Invitation/MC/MA/AR/MAP ausstellt, damit jede dieser Aktionen
     * einen "Papier-Beleg" als PDF hat.
     */
    public byte[] genererPdfNotification(Notification notification) {
        try {
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);

            document.open();

            // ----- Kopfzeile -----
            Font titreFont = new Font(Font.HELVETICA, 18, Font.BOLD);
            Paragraph titre = new Paragraph("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", titreFont);
            titre.setAlignment(Element.ALIGN_CENTER);
            document.add(titre);

            Font sousTitreFont = new Font(Font.HELVETICA, 12, Font.NORMAL);
            Paragraph justice = new Paragraph("JUSTICE - PAIX - TRAVAIL", sousTitreFont);
            justice.setAlignment(Element.ALIGN_CENTER);
            justice.setSpacingAfter(20);
            document.add(justice);

            // ----- Titel je nach Notification-Typ -----
            String titreDocument = switch (notification.getType()) {
                case INVITATION -> "INVITATION DU PLAIGNANT";
                case MC -> "MISE EN CAUSE";
                case MA -> "MANDAT D'AMENER";
                case AR -> "AVIS DE RECHERCHE";
                case MAP -> "MANDAT D'ARRÊT PROVISOIRE";
            };

            Font docTitreFont = new Font(Font.HELVETICA, 16, Font.BOLD);
            Paragraph docTitre = new Paragraph(titreDocument, docTitreFont);
            docTitre.setAlignment(Element.ALIGN_CENTER);
            docTitre.setSpacingAfter(30);
            document.add(docTitre);

            // ----- Informationen zur Notification -----
            Font normalFont = new Font(Font.HELVETICA, 11, Font.NORMAL);
            Font boldFont = new Font(Font.HELVETICA, 11, Font.BOLD);

            Dossier dossier = notification.getDossier();

            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingBefore(10);
            infoTable.setSpacingAfter(20);

            if (dossier != null) {
                ajouterLigne(infoTable, "Numéro du dossier :",
                        dossier.getNumeroDossier(), boldFont, boldFont);
            }
            ajouterLigne(infoTable, "Date d'émission :",
                    notification.getDateEmission() != null
                            ? notification.getDateEmission().format(DATE_FORMAT) : "-",
                    boldFont, normalFont);

            if (notification.getEmisPar() != null) {
                ajouterLigne(infoTable, "Émis par :",
                        notification.getEmisPar().getNom() + " " +
                                notification.getEmisPar().getPrenom(),
                        boldFont, normalFont);
            }

            if (notification.getLieu() != null && !notification.getLieu().isBlank()) {
                ajouterLigne(infoTable, "Lieu :", notification.getLieu(), boldFont, normalFont);
            }

            document.add(infoTable);

            // ----- Hinweistext -----
            Font italicFont = new Font(Font.HELVETICA, 10, Font.ITALIC);
            Paragraph note = new Paragraph(
                    "Le présent document fait foi de l'émission de l'acte ci-dessus mentionné " +
                            "à la date indiquée.",
                    italicFont);
            note.setSpacingBefore(20);
            document.add(note);

            // ----- Unterschriftsbereich -----
            Paragraph signature = new Paragraph(
                    "\n\nSignature : _________________________", normalFont);
            signature.setSpacingBefore(40);
            document.add(signature);

            document.close();
            return out.toByteArray();

        } catch (DocumentException e) {
            throw new RuntimeException("Erreur lors de la génération du PDF : " + e.getMessage(), e);
        }
    }

    /**
     * Hilfsmethode: fügt eine Zeile "Label | Wert" zur Tabelle hinzu.
     * Wird benutzt um die Informationstabellen im PDF zu befüllen.
     */
    private void ajouterLigne(PdfPTable table, String label, String valeur,
                              Font labelFont, Font valeurFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(labelCell);

        PdfPCell valeurCell = new PdfPCell(new Phrase(valeur != null ? valeur : "-", valeurFont));
        valeurCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(valeurCell);
    }
}