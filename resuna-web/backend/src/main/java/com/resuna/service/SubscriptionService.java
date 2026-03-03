package com.resuna.service;

import com.resuna.model.InitialCreditsCounter;
import com.resuna.model.UserSubscription;
import com.resuna.repository.InitialCreditsCounterRepository;
import com.resuna.repository.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing user subscriptions and credits.
 */
@Service
public class SubscriptionService {
    
    private final Map<String, UserSubscription> subscriptionsCache = new ConcurrentHashMap<>();
    private final Set<String> initialCreditAccounts = ConcurrentHashMap.newKeySet();
    private final Map<String, Boolean> initialCreditAccountGrants = new ConcurrentHashMap<>();
    private final Map<String, InitialCreditsCounter> initialCreditIpCounters = new ConcurrentHashMap<>();
    private final Map<String, InitialCreditsCounter> initialCreditFingerprintCounters = new ConcurrentHashMap<>();
    private final SubscriptionRepository repository;
    private final InitialCreditsCounterRepository counterRepository;

    @Value("${initial-credits.amount:5}")
    private int initialCreditsAmount;

    @Value("${initial-credits.max-per-ip-per-day:3}")
    private int maxInitialCreditsPerIpPerDay;

    @Value("${initial-credits.max-per-fingerprint-per-day:1}")
    private int maxInitialCreditsPerFingerprintPerDay;

    @Value("${initial-credits.require-fingerprint:true}")
    private boolean requireFingerprint;

    @Value("${initial-credits.counter-ttl-days:3}")
    private int counterTtlDays;

    @Value("${initial-credits.account-ttl-days:3650}")
    private int accountTtlDays;
    
    public SubscriptionService(SubscriptionRepository repository,
                               InitialCreditsCounterRepository counterRepository) {
        this.repository = repository;
        this.counterRepository = counterRepository;
    }

    public UserSubscription getUserSubscription(String userId) {
        return subscriptionsCache.computeIfAbsent(userId, this::loadOrCreateSubscription);
    }

    public UserSubscription getUserSubscription(String userId, String userEmail, String ipAddress, String fingerprint) {
        return subscriptionsCache.computeIfAbsent(userId,
                id -> loadOrCreateSubscription(id, userEmail, ipAddress, fingerprint));
    }
    
    public boolean hasPremiumAccess(String userId) {
        UserSubscription subscription = getUserSubscription(userId);
        return subscription.hasPremiumAccess();
    }
    
    public boolean canUseAIFeatures(String userId) {
        UserSubscription subscription = getUserSubscription(userId);
        return subscription.canUseAIFeatures();
    }

    public boolean canUseAIFeatures(String userId, String userEmail, String ipAddress, String fingerprint) {
        UserSubscription subscription = getUserSubscription(userId, userEmail, ipAddress, fingerprint);
        return subscription.canUseAIFeatures();
    }
    
    public boolean consumeCredits(String userId, int amount) {
        UserSubscription subscription = getUserSubscription(userId);
        synchronized (subscription) {
            boolean success = subscription.consumeCredits(amount);
            if (success) {
                repository.save(subscription);
                subscriptionsCache.put(userId, subscription);
            }
            return success;
        }
    }

    public boolean consumeCredits(String userId, int amount, String userEmail, String ipAddress, String fingerprint) {
        UserSubscription subscription = getUserSubscription(userId, userEmail, ipAddress, fingerprint);
        synchronized (subscription) {
            boolean success = subscription.consumeCredits(amount);
            if (success) {
                repository.save(subscription);
                subscriptionsCache.put(userId, subscription);
            }
            return success;
        }
    }
    
    public void addCredits(String userId, int amount) {
        UserSubscription subscription = getUserSubscription(userId);
        subscription.setCreditsRemaining(subscription.getCreditsRemaining() + amount);
        repository.save(subscription);
        subscriptionsCache.put(userId, subscription);
    }

    public void addPurchasedCredits(String userId, int credits, String userEmail, String ipAddress, String fingerprint) {
        validateCreditPurchase(credits);
        UserSubscription subscription = getUserSubscription(userId, userEmail, ipAddress, fingerprint);
        subscription.setCreditsRemaining(subscription.getCreditsRemaining() + credits);
        repository.save(subscription);
        subscriptionsCache.put(userId, subscription);
    }
    
    public void activatePremium(String userId, UserSubscription.SubscriptionTier tier) {
        UserSubscription subscription = getUserSubscription(userId);
        subscription.setStatus(UserSubscription.SubscriptionStatus.ACTIVE);
        subscription.setTier(tier);
        subscription.setSubscriptionStart(java.util.Date.from(Instant.now()));

        if (tier == UserSubscription.SubscriptionTier.PREMIUM_MONTHLY) {
            subscription.setSubscriptionEnd(java.util.Date.from(Instant.now().plus(30, ChronoUnit.DAYS)));
        } else if (tier == UserSubscription.SubscriptionTier.PREMIUM_YEARLY) {
            subscription.setSubscriptionEnd(java.util.Date.from(Instant.now().plus(365, ChronoUnit.DAYS)));
        }
        
        repository.save(subscription);
        subscriptionsCache.put(userId, subscription);
    }
    
    public void cancelSubscription(String userId) {
        UserSubscription subscription = getUserSubscription(userId);
        subscription.setStatus(UserSubscription.SubscriptionStatus.CANCELED);
        repository.save(subscription);
        subscriptionsCache.put(userId, subscription);
    }

    public Map<String, UserSubscription> getAllSubscriptionsSnapshot() {
        return repository.findAll();
    }
    
    private UserSubscription createDefaultSubscription(String userId) {
        return createDefaultSubscription(userId, null, null, null);
    }

    private UserSubscription createDefaultSubscription(
            String userId,
            String userEmail,
            String ipAddress,
            String fingerprint) {
        Instant now = Instant.now();
        Instant trialEnd = now.plus(3, ChronoUnit.DAYS);

        String accountKey = (userEmail != null && !userEmail.isBlank())
                ? userEmail.toLowerCase(Locale.ROOT)
                : userId;
        String ipKey = ipAddress != null && !ipAddress.isBlank() ? ipAddress : null;
        String fingerprintKey = fingerprint != null && !fingerprint.isBlank() ? fingerprint : null;

        boolean accountEligible = isAccountEligible(accountKey);
        boolean ipEligible = ipKey != null
                && underDailyLimit(initialCreditIpCounters, "ip", ipKey, maxInitialCreditsPerIpPerDay);
        boolean fingerprintEligible = !requireFingerprint
                || (fingerprintKey != null
                    && underDailyLimit(initialCreditFingerprintCounters, "fp", fingerprintKey,
                    maxInitialCreditsPerFingerprintPerDay));

        int initialCredits = (accountEligible && ipEligible && fingerprintEligible)
                ? initialCreditsAmount
                : 0;

        markAccountGranted(accountKey, initialCredits > 0);
        if (ipKey != null && initialCredits > 0) {
            incrementDailyCounter(initialCreditIpCounters, "ip", ipKey);
        }
        if (fingerprintKey != null && initialCredits > 0) {
            incrementDailyCounter(initialCreditFingerprintCounters, "fp", fingerprintKey);
        }
        
        UserSubscription subscription = new UserSubscription();
        subscription.setUserId(userId);
        subscription.setStatus(UserSubscription.SubscriptionStatus.TRIAL);
        subscription.setTier(UserSubscription.SubscriptionTier.FREE);
        subscription.setCreditsRemaining(initialCredits);
        subscription.setCreditsUsed(0);
        subscription.setSubscriptionStart(java.util.Date.from(now));
        subscription.setTrialEndsAt(java.util.Date.from(trialEnd));
        subscription.setDailyLimit(initialCreditsAmount);
        subscription.setResetTime(calculateNextResetTime());
        return subscription;
    }

    private java.util.Date calculateNextResetTime() {
        // Calculate next midnight UTC
        LocalDate tomorrow = LocalDate.now(ZoneOffset.UTC).plusDays(1);
        return java.util.Date.from(tomorrow.atStartOfDay(ZoneOffset.UTC).toInstant());
    }

    private UserSubscription loadOrCreateSubscription(String userId) {
        return loadOrCreateSubscription(userId, null, null, null);
    }

    private UserSubscription loadOrCreateSubscription(
            String userId,
            String userEmail,
            String ipAddress,
            String fingerprint) {
        return repository.findByUserId(userId)
                .map(existing -> existing) // computeIfAbsent já adiciona ao cache
                .orElseGet(() -> {
                    UserSubscription created = createDefaultSubscription(userId, userEmail, ipAddress, fingerprint);
                    repository.save(created);
                    // computeIfAbsent já adiciona ao cache
                    return created;
                });
    }

    private void validateCreditPurchase(int credits) {
        if (credits != 10 && credits != 20 && credits != 30) {
            throw new IllegalArgumentException("Invalid credit package size");
        }
    }

    private boolean underDailyLimit(
            Map<String, InitialCreditsCounter> cache,
            String type,
            String key,
            int maxPerDay) {
        InitialCreditsCounter counter = loadCounter(cache, type, key);
        synchronized (counter) {
            String today = LocalDate.now(ZoneOffset.UTC).toString();
            if (!today.equals(counter.getDay())) {
                counter.setDay(today);
                counter.setCount(0);
            }
            return counter.getCount() < maxPerDay;
        }
    }

    private void incrementDailyCounter(
            Map<String, InitialCreditsCounter> cache,
            String type,
            String key) {
        InitialCreditsCounter counter = loadCounter(cache, type, key);
        synchronized (counter) {
            String today = LocalDate.now(ZoneOffset.UTC).toString();
            if (!today.equals(counter.getDay())) {
                counter.setDay(today);
                counter.setCount(0);
            }
            counter.setCount(counter.getCount() + 1);
            counter.setUpdatedAt(Instant.now());
            counter.setExpireAt(Instant.now().plus(counterTtlDays, ChronoUnit.DAYS));
            counterRepository.save(counter);
        }
    }

    private InitialCreditsCounter loadCounter(
            Map<String, InitialCreditsCounter> cache,
            String type,
            String key) {
        String cacheKey = type + ":" + key;
        InitialCreditsCounter cached = cache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        InitialCreditsCounter counter = counterRepository.find(type, key)
                .orElseGet(() -> {
                    InitialCreditsCounter created = new InitialCreditsCounter();
                    created.setType(type);
                    created.setKey(key);
                    created.setDay(LocalDate.now(ZoneOffset.UTC).toString());
                    created.setCount(0);
                    created.setUpdatedAt(Instant.now());
                    return created;
                });
        cache.put(cacheKey, counter);
        return counter;
    }

    private boolean isAccountEligible(String accountKey) {
        Boolean granted = initialCreditAccountGrants.get(accountKey);
        if (granted != null) {
            return !granted;
        }

        InitialCreditsCounter counter = counterRepository.find("acct", accountKey)
                .orElseGet(() -> {
                    InitialCreditsCounter created = new InitialCreditsCounter();
                    created.setType("acct");
                    created.setKey(accountKey);
                    created.setDay(LocalDate.now(ZoneOffset.UTC).toString());
                    created.setCount(0);
                    created.setGranted(false);
                    created.setUpdatedAt(Instant.now());
                    created.setExpireAt(Instant.now().plus(counterTtlDays, ChronoUnit.DAYS));
                    return created;
                });

        boolean eligible = counter.getGranted() == null || !counter.getGranted();
        initialCreditAccountGrants.put(accountKey, !eligible);
        return eligible;
    }

    private void markAccountGranted(String accountKey, boolean granted) {
        InitialCreditsCounter counter = counterRepository.find("acct", accountKey)
                .orElseGet(() -> {
                    InitialCreditsCounter created = new InitialCreditsCounter();
                    created.setType("acct");
                    created.setKey(accountKey);
                    created.setDay(LocalDate.now(ZoneOffset.UTC).toString());
                    created.setCount(0);
                    created.setGranted(false);
                    created.setUpdatedAt(Instant.now());
                    return created;
                });
        counter.setGranted(granted);
        counter.setUpdatedAt(Instant.now());
        counter.setExpireAt(Instant.now().plus(accountTtlDays, ChronoUnit.DAYS));
        counterRepository.save(counter);
        initialCreditAccountGrants.put(accountKey, granted);
        initialCreditAccounts.add(accountKey);
    }
}
