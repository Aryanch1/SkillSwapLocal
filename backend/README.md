# SkillSwapLocal backend

Spring Boot 3.3.5 (Java 17) service that matches skill requests to
nearby offers, writes friendly intro messages, and suggests listing
categories. Endpoints:

- `POST /api/match` — `{ "request": {…listing…}, "offers": [{…listing…}] }` →
  `{ "matches": [{ "listingId": "…", "score": 92, "reasons": ["Same skill: Home repair", "0.4 mi away"] }], "source": "demo" | "live" }`.
- `POST /api/intro` — `{ "listing": {…}, "neighbor": "Maya R.", "tone": "friendly" }` →
  `{ "message": "…", "source": "demo" | "live" }`.
- `POST /api/suggest` — `{ "description": "My tap keeps dripping…" }` →
  `{ "category": "Home repair", "title": "Help with a home repair", "source": "demo" | "live" }`.
- `GET /api/health` — `{ "status": "ok", "app": "skillswaplocal" }`.

## Live vs demo

- **Live** (`source: "live"`): when `GEMINI_API_KEY` is set, the request
  goes to Google Gemini (`gemini-3.5-flash-lite`) through the
  OpenAI-compatible endpoint
  `https://generativelanguage.googleapis.com/v1beta/openai/`.
  The key comes from the environment only — never from code or the repo.
  Optional overrides: `SKILLSWAPLOCAL_GEMINI_MODEL`,
  `SKILLSWAPLOCAL_GEMINI_BASE_URL` (also see `application.properties`).
- **Demo** (`source: "demo"`): when no key is set, or the AI call fails,
  the endpoint still answers with the built-in demo logic (rule-based
  matcher / template intro writer / keyword suggester — the same rules
  as the app's on-device code in `lib/swap.ts`). The app always says
  which mode the answer came from.

## Run

```sh
cd backend
./mvnw spring-boot:run        # serves on http://localhost:8080
```

On a normal machine `./mvnw test` and `./mvnw package` just work: the
wrapper downloads Maven 3.9.9 and all dependencies from Maven Central.

## Tests

```sh
./mvnw test   # 22 tests: SwapMatcher (7), IntroWriter (5), CategorySuggester (4), SwapController (5), context load (1)
```

`SkillSwapApplicationTests` boots the whole context with no API key set,
so a wiring mistake (e.g. an ambiguous `GeminiClient` constructor) fails
the suite instead of failing at first real boot.

## Offline build in this sandbox

This VM blocks all TCP from Java processes, so plain `mvn` cannot reach
Maven Central — even through the egress proxy, and even to localhost.
Dependencies are therefore resolved by a Python helper that downloads
them with `curl` (which does go through the proxy) into the local repo:

```sh
python3 ~/tools/mvn-resolve.py backend/pom.xml \
  commons-io:commons-io:2.15.1 \
  org.apache.maven.surefire:surefire-junit-platform:3.2.5 \
  org.junit.platform:junit-platform-launcher:1.10.5 \
  org.apache.maven.plugins:maven-wrapper-plugin:3.2.0 \
  org.apache.maven.plugins:maven-jar-plugin:3.4.2 \
  org.tomlj:tomlj:1.0.0 \
  org.apache.maven.plugins:maven-shade-plugin:3.5.0
./mvnw -o test
```

The extra roots are artifacts Maven resolves at runtime rather than from
a POM edge: the Surefire JUnit Platform provider + launcher, the
Maven-core 3.9.9 transitive `commons-io`, the wrapper/jar plugins, and
the `repackage` goal's `tomlj` + `maven-shade-plugin`. The resolver
applies the nearest dependencyManagement per tree (app BOM first, then
each plugin's own), inherits parent `<dependencies>`, and skips
test-scoped transitive deps. On a normal machine none of this is needed.

Two environment notes:

- The wrapper needs its Maven distribution zip pre-seeded here, because
  the Java downloader cannot use the network:
  `~/.m2/wrapper/dists/apache-maven-3.9.9-bin/<hash>/apache-maven-3.9.9-bin.zip`.
  On a normal machine the wrapper downloads it on first run.
- This shell runs as root, so Java's `user.home` is `/root` and the
  wrapper's default local repo would be `/root/.m2/repository` (which
  does not hold the resolved artifacts). Pass the repo explicitly:
  `./mvnw -o -Dmaven.repo.local=/home/hatch/.m2/repository test`.
  The distribution zip was also copied into
  `/root/.m2/wrapper/dists/apache-maven-3.9.9-bin/<hash>/` so the
  wrapper finds its distribution without downloading. On a normal
  machine none of this is needed.
- The default `java` in this VM is a JRE-only install, so the compiler
  plugin fails with "release version 17 not supported" unless the
  Temurin 17 JDK is used: prefix every `./mvnw` call with
  `JAVA_HOME=/home/hatch/tools/jdk-17.0.21+9` (and run the jar with
  that JDK's `java` too). On a normal machine with a JDK 17 on PATH
  none of this is needed.
