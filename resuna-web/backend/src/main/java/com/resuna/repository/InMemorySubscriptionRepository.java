package com.resuna.repository;

import com.resuna.model.UserSubscription;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Profile("dev")
public class InMemorySubscriptionRepository implements SubscriptionRepository {

    private final Map<String, UserSubscription> storage = new ConcurrentHashMap<>();

    @Override
    public Optional<UserSubscription> findByUserId(String userId) {
        return Optional.ofNullable(storage.get(userId));
    }

    @Override
    public UserSubscription save(UserSubscription subscription) {
        storage.put(subscription.getUserId(), subscription);
        return subscription;
    }

    @Override
    public Map<String, UserSubscription> findAll() {
        return new ConcurrentHashMap<>(storage);
    }
}
