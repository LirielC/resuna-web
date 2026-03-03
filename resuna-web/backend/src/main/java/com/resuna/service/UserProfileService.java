package com.resuna.service;

import com.resuna.model.UserProfile;
import com.resuna.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.Map;

@Service
public class UserProfileService {

    private static final Duration UPDATE_COOLDOWN = Duration.ofMinutes(5);

    private final UserProfileRepository repository;
    private final ConcurrentMap<String, Instant> lastUpdateCache = new ConcurrentHashMap<>();

    public UserProfileService(UserProfileRepository repository) {
        this.repository = repository;
    }

    public void recordLogin(String userId, String email, String name) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        Instant now = Instant.now();
        Instant last = lastUpdateCache.get(userId);
        if (last != null && Duration.between(last, now).compareTo(UPDATE_COOLDOWN) < 0) {
            return;
        }

        java.util.Date nowDate = java.util.Date.from(now);
        UserProfile profile = repository.findByUserId(userId)
                .orElseGet(() -> {
                    UserProfile created = new UserProfile();
                    created.setUserId(userId);
                    created.setCreatedAt(nowDate);
                    return created;
                });

        profile.setEmail(email);
        profile.setName(name);
        profile.setLastLogin(nowDate);
        repository.save(profile);
        lastUpdateCache.put(userId, now);
    }

    public Map<String, UserProfile> getAllProfiles() {
        return repository.findAll();
    }
}
