import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sports: defineTable({
    name: v.string(),
    logo: v.string(),
    color: v.string(),
    type: v.union(
      v.literal("formula"),
      v.literal("feeder"),
      v.literal("indycar"),
      v.literal("motogp"),
      v.literal("superbike"),
      v.literal("endurance"),
      v.literal("off-road"),
      v.literal("nascar")
    ),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_type", ["type"])
    .index("by_name", ["name"])
    .searchIndex("search_name", {
      searchField: "name",
    }),
  teams: defineTable({
    id: v.string(),
    name: v.string(),
    logo: v.string(),
    sport: v.id("sports"),
    tags: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
  })
    .index("by_sport", ["sport"])
    .index("by_name", ["name"])
    .searchIndex("search_name", {
      searchField: "name",
    }),
  drivers: defineTable({
    id: v.string(),
    name: v.string(),
    image: v.string(),
    sport: v.id("sports"),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_sport", ["sport"])
    .index("by_name", ["name"])
    .searchIndex("search_name", {
      searchField: "name",
    }),
  event_links: defineTable({
    instagram: v.optional(v.string()),
    youtube: v.optional(v.string()),
    discord: v.optional(v.string()),
    x: v.optional(v.string()),
    sources: v.optional(v.array(v.string())),
  }),
  events: defineTable({
    id: v.string(),
    title: v.string(),
    round: v.number(),
    type: v.union(
      v.literal("race"),
      v.literal("qualifying"),
      v.literal("practice"),
      v.literal("sprint"),
      v.literal("test"),
      v.literal("shootout"),
      v.literal("warmup"),
      v.literal("demo"),
      v.literal("news"),
      v.literal("announcement"),
      v.literal("update"),
      v.literal("watch-party")
    ),
    location: v.optional(v.array(v.number())),
    links_id: v.optional(v.id("event_links")),
    location_str: v.string(),
    sport_id: v.id("sports"),
    country_code: v.string(),
    country: v.string(),
    event_start_at: v.string(),
    event_end_at: v.string(),
    images: v.optional(v.array(v.string())),
  })
    .index("by_sport", ["sport_id"])
    .index("by_type", ["type"])
    .index("by_title", ["title"])
    .index("by_start", ["event_start_at"])
    .searchIndex("search_title", {
      searchField: "title",
    })
    .searchIndex("search_location", {
      searchField: "location_str",
    }),
});
