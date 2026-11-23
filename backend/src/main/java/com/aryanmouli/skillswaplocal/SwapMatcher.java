package com.aryanmouli.skillswaplocal;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

/**
 * Rule-based matcher: ranks offers against one request from exactly the
 * facts given — nothing invented. Used as the honest demo fallback when
 * no Gemini key is set (source "demo"), and as the safety net when the
 * live call fails. The app ships the same rules on-device
 * (lib/swap.ts), so demo scores agree between the two.
 *
 * Points: same category +50; distance up to +20 (closer is better);
 * shared words between request and offer up to +15; timing overlap
 * +5; urgent request +5. Scores are clamped to 40–97.
 */
@Service
public class SwapMatcher {

  private static final List<String> DAY_WORDS = List.of(
      "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
      "weekend", "weekday", "morning", "evening", "afternoon", "midday");

  private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
      "the", "and", "for", "with", "that", "this", "from", "your", "you", "are",
      "can", "help", "need", "looking", "please", "just", "have", "has", "had",
      "will", "would", "about", "into", "over", "when", "what", "some", "any",
      "one", "two", "our", "she", "her", "his", "its", "not", "but", "all",
      "who", "how", "why", "get", "got", "too", "very", "much", "more", "than"));

  static String clean(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value.trim();
  }

  static Set<String> contentWords(String text) {
    Set<String> words = new HashSet<>();
    if (text == null) return words;
    for (String w : text.toLowerCase().split("[^a-z]+")) {
      if (w.length() > 2 && !STOP_WORDS.contains(w)) words.add(w);
    }
    return words;
  }

  static boolean timingOverlaps(String a, String b) {
    if (a == null || b == null) return false;
    String la = a.toLowerCase();
    String lb = b.toLowerCase();
    Set<String> aDays = new HashSet<>();
    Set<String> bDays = new HashSet<>();
    for (String d : DAY_WORDS) {
      if (la.contains(d)) aDays.add(d);
      if (lb.contains(d)) bDays.add(d);
    }
    if (aDays.contains("weekend") && (bDays.contains("saturday") || bDays.contains("sunday"))) return true;
    if (bDays.contains("weekend") && (aDays.contains("saturday") || aDays.contains("sunday"))) return true;
    if (aDays.contains("weekday")
        && bDays.stream().anyMatch(d -> List.of("monday", "tuesday", "wednesday", "thursday", "friday").contains(d))) {
      return true;
    }
    if (bDays.contains("weekday")
        && aDays.stream().anyMatch(d -> List.of("monday", "tuesday", "wednesday", "thursday", "friday").contains(d))) {
      return true;
    }
    return aDays.stream().anyMatch(bDays::contains);
  }

  /** Score one offer against one request, with human reasons. */
  public SwapDtos.MatchDto score(SwapDtos.ListingDto request, SwapDtos.ListingDto offer) {
    List<String> reasons = new ArrayList<>();
    int score = 0;

    if (clean(offer.category(), "").equalsIgnoreCase(clean(request.category(), ""))) {
      score += 50;
      reasons.add("Same skill: " + clean(request.category(), "this skill"));
    } else {
      reasons.add("Different skill, nearby neighbor");
    }

    int distPoints = Math.max(0, (int) Math.round(20 - offer.distanceMi() * 8));
    score += distPoints;
    reasons.add(String.format("%.1f mi away", offer.distanceMi()));

    Set<String> reqWords = contentWords(clean(request.title(), "") + " " + clean(request.description(), ""));
    Set<String> offerWords = contentWords(clean(offer.title(), "") + " " + clean(offer.description(), ""));
    reqWords.retainAll(offerWords);
    int shared = reqWords.size();
    if (shared > 0) {
      int wordPoints = Math.min(15, shared * 5);
      score += wordPoints;
      reasons.add(shared == 1 ? "Shares a word: " + reqWords.iterator().next()
          : "Shares " + shared + " words with your request");
    }

    if (timingOverlaps(request.when(), offer.when())) {
      score += 5;
      reasons.add("Timing lines up");
    }
    if (request.urgent()) {
      score += 5;
      reasons.add("Needed soon — prioritized");
    }

    int clamped = Math.max(40, Math.min(97, score));
    return new SwapDtos.MatchDto(clean(offer.id(), ""), clamped, reasons);
  }

  /** Rank all open offers for one request, best first. */
  public List<SwapDtos.MatchDto> match(SwapDtos.ListingDto request, List<SwapDtos.ListingDto> offers) {
    List<SwapDtos.MatchDto> out = new ArrayList<>();
    if (request == null || offers == null) return out;
    for (SwapDtos.ListingDto offer : offers) {
      if (offer == null) continue;
      if (!"offer".equalsIgnoreCase(clean(offer.kind(), ""))) continue;
      if (!"open".equalsIgnoreCase(clean(offer.status(), "open"))) continue;
      out.add(score(request, offer));
    }
    out.sort((a, b) -> Integer.compare(b.score(), a.score()));
    return out;
  }
}
