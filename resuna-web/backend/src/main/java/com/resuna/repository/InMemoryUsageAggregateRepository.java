package com.resuna.repository;

import com.resuna.model.UsageAggregate;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
@Profile("dev")
public class InMemoryUsageAggregateRepository implements UsageAggregateRepository {

    private final ConcurrentMap<String, UsageAggregate> storage = new ConcurrentHashMap<>();

    @Override
    public Optional<UsageAggregate> findById(String id) {
        return Optional.ofNullable(storage.get(id));
    }

    @Override
    public UsageAggregate save(UsageAggregate aggregate) {
        storage.put(aggregate.getId(), aggregate);
        return aggregate;
    }

    @Override
    public List<UsageAggregate> findByPeriodTypeSince(String periodType, String sinceKey) {
        List<UsageAggregate> result = new ArrayList<>();
        for (UsageAggregate aggregate : storage.values()) {
            if (periodType.equals(aggregate.getPeriodType())
                    && aggregate.getPeriodKey().compareTo(sinceKey) >= 0) {
                result.add(aggregate);
            }
        }
        result.sort((a, b) -> a.getPeriodKey().compareTo(b.getPeriodKey()));
        return result;
    }
}
