package com.aryanmouli.skillswaplocal;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Orchestrates the three AI features: match, intro, suggest. Each one
 * tries the live Gemini call first when a key is configured, and falls
 * back to the honest rule-based demo writers on any failure — the
 * request never fails, and the response always says which mode answered.
 */
@Service
public class SwapService {

  private static final String MATCH_SYSTEM =
      "You match a neighbor's skill request to nearby offers on a community swap board. "
          + "Reply with ONLY a JSON object, no markdown fences, no extra text, with exactly this field: "
          + "matches (an array of objects with listingId (one of the offer ids given), score (integer 0-100), "
          + "reasons (1-3 short human reasons, e.g. \"Same skill: Home repair\", \"0.4 mi away\")). "
          + "Score honestly from the facts given: same category matters most, then distance, then timing. "
          + "Never invent an offer, a distance, or a reason. Rank best first.";

  private static final String INTRO_SYSTEM =
      "You write a friendly first hello from one neighbor to another about a skill-swap listing. "
          + "Reply with ONLY a JSON object, no markdown fences, no extra text, with exactly this field: "
          + "message (3-5 short sentences). Use ONLY the details given: the neighbor's first name, the "
          + "listing title and description, whether it is an offer or a request, when, and where. "
          + "Never invent a name, place, date, or fact. Warm and neighborly, never pushy. "
          + "End with a thank-you line. No money is involved — never mention payment.";

  private static final String SUGGEST_SYSTEM =
      "You suggest a category and a title for a neighbor's skill-swap listing from the free text they typed. "
          + "Reply with ONLY a JSON object, no markdown fences, no extra text, with exactly these fields: "
          + "category (one of: Home repair, Garden & outdoor, Lessons, Language, Pets, Moving & errands, "
          + "Tech help, Cooking, Other) and title (one short plain title, under 8 words). "
          + "Use ONLY the text given; never invent a skill the text does not mention.";

  private final GeminiClient gemini;
  private final SwapMatcher matcher;
  private final IntroWriter introWriter;
  private final CategorySuggester suggester;

  public SwapService(GeminiClient gemini, SwapMatcher matcher, IntroWriter introWriter,
      CategorySuggester suggester) {
    this.gemini = gemini;
    this.matcher = matcher;
    this.introWriter = introWriter;
    this.suggester = suggester;
  }

  public SwapDtos.MatchResponse match(SwapDtos.MatchRequest req) {
    List<SwapDtos.ListingDto> offers = req.offers() == null ? List.of() : req.offers();
    List<SwapDtos.MatchDto> demo = matcher.match(req.request(), offers);
    if (gemini.isConfigured() && req.request() != null) {
      try {
        StringBuilder userText = new StringBuilder();
        userText.append("Request: ").append(describe(req.request())).append("\n");
        for (SwapDtos.ListingDto offer : offers) {
          userText.append("Offer ").append(offer.id()).append(": ").append(describe(offer)).append("\n");
        }
        JsonNode data = gemini.chatJson(MATCH_SYSTEM, userText.toString());
        List<SwapDtos.MatchDto> live = new ArrayList<>();
        java.util.Set<String> knownIds = new java.util.HashSet<>();
        for (SwapDtos.ListingDto offer : offers) knownIds.add(offer.id());
        for (JsonNode m : data.path("matches")) {
          String id = m.path("listingId").asText("");
          int score = m.path("score").asInt(-1);
          if (!knownIds.contains(id) || score < 0 || score > 100) continue;
          List<String> reasons = new ArrayList<>();
          for (JsonNode r : m.path("reasons")) {
            if (r.isTextual() && !r.asText().isBlank()) reasons.add(r.asText());
          }
          if (reasons.isEmpty()) reasons.add("Matched on skill and distance");
          live.add(new SwapDtos.MatchDto(id, score, reasons));
        }
        if (!live.isEmpty()) {
          live.sort((a, b) -> Integer.compare(b.score(), a.score()));
          return new SwapDtos.MatchResponse(live, "live");
        }
      } catch (Exception e) {
        // Live failed — fall through to the demo matcher.
      }
    }
    return new SwapDtos.MatchResponse(demo, "demo");
  }

  public SwapDtos.IntroResponse intro(SwapDtos.IntroRequest req) {
    String neighbor = req.neighbor() == null ? "neighbor" : req.neighbor();
    String demo = introWriter.write(req.listing(), neighbor, req.tone());
    if (gemini.isConfigured() && req.listing() != null) {
      try {
        String userText = "Neighbor: " + neighbor + "\nTone: "
            + (req.tone() == null ? "friendly" : req.tone()) + "\nListing: " + describe(req.listing());
        JsonNode data = gemini.chatJson(INTRO_SYSTEM, userText);
        String message = data.path("message").asText("");
        if (!message.isBlank()) return new SwapDtos.IntroResponse(message, "live");
      } catch (Exception e) {
        // Live failed — fall through to the demo writer.
      }
    }
    return new SwapDtos.IntroResponse(demo, "demo");
  }

  public SwapDtos.SuggestResponse suggest(SwapDtos.SuggestRequest req) {
    SwapDtos.SuggestResponse demo = suggester.suggest(req.description());
    if (gemini.isConfigured() && req.description() != null && !req.description().isBlank()) {
      try {
        JsonNode data = gemini.chatJson(SUGGEST_SYSTEM, "Listing text: " + req.description());
        String category = data.path("category").asText("");
        String title = data.path("title").asText("");
        List<String> valid = List.of("Home repair", "Garden & outdoor", "Lessons", "Language",
            "Pets", "Moving & errands", "Tech help", "Cooking", "Other");
        if (valid.contains(category) && !title.isBlank()) {
          return new SwapDtos.SuggestResponse(category, title, "live");
        }
      } catch (Exception e) {
        // Live failed — fall through to the demo suggester.
      }
    }
    return demo;
  }

  private static String describe(SwapDtos.ListingDto l) {
    return String.format("%s (%s, %s) — %s. When: %s. Where: %s. %.1f mi away.",
        SwapMatcher.clean(l.title(), "untitled"),
        SwapMatcher.clean(l.kind(), ""),
        SwapMatcher.clean(l.category(), ""),
        SwapMatcher.clean(l.description(), ""),
        SwapMatcher.clean(l.when(), ""),
        SwapMatcher.clean(l.where(), ""),
        l.distanceMi());
  }
}
