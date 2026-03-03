package com.resuna.repository;

import com.resuna.model.InitialCreditsCounter;

import java.util.Optional;

public interface InitialCreditsCounterRepository {
    Optional<InitialCreditsCounter> find(String type, String key);
    InitialCreditsCounter save(InitialCreditsCounter counter);
}
