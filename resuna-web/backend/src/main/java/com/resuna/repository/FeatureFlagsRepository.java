package com.resuna.repository;

import com.resuna.model.FeatureFlags;

import java.util.Optional;

public interface FeatureFlagsRepository {
    Optional<FeatureFlags> findByUserId(String userId);
    FeatureFlags save(FeatureFlags flags);
}
