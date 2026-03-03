package com.resuna.service;

import com.resuna.model.UsageAggregate;
import com.resuna.repository.UsageAggregateRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.WeekFields;
import java.util.Locale;
import java.util.Map;

@Service
public class UsageAggregateService {

    private final UsageAggregateRepository repository;

    public UsageAggregateService(UsageAggregateRepository repository) {
        this.repository = repository;
    }

    public void increment(String action) {
        incrementForUser(null, action);
    }

    public void incrementForUser(String userId, String action) {
        String dailyKey = LocalDate.now(ZoneOffset.UTC).toString();
        String weeklyKey = weekKey();
        incrementPeriod("day", dailyKey, action, userId);
        incrementPeriod("week", weeklyKey, action, userId);
    }

    private void incrementPeriod(String periodType, String periodKey, String action, String userId) {
        String id = userId == null
                ? periodType + "__" + periodKey
                : userId + "__" + periodType + "__" + periodKey;
        UsageAggregate aggregate = repository.findById(id)
                .orElseGet(() -> {
                    UsageAggregate created = new UsageAggregate();
                    created.setId(id);
                    created.setPeriodType(periodType);
                    created.setPeriodKey(periodKey);
                    created.setUserId(userId);
                    created.setTotalRequests(0);
                    return created;
                });

        Map<String, Long> counts = aggregate.getActionCounts();
        counts.put(action, counts.getOrDefault(action, 0L) + 1L);
        aggregate.setTotalRequests(aggregate.getTotalRequests() + 1);
        aggregate.setUpdatedAt(Instant.now());
        repository.save(aggregate);
    }

    public Iterable<UsageAggregate> getAggregates(String periodType, String sinceKey) {
        return repository.findByPeriodTypeSince(periodType, sinceKey);
    }

    private String weekKey() {
        LocalDate now = LocalDate.now(ZoneOffset.UTC);
        WeekFields weekFields = WeekFields.of(Locale.US);
        int week = now.get(weekFields.weekOfWeekBasedYear());
        int year = now.get(weekFields.weekBasedYear());
        return String.format("%d-W%02d", year, week);
    }
}
