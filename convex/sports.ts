import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const sportTypeValidator = v.union(
  v.literal("formula"),
  v.literal("feeder"),
  v.literal("indycar"),
  v.literal("motogp"),
  v.literal("superbike"),
  v.literal("endurance"),
  v.literal("off-road"),
  v.literal("nascar")
);

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
    filterType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? DEFAULT_PAGE;
    const limit = args.limit ?? DEFAULT_LIMIT;
    const sortBy = args.sortBy ?? "_creationTime";
    const sortOrder = args.sortOrder ?? "desc";

    let items = await ctx.db.query("sports").collect();

    const nameFilter = normalizeFilter(args.filterName);
    if (nameFilter) {
      items = items.filter((sport) => sport.name.toLowerCase().includes(nameFilter));
    }
    if (args.filterType) {
      items = items.filter((sport) => sport.type === args.filterType);
    }

    items.sort((a, b) => {
      const getValue = (item: any) => {
        if (sortBy === "_creationTime") {
          return item._creationTime;
        }
        if (sortBy === "name") return item.name;
        if (sortBy === "type") return item.type;
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
  args: { id: v.id("sports") },
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
      name: v.string(),
      logo: v.string(),
      color: v.string(),
      type: sportTypeValidator,
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("sports", args.data);
    const doc = await ctx.db.get(id);
    return doc ? toClient(doc) : null;
  },
});

export const update = mutation({
  args: {
    id: v.id("sports"),
    data: v.object({
      name: v.optional(v.string()),
      logo: v.optional(v.string()),
      color: v.optional(v.string()),
      type: v.optional(sportTypeValidator),
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
  args: { id: v.id("sports") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true, id: args.id };
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("sports").collect();
    for (const item of items) {
      await ctx.db.delete(item._id as Id<"sports">);
    }
    return { success: true, deleted: items.length };
  },
});
