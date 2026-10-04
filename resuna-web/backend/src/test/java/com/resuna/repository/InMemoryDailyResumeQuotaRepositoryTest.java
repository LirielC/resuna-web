package com.resuna.repository;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;

class InMemoryDailyResumeQuotaRepositoryTest {
    private final InMemoryDailyResumeQuotaRepository repository = new InMemoryDailyResumeQuotaRepository();
    private final LocalDate today = LocalDate.of(2026, 10, 3);

    @Test
    void capsTotalResumesAtFiveAndTranslationsAtFour() {
        for (int i = 0; i < 4; i++) {
            assertEquals(DailyResumeQuotaRepository.Limit.NONE, repository.reserve("user", today, true));
        }
        assertEquals(DailyResumeQuotaRepository.Limit.TRANSLATIONS, repository.reserve("user", today, true));
        assertEquals(DailyResumeQuotaRepository.Limit.NONE, repository.reserve("user", today, false));
        assertEquals(DailyResumeQuotaRepository.Limit.RESUMES, repository.reserve("user", today, false));
    }

    @Test
    void quotaResetsOnTheNextUtcDay() {
        for (int i = 0; i < 5; i++) repository.reserve("user", today, false);
        assertEquals(DailyResumeQuotaRepository.Limit.RESUMES, repository.reserve("user", today, false));
        assertEquals(DailyResumeQuotaRepository.Limit.NONE, repository.reserve("user", today.plusDays(1), false));
    }

    @Test
    void concurrentReservationsCannotExceedFive() {
        AtomicInteger accepted = new AtomicInteger();
        IntStream.range(0, 30).parallel().forEach(i -> {
            if (repository.reserve("same-user", today, false) == DailyResumeQuotaRepository.Limit.NONE) {
                accepted.incrementAndGet();
            }
        });
        assertEquals(5, accepted.get());
    }
}
