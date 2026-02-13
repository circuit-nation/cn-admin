import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

function compareValues(
  a: string | number | undefined,
  b: string | number | undefined,
  order: "asc" | "desc"
) {
  const direction = order === "asc" ? 1 : -1;
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1 * direction;
  if (b === undefined) return -1 * direction;
  if (a < b) return -1 * direction;
  if (a > b) return 1 * direction;
  return 0;
}

function toClient(doc: any) {
  return {
    ...doc,
    convexId: doc._id,
  };
}

export const list = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? DEFAULT_PAGE;
    const limit = args.limit ?? DEFAULT_LIMIT;
    const sortBy = args.sortBy ?? "_creationTime";
    const sortOrder = args.sortOrder ?? "desc";

    const items = await ctx.db.query("event_links").collect();

    items.sort((a, b) => {
      const getValue = (item: any) => {
        if (sortBy === "_creationTime") {
          return item._creationTime;
        }
        return item[sortBy];
      };
      return compareValues(getValue(a), getValue(b), sortOrder);
    });

    const total = items.length;
    const start = (page - 1) * limit;
    const documents = items.slice(start, start + limit).map(toClient);

    return { total, documents };
  },
});

export const get = query({
  args: { id: v.id("event_links") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      return null;
    }
    return toClient(doc);
  },
});

export const create = mutation({
  args: {
    data: v.object({
      instagram: v.optional(v.string()),
      youtube: v.optional(v.string()),
      discord: v.optional(v.string()),
      x: v.optional(v.string()),
      sources: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("event_links", args.data);
    const doc = await ctx.db.get(id);
    return doc ? toClient(doc) : null;
  },
});

export const update = mutation({
  args: {
    id: v.id("event_links"),
    data: v.object({
      instagram: v.optional(v.string()),
      youtube: v.optional(v.string()),
      discord: v.optional(v.string()),
      x: v.optional(v.string()),
      sources: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {};
    Object.entries(args.data).forEach(([key, value]) => {
      if (value !== undefined) {
        patch[key] = value;
      }
    });
    await ctx.db.patch(args.id, patch);
    const doc = await ctx.db.get(args.id);
    return doc ? toClient(doc) : null;
  },
});

export const remove = mutation({
  args: { id: v.id("event_links") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true, id: args.id };
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("event_links").collect();
    for (const item of items) {
      await ctx.db.delete(item._id as Id<"event_links">);
    }
    return { success: true, deleted: items.length };
  },
});
