/**
 * TypeScript types for database collections
 */

export type SportsType =
  | "formula"
  | "feeder"
  | "indycar"
  | "motogp"
  | "superbike"
  | "endurance"
  | "off road"
  | "nascar";

export type EventType =
  | "race"
  | "qualifying"
  | "practice"
  | "sprint"
  | "test"
  | "shootout"
  | "warmup"
  | "demo"
  | "news"
  | "announcement"
  | "update"
  | "watch party";

export type Location = [number, number];

export interface EventLinks {
  convexId: string;
  instagram?: string;
  youtube?: string;
  discord?: string;
  x?: string;
  sources?: string[];
}

export interface Sport {
  convexId: string;
  name: string;
  logo: string;
  color: string;
  type: SportsType;
  tags?: string[];
}

export interface Event {
  convexId: string;
  id: string;
  title: string;
  round: number;
  type: EventType;
  location?: Location; // GPS coordinates [lat, long] - Optional
  links_id?: string; // Reference to event_links collection (if using separate links collection)
  location_str: string; // Human-readable location string
  sport_id: string; // Reference to Sport.convexId
  country_code: string;
  country: string;
  event_start_at: string; // ISO Date String
  event_end_at: string; // ISO Date String
  images?: string[];
}

export interface Team {
  convexId: string;
  id: string;
  name: string;
  logo: string;
  sport: string; // Reference to Sport.convexId
  tags?: string[];
  color?: string;
}

export interface Driver {
  convexId: string;
  id: string;
  name: string;
  image: string;
  sport: string; // Reference to Sport.convexId
  tags?: string[];
}

/**
 * Helper types for creating documents (without system fields)
 */
export type CreateSport = Omit<Sport, "convexId">;
export type CreateEvent = Omit<Event, "convexId">;
export type CreateTeam = Omit<Team, "convexId">;
export type CreateDriver = Omit<Driver, "convexId">;

/**
 * Parsed versions with resolved relations
 * Use these when you need to include expanded/resolved relationship data
 */
export interface EventParsed extends Event {
  location?: Location;
  links?: EventLinks;
  sportData?: Sport; // Resolved sport reference
}

export interface TeamParsed extends Team {
  sportData?: Sport; // Resolved sport reference
}

export interface DriverParsed extends Driver {
  sportData?: Sport; // Resolved sport reference
}

/**
 * Relationship Notes:
 *
 * - Event.sport -> Sport.convexId (Many-to-One)
 * - Team.sport -> Sport.convexId (Many-to-One)
 * - Driver.sport -> Sport.convexId (Many-to-One)
 * - Event.links_id -> EventLinks.convexId (Many-to-One, Optional)
 *
 * For simple use cases, you can store location data directly in the location_str field
 * and skip creating separate location/links collections.
 */
