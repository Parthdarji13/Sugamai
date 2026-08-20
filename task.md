# SugamGov AI Review-II Prototype Tasks

- `[x]` Bootstrap Next.js React project inside `frontend` folder
- `[x]` Setup local environment variables for Gemini API
- `[x]` Create cached official source texts in `retrieval/sources/`
  - `[x]` `pm_kisan.txt`
  - `[x]` `ayushman_bharat.txt`
  - `[x]` `income_certificate.txt`
- `[x]` Implement retrieval layer logic
  - `[x]` `governmentSources.ts`
  - `[x]` `queryMatcher.ts`
  - `[x]` `contentExtractor.ts`
  - `[x]` `sourceManager.ts`
- `[x]` Implement Streaming Integration
  - `[x]` Update `src/app/api/chat/route.ts` to output a `ReadableStream` using `generateContentStream`
  - `[x]` Implement 20-second connection timeout inside route stream
  - `[x]` Update `src/app/page.tsx` to decode incoming chunks in real-time
  - `[x]` Verify frontend chat bubble typing animations and metadata binding
- `[x]` Produce final walkthrough report
