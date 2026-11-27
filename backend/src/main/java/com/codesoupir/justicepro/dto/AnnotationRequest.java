package com.codesoupir.justicepro.dto;

import com.codesoupir.justicepro.enums.TypeAnnotation;
import lombok.Data;

@Data
public class AnnotationRequest {
    private String contenu;
    private TypeAnnotation type; // PUBLIQUE oder PERSONNELLE
}