package com.codesoupir.justicepro.dto;

import lombok.Data;

/** Dossier wird an eine andere Instance (Gericht) übergeben. */
@Data
public class ChangerInstanceRequest {
    private Long nouvelleInstanceId;
}