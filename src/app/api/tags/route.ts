import { NextRequest, NextResponse } from "next/server";
import { TagController } from "@/controllers/tag-controller";

// GET /api/tags - Get all tags or search tags
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q");
		const popular = searchParams.get("popular");

		if (popular === "true") {
			const popularTags = await TagController.getPopularTags();
			return NextResponse.json({
				success: true,
				data: popularTags,
			});
		}

		if (query) {
			const searchResults = await TagController.searchTags(query);
			return NextResponse.json({
				success: true,
				data: searchResults,
			});
		}

		const tags = await TagController.getAllTags();
		return NextResponse.json({
			success: true,
			data: tags,
		});
	} catch (error) {
		console.error("Error fetching tags:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch tags" },
			{ status: 500 }
		);
	}
}

// POST /api/tags/suggest - Get tag suggestions based on text
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { title, description } = body;

		if (!title && !description) {
			return NextResponse.json(
				{ success: false, error: "Title or description is required" },
				{ status: 400 }
			);
		}

		const suggestions = await TagController.generateTagSuggestions({
			title,
			description,
		});

		return NextResponse.json({
			success: true,
			data: suggestions,
		});
	} catch (error) {
		console.error("Error generating tag suggestions:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to generate suggestions" },
			{ status: 500 }
		);
	}
}
