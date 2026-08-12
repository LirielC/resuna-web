package com.resuna.util;

import com.resuna.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;

/** Reads identity established by AuthFilter without exposing servlet details to services. */
public final class RequestIdentity {

    private RequestIdentity() {
    }

    public static String requireUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (userId == null || userId.toString().isBlank()) {
            throw new UnauthorizedException("User not authenticated");
        }
        return userId.toString();
    }

    public static String userEmail(HttpServletRequest request) {
        Object email = request.getAttribute("userEmail");
        return email == null ? null : email.toString();
    }
}
