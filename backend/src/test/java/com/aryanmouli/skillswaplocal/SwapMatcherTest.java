package com.aryanmouli.skillswaplocal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class SwapMatcherTest {

  private final SwapMatcher matcher = new SwapMatcher();

  private static SwapDtos.ListingDto listing(String id, String kind, String title, String category,
      String description, double distanceMi, String when) {
    return new SwapDtos.ListingDto(id, kind, title, category, description, "n-x", distanceMi,
        when, "Maple St", false, "open", 0L, false, false);
  }

  private static SwapDtos.ListingDto request() {
    return listing("req-1", "request", "Need help fixing a wobbly bookshelf", "Home repair",
        "My bookshelf wobbles every time someone walks past. Looking for someone handy who can brace it to the wall this weekend.",
        0.6, "This weekend");
  }

  @Test
  void sameCategoryScoresHigh() {
    SwapDtos.ListingDto offer = listing("off-1", "offer", "Hang shelves and brace bookshelves", "Home repair",
        "I hang shelves, brace bookshelves to the wall, and fix wobbly furniture.", 0.4, "Weekends");
    SwapDtos.MatchDto m = matcher.score(request(), offer);
    assertTrue(m.score() >= 78, "expected a strong match, got " + m.score());
    assertTrue(m.reasons().stream().anyMatch(r -> r.contains("Same skill: Home repair")));
  }

  @Test
  void differentCategoryScoresLower() {
    SwapDtos.ListingDto offer = listing("off-2", "offer", "Dog walking while you are away", "Pets",
        "Happy to walk your dog on weekday mornings.", 0.5, "Weekday mornings");
    SwapDtos.MatchDto close = matcher.score(request(), listing("off-1", "offer",
        "Hang shelves and pictures", "Home repair", "I hang shelves and pictures.", 0.4, "Weekends"));
    SwapDtos.MatchDto far = matcher.score(request(), offer);
    assertTrue(close.score() > far.score());
  }

  @Test
  void closerOfferBeatsFartherOffer() {
    SwapDtos.ListingDto near = listing("off-n", "offer", "Fix a leaky tap", "Home repair",
        "I fix taps.", 0.4, "Weekends");
    SwapDtos.ListingDto far = listing("off-f", "offer", "Fix a leaky tap", "Home repair",
        "I fix taps.", 1.3, "Weekends");
    assertTrue(matcher.score(request(), near).score() > matcher.score(request(), far).score());
  }

  @Test
  void matchRanksBestFirstAndSkipsNonOffers() {
    SwapDtos.ListingDto best = listing("off-best", "offer", "Hang shelves and pictures", "Home repair",
        "I hang shelves and pictures and brace bookshelves.", 0.4, "Weekends");
    SwapDtos.ListingDto weak = listing("off-weak", "offer", "Spanish conversation practice", "Language",
        "Thirty minutes of relaxed Spanish chat.", 0.5, "Tue evenings");
    SwapDtos.ListingDto notAnOffer = listing("req-2", "request", "Help moving a couch", "Moving & errands",
        "Need a second pair of hands.", 1.0, "Saturday morning");
    List<SwapDtos.MatchDto> matches = matcher.match(request(), List.of(weak, notAnOffer, best));
    assertEquals(2, matches.size());
    assertEquals("off-best", matches.get(0).listingId());
    assertTrue(matches.get(0).score() >= matches.get(1).score());
  }

  @Test
  void scoresStayInRange() {
    SwapDtos.ListingDto offer = listing("off-3", "offer", "Piano basics for kids", "Lessons",
        "Gentle first piano lessons.", 1.3, "Wed afternoons");
    SwapDtos.MatchDto m = matcher.score(request(), offer);
    assertTrue(m.score() >= 40 && m.score() <= 97, "score out of range: " + m.score());
  }

  @Test
  void timingOverlapAddsPoints() {
    SwapDtos.ListingDto aligned = listing("off-a", "offer", "Fix a leaky tap", "Home repair",
        "I fix taps.", 0.9, "Weekends");
    SwapDtos.ListingDto misaligned = listing("off-b", "offer", "Fix a leaky tap", "Home repair",
        "I fix taps.", 0.9, "Tue evenings");
    assertTrue(matcher.score(request(), aligned).score() > matcher.score(request(), misaligned).score());
  }

  @Test
  void urgentRequestGetsPriority() {
    SwapDtos.ListingDto urgent = new SwapDtos.ListingDto("req-u", "request",
        "Help moving a couch up two flights", "Moving & errands",
        "Need a second pair of hands to carry a couch up the stairs.", "n-j",
        1.3, "Saturday morning", "My building", true, "open", 0L, false, false);
    SwapDtos.ListingDto offer = listing("off-m", "offer", "Help moving a couch", "Moving & errands",
        "I can help carry a couch up the stairs.", 1.3, "Saturday morning");
    SwapDtos.ListingDto calm = new SwapDtos.ListingDto("req-c", "request",
        "Help moving a couch up two flights", "Moving & errands",
        "Need a second pair of hands to carry a couch up the stairs.", "n-j",
        1.3, "Saturday morning", "My building", false, "open", 0L, false, false);
    assertTrue(matcher.score(urgent, offer).score() > matcher.score(calm, offer).score());
  }
}
