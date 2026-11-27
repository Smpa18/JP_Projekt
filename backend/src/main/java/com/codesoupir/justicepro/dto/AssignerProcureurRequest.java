package com.codesoupir.justicepro.dto;

import lombok.Data;

/** PG wählt einen Procureur für das Dossier. */
@Data
public class AssignerProcureurRequest {
    private Long procureurId;
}