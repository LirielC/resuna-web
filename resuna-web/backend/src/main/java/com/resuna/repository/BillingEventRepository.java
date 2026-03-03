package com.resuna.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.resuna.model.BillingEvent;

public interface BillingEventRepository {
    BillingEvent save(BillingEvent event);
    List<BillingEvent> findByUserId(String userId, int limit);
    List<BillingEvent> findRecent(int limit);
    Optional<BillingEvent> findLatestByUserId(String userId);
    long countByUserIdSince(String userId, Instant since);
}
