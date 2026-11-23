package com.aryanmouli.skillswaplocal;

import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/**
 * Rule-based category suggester: reads the free text a user typed for a
 * new listing and picks the skill category (plus a title) by keyword.
 * Used as the honest demo fallback when no Gemini key is set
 * (source "demo"), and as the safety net when the live call fails.
 * The app ships the same keywords on-device (lib/swap.ts).
 */
@Service
public class CategorySuggester {

  private record Rule(Pattern match, String category, String title) {}

  private static final List<Rule> RULES = List.of(
      new Rule(Pattern.compile("tap|leak|plumb|shelf|hang|drill|fix|repair|wobbly|bookshelf|door|faucet", Pattern.CASE_INSENSITIVE),
          "Home repair", "Help with a home repair"),
      new Rule(Pattern.compile("garden|plant|prune|rose|weed|lawn|tree|flower", Pattern.CASE_INSENSITIVE),
          "Garden & outdoor", "Garden help"),
      new Rule(Pattern.compile("guitar|piano|lesson|teach|learn.*(music|instrument)|violin", Pattern.CASE_INSENSITIVE),
          "Lessons", "Music lessons"),
      new Rule(Pattern.compile("spanish|french|english|language|speak|conversation", Pattern.CASE_INSENSITIVE),
          "Language", "Language practice"),
      new Rule(Pattern.compile("dog|cat|pet|beagle|puppy|kitten|walk.*dog", Pattern.CASE_INSENSITIVE),
          "Pets", "Pet help"),
      new Rule(Pattern.compile("move|moving|couch|furniture|carry|lift|boxes", Pattern.CASE_INSENSITIVE),
          "Moving & errands", "Help moving something"),
      new Rule(Pattern.compile("phone|computer|laptop|wifi|email|app|set up|tech", Pattern.CASE_INSENSITIVE),
          "Tech help", "Tech help"),
      new Rule(Pattern.compile("bake|cook|recipe|sourdough|dinner|kitchen", Pattern.CASE_INSENSITIVE),
          "Cooking", "Cooking help"));

  public SwapDtos.SuggestResponse suggest(String description) {
    String text = description == null ? "" : description.trim();
    for (Rule rule : RULES) {
      if (rule.match().matcher(text).find()) {
        return new SwapDtos.SuggestResponse(rule.category(), rule.title(), "demo");
      }
    }
    String[] words = text.split("\\s+");
    String head = "";
    if (!text.isEmpty()) {
      int take = Math.min(6, words.length);
      head = String.join(" ", java.util.Arrays.copyOfRange(words, 0, take));
    }
    String title = head.isEmpty() ? "Neighbor help" : "Help with: " + head;
    return new SwapDtos.SuggestResponse("Other", title, "demo");
  }
}
