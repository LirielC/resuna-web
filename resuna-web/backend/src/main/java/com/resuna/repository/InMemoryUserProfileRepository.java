package com.resuna.repository;

import com.resuna.model.UserProfile;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Profile("dev")
public class InMemoryUserProfileRepository implements UserProfileRepository {

    private final Map<String, UserProfile> storage = new ConcurrentHashMap<>();

    @Override
    public Optional<UserProfile> findByUserId(String userId) {
        return Optional.ofNullable(storage.get(userId));
    }

    @Override
    public UserProfile save(UserProfile profile) {
        storage.put(profile.getUserId(), profile);
        return profile;
    }

    @Override
    public Map<String, UserProfile> findAll() {
        return new ConcurrentHashMap<>(storage);
    }

    @Override
    public void deleteByUserId(String userId) {
        storage.remove(userId);
    }
}
