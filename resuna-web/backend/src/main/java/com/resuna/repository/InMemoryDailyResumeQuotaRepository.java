package com.resuna.repository;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
@Profile("dev")
public class InMemoryDailyResumeQuotaRepository implements DailyResumeQuotaRepository {
    private static final int MAX_RESUMES = 5;
    private static final int MAX_TRANSLATIONS = 4;
    private final ConcurrentMap<String, Counter> counters = new ConcurrentHashMap<>();

    @Override
    public Limit reserve(String userId, LocalDate day, boolean translated) {
        Counter counter = counters.computeIfAbsent(userId, ignored -> new Counter());
        synchronized (counter) {
            counter.resetFor(day);
            if (counter.resumes >= MAX_RESUMES) return Limit.RESUMES;
            if (translated && counter.translations >= MAX_TRANSLATIONS) return Limit.TRANSLATIONS;
            counter.resumes++;
            if (translated) counter.translations++;
            return Limit.NONE;
        }
    }

    @Override
    public void deleteByUserId(String userId) {
        counters.remove(userId);
    }

    private static final class Counter {
        private LocalDate day;
        private int resumes;
        private int translations;

        private void resetFor(LocalDate today) {
            if (!today.equals(day)) {
                day = today;
                resumes = 0;
                translations = 0;
            }
        }
    }
}
