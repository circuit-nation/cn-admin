import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-server";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

/**
 * GET /api/teams - Fetch all teams or a single team by ID
 * Query params:
 * - id: (optional) document ID for single document fetch
 * - page: (optional) page number for pagination (default: 1)
 * - limit: (optional) items per page (default: 10)
 * - sortBy: (optional) field to sort by (default: "$createdAt")
 * - sortOrder: (optional) "asc" or "desc" (default: "desc")
 * - filterName: (optional) filter by name (partial match)
 * - filterSport: (optional) filter by sport ID
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
    const filterSport = searchParams.get("filterSport");

    const client = getConvexClient();

    // Fetch single document if ID is provided
    if (documentId) {
      const document = await client.query(api.teams.get, {
        id: documentId as Id<"teams">,
      });
      return NextResponse.json(document);
    }

    const documents = await client.query(api.teams.list, {
      page,
      limit,
      sortBy,
      sortOrder,
      filterName: filterName || undefined,
      filterSport: filterSport || undefined,
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error("GET Teams API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch teams" },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/teams - Create a new team
 * Body should include team data matching the schema
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const client = getConvexClient();

    const document = await client.mutation(api.teams.create, { data });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("POST Teams API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create team" },
      { status: error.code || 500 }
    );
  }
}

/**
 * PUT /api/teams - Update an existing team
 * Body should include:
 * - id: document ID
 * - data: updated team data
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

    const document = await client.mutation(api.teams.update, {
      id: id as Id<"teams">,
      data,
    });

    return NextResponse.json(document);
  } catch (error: any) {
    console.error("PUT Teams API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update team" },
      { status: error.code || 500 }
    );
  }
}

/**
 * DELETE /api/teams - Delete a team
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

    await client.mutation(api.teams.remove, {
      id: documentId as Id<"teams">,
    });

    return NextResponse.json({ success: true, id: documentId });
  } catch (error: any) {
    console.error("DELETE Teams API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete team" },
      { status: error.code || 500 }
    );
  }
}
