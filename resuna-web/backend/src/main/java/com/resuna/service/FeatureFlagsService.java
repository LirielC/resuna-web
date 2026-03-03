package com.resuna.service;

import com.resuna.model.FeatureFlags;
import com.resuna.repository.FeatureFlagsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class FeatureFlagsService {

    private static final Logger logger = LoggerFactory.getLogger(FeatureFlagsService.class);

    private final FeatureFlagsRepository repository;

    public FeatureFlagsService(FeatureFlagsRepository repository) {
        this.repository = repository;
    }

    public FeatureFlags getFlags(String userId) {
        return repository.findByUserId(userId).orElseGet(() -> defaultFlags(userId));
    }

    public FeatureFlags setFlags(String userId, boolean aiEnabled, boolean atsEnabled) {
        FeatureFlags flags = new FeatureFlags();
        flags.setUserId(userId);
        flags.setAiEnabled(aiEnabled);
        flags.setAtsEnabled(atsEnabled);
        return repository.save(flags);
    }

    private FeatureFlags defaultFlags(String userId) {
        FeatureFlags flags = new FeatureFlags();
        flags.setUserId(userId);
        flags.setAiEnabled(true);
        flags.setAtsEnabled(true);
        try {
            return repository.save(flags);
        } catch (Exception e) {
            logger.warn("Could not persist default feature flags for user {}: {}", userId, e.getMessage());
            return flags;
        }
    }
}
