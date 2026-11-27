package com.codesoupir.justicepro.dto;

import lombok.Data;

/** Président Tribunal weist eine Chambre + Juge d'instruction zu. */
@Data
public class AssignerChambreRequest {
    private String chambre;          // z.B. "Chambre 1"
    private Long jugeInstructionId;  // z.B. Emile, Alphonse, Andre
}