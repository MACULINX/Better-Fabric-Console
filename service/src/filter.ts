import { FilterRule, SessionLog } from './storage.js';

export interface FilterResult {
  show: boolean;
  highlight: boolean;
  color?: string;
}

export class FilterEngine {
  /**
   * Evaluates a log line against the configured REGEX rules.
   */
  static evaluate(log: SessionLog, rules: FilterRule[]): FilterResult {
    const text = log.message;
    let highlight = false;
    let highlightColor: string | undefined = undefined;

    // Filter rules
    const activeRules = rules.filter(r => r.active && r.pattern.trim().length > 0);

    // 1. Check Include rules (If any exist, at least one must match)
    const includeRules = activeRules.filter(r => r.type === 'include');
    if (includeRules.length > 0) {
      let matchedInclude = false;
      for (const rule of includeRules) {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          if (regex.test(text)) {
            matchedInclude = true;
            break;
          }
        } catch (e) {
          console.error(`Invalid regex pattern: ${rule.pattern}`, e);
        }
      }
      if (!matchedInclude) {
        return { show: false, highlight: false };
      }
    }

    // 2. Check Exclude rules (If any matches, hide immediately)
    const excludeRules = activeRules.filter(r => r.type === 'exclude');
    for (const rule of excludeRules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(text)) {
          return { show: false, highlight: false };
        }
      } catch (e) {
        console.error(`Invalid regex pattern: ${rule.pattern}`, e);
      }
    }

    // 3. Check Highlight rules (Style line if matches)
    const highlightRules = activeRules.filter(r => r.type === 'highlight');
    for (const rule of highlightRules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(text)) {
          highlight = true;
          highlightColor = rule.highlightColor;
          break; // Stop at first matched highlight
        }
      } catch (e) {
        console.error(`Invalid regex pattern: ${rule.pattern}`, e);
      }
    }

    return {
      show: true,
      highlight,
      color: highlightColor,
    };
  }
}
