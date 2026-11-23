package com.aryanmouli.skillswaplocal;

import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Swap endpoints. Each answers with a live Gemini result when
 * GEMINI_API_KEY is set, and with the honest rule-based demo result
 * otherwise — the app always says which mode answered.
 */
@RestController
public class SwapController {

  private final SwapService service;

  public SwapController(SwapService service) {
    this.service = service;
  }

  @GetMapping("/api/health")
  public Map<String, String> health() {
    return Map.of("status", "ok", "app", "skillswaplocal");
  }

  @PostMapping(value = "/api/match", consumes = MediaType.APPLICATION_JSON_VALUE)
  public SwapDtos.MatchResponse match(@RequestBody SwapDtos.MatchRequest request) {
    return service.match(request);
  }

  @PostMapping(value = "/api/intro", consumes = MediaType.APPLICATION_JSON_VALUE)
  public SwapDtos.IntroResponse intro(@RequestBody SwapDtos.IntroRequest request) {
    return service.intro(request);
  }

  @PostMapping(value = "/api/suggest", consumes = MediaType.APPLICATION_JSON_VALUE)
  public SwapDtos.SuggestResponse suggest(@RequestBody SwapDtos.SuggestRequest request) {
    return service.suggest(request);
  }
}
