package com.resuna.repository;

import com.resuna.model.UsageAggregate;

import java.util.List;
import java.util.Optional;

public interface UsageAggregateRepository {
    Optional<UsageAggregate> findById(String id);
    UsageAggregate save(UsageAggregate aggregate);
    List<UsageAggregate> findByPeriodTypeSince(String periodType, String sinceKey);
}
