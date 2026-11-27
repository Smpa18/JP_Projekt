package com.codesoupir.justicepro.controller;

import com.codesoupir.justicepro.dto.ChangerMotDePasseRequest;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.service.CurrentUserService;
import com.codesoupir.justicepro.service.ProfilService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Verwaltung des EIGENEN Profils - für ALLE eingeloggten Benutzer
 * erreichbar (keine besondere Rolle nötig).
 */
@RestController
@RequestMapping("/api/profil")
@RequiredArgsConstructor
public class ProfilController {

    private final ProfilService profilService;
    private final CurrentUserService currentUserService;

    /** Gibt die Daten des eingeloggten Benutzers zurück (z.B. für "Mon profil"). */
    @GetMapping("/moi")
    public Utilisateur getMonProfil() {
        return currentUserService.getUtilisateurConnecte();
    }

    /** Ändert das EIGENE Passwort (altes Passwort muss bekannt sein). */
    @PutMapping("/mot-de-passe")
    public void changerMotDePasse(@RequestBody ChangerMotDePasseRequest req) {
        profilService.changerMotDePasse(req);
    }
}