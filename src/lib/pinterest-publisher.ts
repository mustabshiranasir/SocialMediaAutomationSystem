import { Channel } from "./firestore";

export interface PinterestPublishResult {
  success: boolean;
  pinId?: string;
  error?: string;
}

export async function publishToPinterestChannel(
  channel: Channel,
  content: string,
  mediaUrls?: string[],
  linkUrl?: string
): Promise<PinterestPublishResult> {
  try {
    const accessToken = channel.accessToken;
    if (!accessToken) {
      return { success: false, error: "Missing Pinterest Access Token." };
    }

    if (!mediaUrls || mediaUrls.length === 0) {
      return { success: false, error: "Pinterest requires an image or media URL." };
    }

    // 1. Fetch user's boards
    const boardsRes = await fetch("https://api.pinterest.com/v5/boards", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!boardsRes.ok) {
      return { success: false, error: "Failed to fetch Pinterest boards." };
    }

    const boardsData = await boardsRes.json();
    const boards = boardsData.items;

    if (!boards || boards.length === 0) {
      return { success: false, error: "No Pinterest boards found for this account." };
    }

    // Since we don't have a board selector UI yet, default to the first board
    const targetBoardId = boards[0].id;

    // 2. Publish Pin
    const pinPayload: any = {
      board_id: targetBoardId,
      media_source: {
        source_type: "image_url",
        url: mediaUrls[0],
      },
      title: content.split("\n")[0].substring(0, 100), // First line as title
      description: content.substring(0, 499),
    };

    if (linkUrl) {
      pinPayload.link = linkUrl;
    }

    const pinRes = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pinPayload),
    });

    if (!pinRes.ok) {
      return { success: false, error: "Failed to publish Pin." };
    }

    const pinData = await pinRes.json();
    return { success: true, pinId: pinData.id };

  } catch (err: any) {
    console.error(`[PinterestPublisher] Error posting to channel ${channel.name}:`, err);
    return { success: false, error: err.message || "Pinterest publishing failed" };
  }
}
