package com.resuna.repository;

import com.resuna.model.Resume;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * In-memory resume repository for development/testing.
 * Replaces Firestore-based repository in dev profile.
 */
@Repository
@Profile("dev")
public class InMemoryResumeRepository {

    private final Map<String, Resume> storage = new ConcurrentHashMap<>();

    public List<Resume> findAllByUserId(String userId) {
        return storage.values().stream()
                .filter(r -> userId.equals(r.getUserId()))
                .sorted((a, b) -> {
                    Instant aTime = a.getUpdatedAt() != null ? a.getUpdatedAt() : Instant.EPOCH;
                    Instant bTime = b.getUpdatedAt() != null ? b.getUpdatedAt() : Instant.EPOCH;
                    return bTime.compareTo(aTime);
                })
                .collect(Collectors.toList());
    }

    public Optional<Resume> findById(String id) {
        return Optional.ofNullable(storage.get(id));
    }

    public Resume save(Resume resume) {
        if (resume.getId() == null || resume.getId().isEmpty()) {
            resume.setId(UUID.randomUUID().toString());
            resume.setCreatedAt(Instant.now());
        }
        resume.setUpdatedAt(Instant.now());
        storage.put(resume.getId(), resume);
        return resume;
    }

    public void deleteById(String id) {
        storage.remove(id);
    }

    public boolean existsByIdAndUserId(String id, String userId) {
        Resume resume = storage.get(id);
        return resume != null && userId.equals(resume.getUserId());
    }
}
