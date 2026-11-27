package com.codesoupir.justicepro.controller;

import com.codesoupir.justicepro.dto.PlainteCreateRequest;
import com.codesoupir.justicepro.model.Plainte;
import com.codesoupir.justicepro.service.PdfService;
import com.codesoupir.justicepro.service.PlainteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Seite "Plainte" - Knopf "Enregistrer la plainte" + PDF-Beleg. */
@RestController
@RequestMapping("/api/plaintes")
@RequiredArgsConstructor
public class PlainteController {

    private final PlainteService plainteService;
    private final PdfService pdfService;

    // ADMIN ist hier nur zum TESTEN erlaubt - später entfernen!
    @PostMapping
    @PreAuthorize("hasAnyRole('GREFFIER', 'ADMIN')")
    public Plainte enregistrer(@RequestBody PlainteCreateRequest request) {
        return plainteService.enregistrerPlainte(request);
    }

    /**
     * Lädt den PDF-Beleg ("Récépissé de plainte") herunter.
     * Dieses PDF dient dem Plaignant als BEWEIS, dass er eine
     * Anzeige erstattet hat (mit Datum + Dossier-Nummer).
     */
    @GetMapping("/{id}/recepisse")
    public ResponseEntity<byte[]> telechargerRecepisse(@PathVariable Long id) {
        Plainte plainte = plainteService.getById(id);
        byte[] pdf = pdfService.genererRecepissePlainte(plainte);

        return ResponseEntity.ok()
                // "attachment" -> der Browser bietet einen Download an
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=recepisse_" + plainte.getNumero() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}