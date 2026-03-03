export const GENRES = [
  // Music
  "Hip-Hop",
  "R&B",
  "Pop",
  "Rock",
  "Electronic",
  "House",
  "Techno",
  "Jazz",
  "Blues",
  "Classical",
  "Country",
  "Folk",
  "Latin",
  "Reggae",
  "Dancehall",
  "Afrobeats",
  "Amapiano",
  "Gospel",
  "Soul",
  "Funk",
  "Metal",
  "Punk",
  "Indie",
  "Alternative",
  "Drill",
  "Trap",
  "Lo-Fi",
  "Ambient",
  "World Music",
  // Video
  "Podcast",
  "Comedy",
  "Gaming",
  "Sports",
  "News",
  "Education",
  "Lifestyle",
  "Vlog",
  "Short Film",
  "Animation",
  "Documentary",
] as const;

export type Genre = (typeof GENRES)[number];

const GENRE_TAG_REGEX = /^\[([^\]]+)\]\s*/;

/** Extract genre tag from a description string, e.g. "[Hip-Hop] ..." -> "Hip-Hop" */
export function parseGenre(description: string): Genre | null {
  const match = description.match(GENRE_TAG_REGEX);
  if (!match) return null;
  const tag = match[1] as Genre;
  return GENRES.includes(tag) ? tag : null;
}

/** Strip genre tag prefix from description for display */
export function stripGenre(description: string): string {
  return description.replace(GENRE_TAG_REGEX, "");
}

/** Prepend genre tag to a description */
export function prependGenre(genre: Genre, description: string): string {
  return `[${genre}] ${description}`;
}

const THOUGHT_GENRE_SUFFIX_REGEX = /\s*\[genre:([^\]]+)\]$/;

/** Extract genre tag from a thought/post content string, e.g. "Hello [genre:Hip-Hop]" -> "Hip-Hop" */
export function parseThoughtGenre(content: string): Genre | null {
  const match = content.match(THOUGHT_GENRE_SUFFIX_REGEX);
  if (!match) return null;
  const tag = match[1] as Genre;
  return GENRES.includes(tag) ? tag : null;
}

/** Strip genre tag suffix from thought content for display */
export function stripThoughtGenre(content: string): string {
  return content.replace(THOUGHT_GENRE_SUFFIX_REGEX, "");
}

/** Append genre tag to thought content */
export function appendThoughtGenre(genre: Genre, content: string): string {
  return `${content} [genre:${genre}]`;
}
