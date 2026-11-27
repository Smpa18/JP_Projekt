package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.Verdict;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VerdictRepository extends JpaRepository<Verdict, Long> {
    Optional<Verdict> findByDossierId(Long dossierId);
}