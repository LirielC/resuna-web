package com.resuna.repository;

import java.time.LocalDate;

public interface DailyResumeQuotaRepository {
    Limit reserve(String userId, LocalDate day, boolean translated);
    void deleteByUserId(String userId);

    enum Limit {
        NONE,
        RESUMES,
        TRANSLATIONS
    }
}
