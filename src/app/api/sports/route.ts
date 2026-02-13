import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-server";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

/**
 * GET /api/sports - Fetch all sports or a single sport by ID
 * Query params:
 * - id: (optional) document ID for single document fetch
 * - page: (optional) page number for pagination (default: 1)
 * - limit: (optional) items per page (default: 10)
 * - sortBy: (optional) field to sort by (default: "$createdAt")
 * - sortOrder: (optional) "asc" or "desc" (default: "desc")
 * - filterName: (optional) filter by name (partial match)
 * - filterType: (optional) filter by type
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "_creationTime";
    const rawSortOrder = searchParams.get("sortOrder");
    const sortOrder = rawSortOrder === "asc" || rawSortOrder === "desc" ? rawSortOrder : "desc";
    const filterName = searchParams.get("filterName");
    const filterType = searchParams.get("filterType");

    const client = getConvexClient();

    // Fetch single document if ID is provided
    if (documentId) {
      const document = await client.query(api.sports.get, {
        id: documentId as Id<"sports">,
      });
      return NextResponse.json(document);
    }

    const documents = await client.query(api.sports.list, {
      page,
      limit,
      sortBy,
      sortOrder,
      filterName: filterName || undefined,
      filterType: filterType || undefined,
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error("GET Sports API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sports" },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/sports - Create a new sport
 * Body should include sport data matching the schema
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const client = getConvexClient();

    const document = await client.mutation(api.sports.create, { data });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("POST Sports API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sport" },
      { status: error.code || 500 }
    );
  }
}

/**
 * PUT /api/sports - Update an existing sport
 * Body should include:
 * - id: document ID
 * - data: updated sport data
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const client = getConvexClient();

    const document = await client.mutation(api.sports.update, {
      id: id as Id<"sports">,
      data,
    });

    return NextResponse.json(document);
  } catch (error: any) {
    console.error("PUT Sports API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update sport" },
      { status: error.code || 500 }
    );
  }
}

/**
 * DELETE /api/sports - Delete a sport
 * Query params:
 * - id: document ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const client = getConvexClient();

    await client.mutation(api.sports.remove, {
      id: documentId as Id<"sports">,
    });

    return NextResponse.json({ success: true, id: documentId });
  } catch (error: any) {
    console.error("DELETE Sports API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete sport" },
      { status: error.code || 500 }
    );
  }
}
