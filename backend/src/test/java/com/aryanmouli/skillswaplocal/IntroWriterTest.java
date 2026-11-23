package com.aryanmouli.skillswaplocal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class IntroWriterTest {

  private final IntroWriter writer = new IntroWriter();

  private static SwapDtos.ListingDto offer() {
    return new SwapDtos.ListingDto("off-1", "offer", "Fix a leaky tap", "Home repair",
        "I can fix a dripping tap, swap a washer, or tighten up a loose faucet.",
        "n-maya", 0.4, "Weekends", "Your place", false, "open", 0L, false, true);
  }

  private static SwapDtos.ListingDto request() {
    return new SwapDtos.ListingDto("req-1", "request", "Help moving a couch up two flights",
        "Moving & errands", "Need a second pair of hands to carry a couch up the stairs.",
        "n-jordan", 1.3, "Saturday morning", "My building", true, "open", 0L, false, true);
  }

  @Test
  void friendlyIntroUsesOnlyGivenDetails() {
    String message = writer.write(offer(), "Maya R.", "friendly");
    assertTrue(message.contains("Maya"));
    assertTrue(message.contains("Fix a leaky tap"));
    assertTrue(message.contains("weekends"));
    assertTrue(message.contains("Thank you") || message.contains("Thanks"));
  }

  @Test
  void shortIntroIsShorter() {
    String friendly = writer.write(offer(), "Maya R.", "friendly");
    String shortMsg = writer.write(offer(), "Maya R.", "short");
    assertTrue(shortMsg.length() < friendly.length());
    assertTrue(shortMsg.startsWith("Hi Maya!"));
  }

  @Test
  void gratefulIntroOffersReturnFavor() {
    String message = writer.write(offer(), "Maya R.", "grateful");
    assertTrue(message.contains("return the favor"));
  }

  @Test
  void requestIntroSaysCanHelp() {
    String message = writer.write(request(), "Jordan M.", "friendly");
    assertTrue(message.contains("I think I can help"));
    assertTrue(message.contains("Jordan"));
    assertTrue(message.contains("Help moving a couch"));
  }

  @Test
  void introNeverMentionsPayment() {
    String message = writer.write(offer(), "Maya R.", "friendly");
    assertTrue(!message.toLowerCase().contains("pay"));
    assertTrue(!message.toLowerCase().contains("money"));
    assertTrue(!message.toLowerCase().contains("$"));
  }
}
