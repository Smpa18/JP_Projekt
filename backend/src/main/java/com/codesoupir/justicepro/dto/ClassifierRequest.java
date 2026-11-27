package com.codesoupir.justicepro.dto;

import com.codesoupir.justicepro.enums.TypeDroit;
import lombok.Data;

/** Aktion "Classifier" - Greffier entscheidet Pénal oder Civil. */
@Data
public class ClassifierRequest {
    private TypeDroit droit;
}