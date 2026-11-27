package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByDossierId(Long dossierId);
}