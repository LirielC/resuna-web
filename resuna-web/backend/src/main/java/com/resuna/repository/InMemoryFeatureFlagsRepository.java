package com.resuna.repository;

import com.resuna.model.FeatureFlags;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
@Profile("dev")
public class InMemoryFeatureFlagsRepository implements FeatureFlagsRepository {

    private final ConcurrentMap<String, FeatureFlags> storage = new ConcurrentHashMap<>();

    @Override
    public Optional<FeatureFlags> findByUserId(String userId) {
        return Optional.ofNullable(storage.get(userId));
    }

    @Override
    public FeatureFlags save(FeatureFlags flags) {
        storage.put(flags.getUserId(), flags);
        return flags;
    }
}
