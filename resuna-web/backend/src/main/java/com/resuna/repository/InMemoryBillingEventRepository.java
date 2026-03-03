package com.resuna.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import com.resuna.model.BillingEvent;

@Repository
@Profile("dev")
public class InMemoryBillingEventRepository implements BillingEventRepository {

    private final ConcurrentMap<String, BillingEvent> storage = new ConcurrentHashMap<>();

    @Override
    public BillingEvent save(BillingEvent event) {
        storage.put(event.getId(), event);
        return event;
    }

    @Override
    public List<BillingEvent> findByUserId(String userId, int limit) {
        List<BillingEvent> result = new ArrayList<>();
        for (BillingEvent event : storage.values()) {
            if (userId.equals(event.getUserId())) {
                result.add(event);
            }
        }
        result.sort(Comparator.comparing(BillingEvent::getCreatedAt).reversed());
        return result.subList(0, Math.min(limit, result.size()));
    }

    @Override
    public List<BillingEvent> findRecent(int limit) {
        List<BillingEvent> result = new ArrayList<>(storage.values());
        result.sort(Comparator.comparing(BillingEvent::getCreatedAt).reversed());
        return result.subList(0, Math.min(limit, result.size()));
    }

    @Override
    public Optional<BillingEvent> findLatestByUserId(String userId) {
        return storage.values().stream()
                .filter(event -> userId.equals(event.getUserId()))
                .max(Comparator.comparing(BillingEvent::getCreatedAt));
    }

    @Override
    public long countByUserIdSince(String userId, Instant since) {
        return storage.values().stream()
                .filter(event -> userId.equals(event.getUserId()))
                .filter(event -> event.getCreatedAt() != null && event.getCreatedAt().isAfter(since))
                .count();
    }
}
