package com.aryanmouli.skillswaplocal;

import org.springframework.stereotype.Service;

/**
 * Rule-based intro writer: drafts a friendly first hello to a neighbor
 * from exactly the listing and neighbor facts given — nothing invented.
 * Used as the honest demo fallback when no Gemini key is set
 * (source "demo"), and as the safety net when the live call fails.
 * The app ships the same templates on-device (lib/swap.ts).
 */
@Service
public class IntroWriter {

  public String write(SwapDtos.ListingDto listing, String neighborName, String tone) {
    String name = SwapMatcher.clean(neighborName, "neighbor");
    String firstName = name.split(" ")[0];
    String title = SwapMatcher.clean(listing == null ? null : listing.title(), "your listing");
    String when = SwapMatcher.clean(listing == null ? null : listing.when(), "sometime soon");
    String where = SwapMatcher.clean(listing == null ? null : listing.where(), "nearby");
    String firstSentence = "";
    if (listing != null && listing.description() != null && !listing.description().isBlank()) {
      String desc = listing.description().trim();
      int dot = desc.indexOf('.');
      firstSentence = dot > 0 ? desc.substring(0, dot) : desc;
    }
    String kind = listing == null ? "offer" : SwapMatcher.clean(listing.kind(), "offer");

    String opener;
    if ("short".equalsIgnoreCase(tone)) {
      opener = "Hi " + firstName + "!";
    } else if ("grateful".equalsIgnoreCase(tone)) {
      opener = "Hi " + firstName + ", I hope you are having a good day!";
    } else {
      opener = "Hi " + firstName + "! I am your neighbor, just down the street.";
    }

    String body;
    if ("offer".equalsIgnoreCase(kind)) {
      body = "I saw your offer \"" + title + "\" on SkillSwapLocal and it caught my eye."
          + (firstSentence.isEmpty() ? "" : " " + firstSentence + ".");
    } else {
      body = "I saw your request \"" + title + "\" on SkillSwapLocal and I think I can help.";
    }

    String closer;
    if ("short".equalsIgnoreCase(tone)) {
      closer = "Would " + when.toLowerCase() + " work for a quick chat?";
    } else if ("grateful".equalsIgnoreCase(tone)) {
      closer = "I would really appreciate your help, and I am happy to return the favor any time. Would "
          + when.toLowerCase() + " suit you for a quick chat?";
    } else {
      closer = "Would " + when.toLowerCase() + " suit you for a quick hello? Happy to meet at "
          + where.toLowerCase() + " or wherever suits you best.";
    }

    return opener + " " + body + " " + closer
        + "\n\nThanks so much — looking forward to meeting a neighbor!";
  }
}
