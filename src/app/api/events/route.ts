import { NextRequest, NextResponse } from "next/server";
import { getAppwriteDatabase, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "node-appwrite";

/**
 * GET /api/events - Fetch all events or a single event by ID
 * Query params:
 * - id: (optional) document ID for single document fetch
 * - page: (optional) page number for pagination (default: 1)
 * - limit: (optional) items per page (default: 10)
 * - sortBy: (optional) field to sort by (default: "event_start_at")
 * - sortOrder: (optional) "asc" or "desc" (default: "desc")
 * - filterTitle: (optional) filter by title (partial match)
 * - filterType: (optional) filter by type
 * - filterLocation: (optional) filter by location_str (partial match)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "event_start_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const filterTitle = searchParams.get("filterTitle");
    const filterType = searchParams.get("filterType");
    const filterLocation = searchParams.get("filterLocation");

    const database = getAppwriteDatabase();

    // Fetch single document if ID is provided
    if (documentId) {
      const document = await database.getDocument(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        documentId
      );
      return NextResponse.json(document);
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build queries array
    const queries: string[] = [];

    // Add sorting
    if (sortOrder === "asc") {
      queries.push(Query.orderAsc(sortBy));
    } else {
      queries.push(Query.orderDesc(sortBy));
    }

    // Add filters
    if (filterTitle) {
      queries.push(Query.search("title", filterTitle));
    }
    if (filterType) {
      queries.push(Query.equal("type", filterType));
    }
    if (filterLocation) {
      queries.push(Query.search("location_str", filterLocation));
    }

    // Add pagination
    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));

    // Fetch list of documents with pagination, sorting, and filtering
    const documents = await database.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENTS,
      queries
    );

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error("GET Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch events" },
      { status: error.code || 500 }
    );
  }
}

/**
 * POST /api/events - Create a new event
 * Body should include event data matching the schema
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const database = getAppwriteDatabase();

    const document = await database.createDocument(
      DATABASE_ID,
      COLLECTIONS.EVENTS,
      "unique()",
      data
    );

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("POST Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: error.code || 500 }
    );
  }
}

/**
 * PUT /api/events - Update an existing event
 * Body should include:
 * - id: document ID
 * - data: updated event data
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

    const database = getAppwriteDatabase();

    const document = await database.updateDocument(
      DATABASE_ID,
      COLLECTIONS.EVENTS,
      id,
      data
    );

    return NextResponse.json(document);
  } catch (error: any) {
    console.error("PUT Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update event" },
      { status: error.code || 500 }
    );
  }
}

/**
 * DELETE /api/events - Delete an event
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

    const database = getAppwriteDatabase();

    await database.deleteDocument(DATABASE_ID, COLLECTIONS.EVENTS, documentId);

    return NextResponse.json({ success: true, id: documentId });
  } catch (error: any) {
    console.error("DELETE Events API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete event" },
      { status: error.code || 500 }
    );
  }
}
