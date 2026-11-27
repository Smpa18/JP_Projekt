package com.codesoupir.justicepro.dto;

import lombok.Data;

/** Daten von der Login-Seite: "Numéro d'ordre" + "Mot de passe". */
@Data
public class LoginRequest {
    private String numeroMatricule;
    private String motDePasse;
}