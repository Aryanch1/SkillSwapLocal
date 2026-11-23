package com.aryanmouli.skillswaplocal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class SwapControllerTest {

  private SwapController controller() {
    // No API key configured, so the controller must take the demo path.
    GeminiClient gemini = new GeminiClient("", "gemini-3.5-flash-lite",
        "https://generativelanguage.googleapis.com/v1beta/openai/",
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build(),
        new ObjectMapper());
    SwapService service = new SwapService(gemini, new SwapMatcher(), new IntroWriter(),
        new CategorySuggester());
    return new SwapController(service);
  }

  private static SwapDtos.ListingDto listing(String id, String kind, String title, String category,
      String description, double distanceMi, String when) {
    return new SwapDtos.ListingDto(id, kind, title, category, description, "n-x", distanceMi,
        when, "Maple St", false, "open", 0L, false, false);
  }

  @Test
  void healthReturnsOk() {
    Map<String, String> health = controller().health();
    assertEquals("ok", health.get("status"));
    assertEquals("skillswaplocal", health.get("app"));
  }

  @Test
  void matchWithoutKeyReturnsDemoMatches() {
    SwapDtos.ListingDto request = listing("req-1", "request", "Need help hanging shelves",
        "Home repair", "My shelves need hanging straight on the wall this weekend.", 0.6, "This weekend");
    SwapDtos.ListingDto offer = listing("off-1", "offer", "Hang shelves and pictures",
        "Home repair", "I hang shelves and pictures, straight and level.", 0.4, "Weekends");
    SwapDtos.MatchResponse res = controller().match(
        new SwapDtos.MatchRequest(request, List.of(offer)));
    assertEquals("demo", res.source());
    assertFalse(res.matches().isEmpty());
    assertEquals("off-1", res.matches().get(0).listingId());
    assertTrue(res.matches().get(0).score() >= 78);
  }

  @Test
  void introWithoutKeyReturnsDemoIntro() {
    SwapDtos.ListingDto offer = listing("off-1", "offer", "Fix a leaky tap",
        "Home repair", "I can fix a dripping tap.", 0.4, "Weekends");
    SwapDtos.IntroResponse res = controller().intro(
        new SwapDtos.IntroRequest(offer, "Maya R.", "friendly"));
    assertEquals("demo", res.source());
    assertTrue(res.message().contains("Maya"));
    assertNotNull(res.message());
  }

  @Test
  void suggestWithoutKeyReturnsDemoSuggestion() {
    SwapDtos.SuggestResponse res = controller().suggest(
        new SwapDtos.SuggestRequest("My dog needs a walk every weekday at midday."));
    assertEquals("demo", res.source());
    assertEquals("Pets", res.category());
  }

  @Test
  void matchWithEmptyOffersStillAnswers() {
    SwapDtos.ListingDto request = listing("req-1", "request", "Teach me to bake sourdough",
        "Cooking", "I have a starter I am scared of killing.", 0.5, "Sunday mornings");
    SwapDtos.MatchResponse res = controller().match(
        new SwapDtos.MatchRequest(request, List.of()));
    assertEquals("demo", res.source());
    assertTrue(res.matches().isEmpty());
  }
}
