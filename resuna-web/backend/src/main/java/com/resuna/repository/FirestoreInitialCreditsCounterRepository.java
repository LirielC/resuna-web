package com.resuna.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.resuna.model.InitialCreditsCounter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
@Profile("!dev")
public class FirestoreInitialCreditsCounterRepository implements InitialCreditsCounterRepository {

    private static final Logger logger = LoggerFactory.getLogger(FirestoreInitialCreditsCounterRepository.class);
    private static final String COLLECTION_NAME = "initial_credits_counters";

    private final Firestore firestore;

    public FirestoreInitialCreditsCounterRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public Optional<InitialCreditsCounter> find(String type, String key) {
        try {
            DocumentSnapshot doc = firestore.collection(COLLECTION_NAME).document(counterId(type, key)).get().get();
            if (!doc.exists()) {
                return Optional.empty();
            }
            try {
                return Optional.ofNullable(doc.toObject(InitialCreditsCounter.class));
            } catch (RuntimeException e) {
                logger.warn("Failed to deserialize InitialCreditsCounter ({}__{}): {}", type, key, e.getMessage());
                return Optional.empty();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (ExecutionException e) {
            logger.error("Error loading initial credits counter", e);
            return Optional.empty();
        }
    }

    @Override
    public InitialCreditsCounter save(InitialCreditsCounter counter) {
        try {
            ApiFuture<WriteResult> result = firestore
                    .collection(COLLECTION_NAME)
                    .document(counterId(counter.getType(), counter.getKey()))
                    .set(counter);
            result.get();
            return counter;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to save counter", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to save counter", e);
        }
    }

    private String counterId(String type, String key) {
        return type + "__" + key;
    }
}
