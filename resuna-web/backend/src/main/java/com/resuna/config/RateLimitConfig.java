package com.resuna.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RateLimitConfig {

    @Value("${rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${rate-limit.general.max-requests:60}")
    private int generalMaxRequests;

    @Value("${rate-limit.general.window-seconds:60}")
    private int generalWindowSeconds;

    @Value("${rate-limit.ai.max-requests:10}")
    private int aiMaxRequests;

    @Value("${rate-limit.ai.window-seconds:60}")
    private int aiWindowSeconds;

    @Value("${rate-limit.ats.max-requests:10}")
    private int atsMaxRequests;

    @Value("${rate-limit.ats.window-seconds:60}")
    private int atsWindowSeconds;

    @Value("${rate-limit.export.max-requests:10}")
    private int exportMaxRequests;

    @Value("${rate-limit.export.window-seconds:300}")
    private int exportWindowSeconds;

    public boolean isEnabled() {
        return enabled;
    }

    public int getGeneralMaxRequests() {
        return generalMaxRequests;
    }

    public int getGeneralWindowSeconds() {
        return generalWindowSeconds;
    }

    public int getAiMaxRequests() {
        return aiMaxRequests;
    }

    public int getAiWindowSeconds() {
        return aiWindowSeconds;
    }

    public int getAtsMaxRequests() {
        return atsMaxRequests;
    }

    public int getAtsWindowSeconds() {
        return atsWindowSeconds;
    }

    public int getExportMaxRequests() {
        return exportMaxRequests;
    }

    public int getExportWindowSeconds() {
        return exportWindowSeconds;
    }
}
