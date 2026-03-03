package com.resuna.repository;

import com.resuna.model.InitialCreditsCounter;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Profile("dev")
public class InMemoryInitialCreditsCounterRepository implements InitialCreditsCounterRepository {

    private final Map<String, InitialCreditsCounter> storage = new ConcurrentHashMap<>();

    @Override
    public Optional<InitialCreditsCounter> find(String type, String key) {
        return Optional.ofNullable(storage.get(counterId(type, key)));
    }

    @Override
    public InitialCreditsCounter save(InitialCreditsCounter counter) {
        storage.put(counterId(counter.getType(), counter.getKey()), counter);
        return counter;
    }

    private String counterId(String type, String key) {
        return type + "__" + key;
    }
}
