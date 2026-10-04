package com.resuna.service;

import com.resuna.repository.DailyResumeQuotaRepository;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.time.LocalDate;

@Service
public class DailyResumeQuotaService {
    private final DailyResumeQuotaRepository repository;

    public DailyResumeQuotaService(DailyResumeQuotaRepository repository) {
        this.repository = repository;
    }

    public DailyResumeQuotaRepository.Limit reserve(String userId, boolean translated) {
        return repository.reserve(userId, LocalDate.now(ZoneOffset.UTC), translated);
    }

    public void deleteForUser(String userId) {
        repository.deleteByUserId(userId);
    }

}
