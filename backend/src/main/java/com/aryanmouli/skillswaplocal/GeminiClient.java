package com.aryanmouli.skillswaplocal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Calls Google Gemini (gemini-3.5-flash-lite) through the OpenAI-compatible
 * endpoint, asking for strict JSON (no markdown fences, no extra text).
 *
 * The API key comes from the GEMINI_API_KEY environment variable only —
 * it never appears in code, the repo, or the app. When no key is set, or
 * the call fails, the caller falls back to the rule-based demo writers
 * instead of failing the request.
 */
@Service
public class GeminiClient {

  private final String apiKey;
  private final String model;
  private final String baseUrl;
  private final HttpClient http;
  private final ObjectMapper mapper;

  // @Autowired is required: the class also has a package-private
  // 5-arg constructor (used by unit tests), so without it Spring
  // falls back to looking for a no-arg constructor and boot fails.
  @Autowired
  public GeminiClient(
      @Value("${skillswaplocal.gemini.api-key:}") String apiKey,
      @Value("${skillswaplocal.gemini.model:gemini-3.5-flash-lite}") String model,
      @Value("${skillswaplocal.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/openai/}")
          String baseUrl) {
    this(apiKey, model, baseUrl, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(),
        new ObjectMapper());
  }

  GeminiClient(String apiKey, String model, String baseUrl, HttpClient http, ObjectMapper mapper) {
    this.apiKey = apiKey == null ? "" : apiKey.trim();
    this.model = model;
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    this.http = http;
    this.mapper = mapper;
  }

  public boolean isConfigured() {
    return !apiKey.isBlank();
  }

  /** Ask Gemini for a JSON object; throws on any failure so callers fall back to demo. */
  public JsonNode chatJson(String systemPrompt, String userText) throws Exception {
    if (!isConfigured()) {
      throw new IllegalStateException("GEMINI_API_KEY is not set");
    }
    String body = mapper.writeValueAsString(new ChatRequest(
        model,
        List.of(
            new ChatMessage("system", systemPrompt),
            new ChatMessage("user", userText)),
        0.3));
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(baseUrl + "chat/completions"))
        .header("Content-Type", "application/json")
        .header("Authorization", "Bearer " + apiKey)
        .timeout(Duration.ofSeconds(30))
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();
    HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IllegalStateException("Gemini returned HTTP " + response.statusCode());
    }
    JsonNode root = mapper.readTree(response.body());
    JsonNode content = root.path("choices").path(0).path("message").path("content");
    if (!content.isTextual()) {
      throw new IllegalStateException("Gemini returned no text content");
    }
    String json = content.asText().trim();
    if (json.startsWith("```")) {
      json = json.replaceFirst("(?s)^```(?:json)?\\s*", "").replaceFirst("(?s)\\s*```$", "");
    }
    return mapper.readTree(json);
  }

  private record ChatRequest(String model, List<ChatMessage> messages, double temperature) {}

  private record ChatMessage(String role, String content) {}
}
