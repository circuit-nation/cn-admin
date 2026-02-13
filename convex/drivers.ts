import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

function normalizeFilter(value?: string) {
  return value?.trim().toLowerCase();
}

function compareValues(a: string | number | undefined, b: string | number | undefined, order: "asc" | "desc") {
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
    filterName: v.optional(v.string()),
    filterSport: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? DEFAULT_PAGE;
    const limit = args.limit ?? DEFAULT_LIMIT;
    const sortBy = args.sortBy ?? "_creationTime";
    const sortOrder = args.sortOrder ?? "desc";

    let items = await ctx.db.query("drivers").collect();

    const nameFilter = normalizeFilter(args.filterName);
    if (nameFilter) {
      items = items.filter((driver) => driver.name.toLowerCase().includes(nameFilter));
    }
    if (args.filterSport) {
      items = items.filter((driver) => driver.sport === args.filterSport);
    }

    items.sort((a, b) => {
      const getValue = (item: any) => {
        if (sortBy === "_creationTime") {
          return item._creationTime;
        }
        if (sortBy === "name") return item.name;
        if (sortBy === "sport") return item.sport;
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
  args: { id: v.id("drivers") },
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
      id: v.string(),
      name: v.string(),
      image: v.string(),
      sport: v.id("sports"),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("drivers", args.data);
    const doc = await ctx.db.get(id);
    return doc ? toClient(doc) : null;
  },
});

export const update = mutation({
  args: {
    id: v.id("drivers"),
    data: v.object({
      id: v.optional(v.string()),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      sport: v.optional(v.id("sports")),
      tags: v.optional(v.array(v.string())),
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
  args: { id: v.id("drivers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true, id: args.id };
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("drivers").collect();
    for (const item of items) {
      await ctx.db.delete(item._id as Id<"drivers">);
    }
    return { success: true, deleted: items.length };
  },
});
