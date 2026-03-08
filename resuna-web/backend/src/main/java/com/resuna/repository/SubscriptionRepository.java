package com.resuna.repository;

import com.resuna.model.UserSubscription;

import java.util.Map;
import java.util.Optional;

public interface SubscriptionRepository {
    Optional<UserSubscription> findByUserId(String userId);
    UserSubscription save(UserSubscription subscription);
    Map<String, UserSubscription> findAll();

    void deleteByUserId(String userId) throws Exception;
}
