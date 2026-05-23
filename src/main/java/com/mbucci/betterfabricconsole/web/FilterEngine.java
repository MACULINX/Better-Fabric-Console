package com.mbucci.betterfabricconsole.web;

import java.util.List;
import java.util.regex.Pattern;

public class FilterEngine {
    public static class FilterResult {
        public boolean show;
        public boolean highlight;
        public String color;

        public FilterResult(boolean show, boolean highlight, String color) {
            this.show = show;
            this.highlight = highlight;
            this.color = color;
        }
    }

    public static FilterResult evaluate(SessionLog log, List<FilterRule> rules) {
        String text = log.message;
        if (text == null) text = "";
        
        boolean highlight = false;
        String highlightColor = null;

        if (rules == null || rules.isEmpty()) {
            return new FilterResult(true, false, null);
        }

        // 1. Check Include rules (If any exist, at least one must match)
        boolean hasIncludeRules = false;
        boolean matchedInclude = false;
        for (FilterRule rule : rules) {
            if (rule.active && "include".equals(rule.type) && rule.pattern != null && !rule.pattern.trim().isEmpty()) {
                hasIncludeRules = true;
                try {
                    Pattern pattern = Pattern.compile(rule.pattern, Pattern.CASE_INSENSITIVE);
                    if (pattern.matcher(text).find()) {
                        matchedInclude = true;
                    }
                } catch (Exception e) {
                    System.err.println("[BetterFabricConsole] Invalid regex pattern: " + rule.pattern);
                }
            }
        }
        if (hasIncludeRules && !matchedInclude) {
            return new FilterResult(false, false, null);
        }

        // 2. Check Exclude rules (If any matches, hide immediately)
        for (FilterRule rule : rules) {
            if (rule.active && "exclude".equals(rule.type) && rule.pattern != null && !rule.pattern.trim().isEmpty()) {
                try {
                    Pattern pattern = Pattern.compile(rule.pattern, Pattern.CASE_INSENSITIVE);
                    if (pattern.matcher(text).find()) {
                        return new FilterResult(false, false, null);
                    }
                } catch (Exception e) {
                    System.err.println("[BetterFabricConsole] Invalid regex pattern: " + rule.pattern);
                }
            }
        }

        // 3. Check Highlight rules (Style line if matches)
        for (FilterRule rule : rules) {
            if (rule.active && "highlight".equals(rule.type) && rule.pattern != null && !rule.pattern.trim().isEmpty()) {
                try {
                    Pattern pattern = Pattern.compile(rule.pattern, Pattern.CASE_INSENSITIVE);
                    if (pattern.matcher(text).find()) {
                        highlight = true;
                        highlightColor = rule.highlightColor;
                        break; // Stop at first matched highlight
                    }
                } catch (Exception e) {
                    System.err.println("[BetterFabricConsole] Invalid regex pattern: " + rule.pattern);
                }
            }
        }

        return new FilterResult(true, highlight, highlightColor);
    }
}
