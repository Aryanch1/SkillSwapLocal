package com.aryanmouli.skillswaplocal;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class CategorySuggesterTest {

  private final CategorySuggester suggester = new CategorySuggester();

  @Test
  void drippingTapIsHomeRepair() {
    SwapDtos.SuggestResponse r = suggester.suggest("My kitchen tap keeps dripping all night and I cannot fix it.");
    assertEquals("Home repair", r.category());
    assertEquals("demo", r.source());
  }

  @Test
  void spanishChatIsLanguage() {
    SwapDtos.SuggestResponse r = suggester.suggest("I am learning Spanish and I freeze up when I try to speak it.");
    assertEquals("Language", r.category());
  }

  @Test
  void couchCarryIsMoving() {
    SwapDtos.SuggestResponse r = suggester.suggest("I need a second pair of hands to carry a couch up the stairs.");
    assertEquals("Moving & errands", r.category());
  }

  @Test
  void unknownTextFallsBackToOther() {
    SwapDtos.SuggestResponse r = suggester.suggest("I need someone to stargaze with on Friday night.");
    assertEquals("Other", r.category());
  }
}
