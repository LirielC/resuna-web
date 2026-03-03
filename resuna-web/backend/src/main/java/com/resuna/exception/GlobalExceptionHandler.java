package com.resuna.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Value("${app.debug:false}")
    private boolean debug;

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedException ex) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(ExecutionException.class)
    public ResponseEntity<Map<String, Object>> handleExecutionException(ExecutionException ex) {
        String message = debug ? "Database operation failed: " + ex.getMessage()
                : "Database operation failed";
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = debug ? "Validation failed: " + ex.getMessage() : "Validation failed";
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        logger.warn("Malformed or unreadable request body: {}", ex.getMessage());
        String message = debug ? "Malformed request: " + ex.getMessage() : "Malformed or invalid request body";
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        String message = debug ? ex.getMessage() : "Invalid request";
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(InterruptedException.class)
    public ResponseEntity<Map<String, Object>> handleInterruptedException(InterruptedException ex) {
        Thread.currentThread().interrupt();
        logger.error("Operation was interrupted", ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Operation was interrupted");
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        logger.error("IllegalStateException occurred", ex);
        String message = debug ? "Invalid state: " + ex.getMessage() : "Invalid operation state";
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }

    @ExceptionHandler(TaskRejectedException.class)
    public ResponseEntity<Map<String, Object>> handleTaskRejected(TaskRejectedException ex) {
        logger.warn("Task rejected (likely executor shutdown/restart): {}", ex.getMessage());
        String message = debug ? "Service temporarily unavailable: " + ex.getMessage()
                : "Service temporarily unavailable. Please try again.";
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, message);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        logger.error("Unexpected exception occurred", ex);
        String message = debug ? "An unexpected error occurred: " + ex.getMessage()
                : "An unexpected error occurred";
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("status", status.value());
        error.put("error", status.getReasonPhrase());
        error.put("message", message);
        error.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(status).body(error);
    }
}
