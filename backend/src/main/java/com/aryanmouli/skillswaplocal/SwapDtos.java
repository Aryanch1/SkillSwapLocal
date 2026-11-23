package com.aryanmouli.skillswaplocal;

import java.util.List;

/** Request/response shapes for the SkillSwapLocal matching service. */
public final class SwapDtos {
  private SwapDtos() {}

  /** One board listing, as the app sends it (mirrors lib/types.ts). */
  public record ListingDto(
      String id,
      String kind,
      String title,
      String category,
      String description,
      String neighborId,
      double distanceMi,
      String when,
      String where,
      boolean urgent,
      String status,
      long createdAt,
      boolean mine,
      boolean isDemo) {}

  public record MatchDto(String listingId, int score, List<String> reasons) {}

  public record MatchRequest(ListingDto request, List<ListingDto> offers) {}

  public record MatchResponse(List<MatchDto> matches, String source) {}

  public record IntroRequest(ListingDto listing, String neighbor, String tone) {}

  public record IntroResponse(String message, String source) {}

  public record SuggestRequest(String description) {}

  public record SuggestResponse(String category, String title, String source) {}
}
