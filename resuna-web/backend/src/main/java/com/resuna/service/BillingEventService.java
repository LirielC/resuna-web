package com.resuna.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.resuna.model.BillingEvent;
import com.resuna.repository.BillingEventRepository;

@Service
public class BillingEventService {

    private final BillingEventRepository repository;

    @Value("${billing.cooldown-hours:4}")
    private int cooldownHours;

    @Value("${billing.max-purchases-per-day:3}")
    private int maxPurchasesPerDay;

    public BillingEventService(BillingEventRepository repository) {
        this.repository = repository;
    }

    public Optional<String> getPurchaseBlockReason(String userId) {
        Instant now = Instant.now();
        Optional<BillingEvent> last = repository.findLatestByUserId(userId);
        if (last.isPresent() && last.get().getCreatedAt() != null) {
            Duration sinceLast = Duration.between(last.get().getCreatedAt(), now);
            if (sinceLast.toHours() < cooldownHours) {
                return Optional.of("Purchase cooldown active");
            }
        }

        Instant since = now.minus(Duration.ofHours(24));
        long count = repository.countByUserIdSince(userId, since);
        if (count >= maxPurchasesPerDay) {
            return Optional.of("Daily purchase limit reached");
        }

        return Optional.empty();
    }

    public BillingEvent recordCreditPurchase(String userId,
                                             int credits,
                                             boolean paymentVerified,
                                             String paymentReference,
                                             String status,
                                             String ipAddress,
                                             String fingerprint,
                                             String userAgent) {
        BillingEvent event = new BillingEvent();
        event.setId(UUID.randomUUID().toString());
        event.setUserId(userId);
        event.setCredits(credits);
        event.setAmount(priceForCredits(credits));
        event.setCurrency("USD");
        event.setStatus(status);
        event.setPaymentVerified(paymentVerified);
        event.setPaymentReference(paymentReference);
        event.setIpAddress(ipAddress);
        event.setFingerprint(fingerprint);
        event.setUserAgent(userAgent);
        event.setCreatedAt(Instant.now());
        return repository.save(event);
    }

    public List<BillingEvent> getEventsForUser(String userId, int limit) {
        return repository.findByUserId(userId, limit);
    }

    public List<BillingEvent> getRecentEvents(int limit) {
        return repository.findRecent(limit);
    }

    private double priceForCredits(int credits) {
        return switch (credits) {
            case 10 -> 10.0;
            case 20 -> 15.0;
            case 30 -> 20.0;
            default -> 0.0;
        };
    }
}
