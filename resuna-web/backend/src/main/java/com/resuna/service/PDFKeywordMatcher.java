package com.resuna.service;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/** Word-boundary-aware keyword matching with bidirectional synonyms. */
@Component
public class PDFKeywordMatcher {

    public boolean contains(String text, String keyword, Map<String, Set<String>> synonyms) {
        if (text == null || keyword == null || keyword.isBlank()) return false;
        if (matchesWord(text, keyword)) return true;

        Set<String> alternatives = synonyms.get(keyword.toLowerCase());
        if (alternatives != null && alternatives.stream().anyMatch(value -> matchesWord(text, value))) {
            return true;
        }

        return synonyms.entrySet().stream()
                .filter(entry -> entry.getValue().contains(keyword.toLowerCase()))
                .anyMatch(entry -> matchesWord(text, entry.getKey()));
    }

    private boolean matchesWord(String text, String word) {
        return Pattern.compile("(?i)\\b" + Pattern.quote(word) + "\\b").matcher(text).find();
    }
}
