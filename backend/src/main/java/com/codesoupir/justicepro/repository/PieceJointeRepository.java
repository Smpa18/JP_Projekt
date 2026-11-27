package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.PieceJointe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PieceJointeRepository extends JpaRepository<PieceJointe, Long> {
    List<PieceJointe> findByDossierId(Long dossierId);
}