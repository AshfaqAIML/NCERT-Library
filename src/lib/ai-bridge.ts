// Bridge: re-exports AI helpers + the HTTP handle() used by route handlers.
export {
  chat,
  getZai,
  mentorChat,
  summarize,
  explain,
  generateMCQs,
  generateFlashcards,
  extractJson,
  type MCQ,
  type Flashcard,
} from "./ai";
export { handle, ok, err } from "./http";
