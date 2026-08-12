package com.resuna.service;

import org.springframework.stereotype.Component;

/** Extracts JSON envelopes returned by translation providers. */
@Component
public class ResumeTranslationResponseParser {

    public String extractObject(String response) {
        if (response == null) return "";
        String text = response.trim();
        if (text.startsWith("```json")) text = text.substring(7);
        else if (text.startsWith("```")) text = text.substring(3);
        if (text.endsWith("```")) text = text.substring(0, text.length() - 3);

        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        return start >= 0 && end > start ? text.substring(start, end + 1) : text.trim();
    }
}
