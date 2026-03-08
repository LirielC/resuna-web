package com.resuna.repository;

import com.resuna.model.UserProfile;

import java.util.Map;
import java.util.Optional;

public interface UserProfileRepository {
    Optional<UserProfile> findByUserId(String userId);
    UserProfile save(UserProfile profile);
    Map<String, UserProfile> findAll();

    void deleteByUserId(String userId) throws Exception;
}
