package com.resuna.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/** Parses the provider response without coupling business services to its JSON shape. */
@Component
public class OpenRouterResponseParser {

    private static final Logger logger = LoggerFactory.getLogger(OpenRouterResponseParser.class);
    private final ObjectMapper objectMapper;

    public OpenRouterResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @SuppressWarnings("unchecked")
    public String extractText(String jsonResponse) throws IOException {
        if (jsonResponse == null || jsonResponse.isBlank()) {
            throw new IOException("Empty OpenRouter response");
        }
        Map<String, Object> response = objectMapper.readValue(jsonResponse, Map.class);
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices == null || choices.isEmpty()) {
            logger.error("No choices in OpenRouter response. Response keys: {}", response.keySet());
            throw new IOException("No choices in OpenRouter response");
        }

        Map<String, Object> choice = choices.get(0);
        Map<String, Object> message = (Map<String, Object>) choice.get("message");
        if (message == null) {
            throw new IOException("No message in OpenRouter response");
        }

        String content = messageContent(message);
        if (content == null || content.isBlank()) {
            Object reasoning = message.get("reasoning");
            if (reasoning instanceof String value && !value.isBlank()) {
                content = value;
            }
        }
        if (content == null || content.isBlank()) {
            throw new IOException("No content in OpenRouter response");
        }
        if ("length".equals(String.valueOf(choice.get("finish_reason")))) {
            logger.warn("OpenRouter response was truncated by token limit");
        }
        return content;
    }

    private String messageContent(Map<String, Object> message) {
        Object content = message.get("content");
        if (content instanceof String value) return value;
        if (content instanceof List<?> parts) {
            StringBuilder result = new StringBuilder();
            for (Object part : parts) {
                String value = null;
                if (part instanceof Map<?, ?> map && map.get("text") instanceof String text) value = text;
                if (part instanceof String text) value = text;
                if (value != null && !value.isBlank()) {
                    if (result.length() > 0) result.append('\n');
                    result.append(value);
                }
            }
            return result.toString();
        }
        if (content instanceof Map<?, ?> map && map.get("text") instanceof String text) return text;
        return null;
    }
}
