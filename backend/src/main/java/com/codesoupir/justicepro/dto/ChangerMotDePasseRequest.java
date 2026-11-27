package com.codesoupir.justicepro.dto;

import lombok.Data;

/**
 * Formular "Mon profil -> Changer le mot de passe".
 * Der Benutzer muss sein ALTES Passwort kennen, um es zu ändern
 * (Sicherheitsmaßnahme - verhindert Missbrauch bei kurz unbeaufsichtigtem PC).
 */
@Data
public class ChangerMotDePasseRequest {
    private String ancienMotDePasse;
    private String nouveauMotDePasse;
}