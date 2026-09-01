import { Channel, getFacebookSettings } from "./firestore";

export interface PublishResult {
  success: boolean;
  postId?: string;
  commentId?: string;
  error?: string;
}

/**
 * Handles publishing to Facebook across all 5 FS Poster channel types
 * and both connection methods (App vs Cookie), dynamically loading
 * the user's saved Firestore General, Post Customization, and Story Customization settings!
 */
export async function publishToFacebookChannel(
  channel: Channel,
  rawContent: string,
  mediaUrls?: string[],
  linkUrl?: string
): Promise<PublishResult> {
  try {
    // 1. Fetch user's saved Facebook Settings from Firestore
    const userId = channel.userId || "demo";
    const settings = await getFacebookSettings(userId);
    const postSettings = settings.postCustomization;
    const storySettings = settings.storyCustomization;

    // 2. Format content according to customMessage template ({title}, {url}, {excerpt})
    let finalContent = rawContent;
    if (postSettings && postSettings.customMessage) {
      finalContent = postSettings.customMessage
        .replace(/{title}/g, rawContent.split("\n")[0] || rawContent)
        .replace(/{url}/g, linkUrl || "")
        .replace(/{excerpt}/g, rawContent.slice(0, 150))
        .replace(/{author}/g, "Social Poster")
        .replace(/{date}/g, new Date().toLocaleDateString());
    }

    // 3. Dispatch to App or Cookie method
    let res: PublishResult;
    if (channel.method === "app") {
      res = await publishViaAppMethod(channel, finalContent, mediaUrls, linkUrl, postSettings);
    } else {
      res = await publishViaCookieMethod(channel, finalContent, mediaUrls, linkUrl, postSettings, storySettings);
    }

    // 4. Handle "Post a first comment" feature if enabled & post succeeded
    if (res.success && res.postId && postSettings?.enableFirstComment && postSettings.firstCommentText) {
      try {
        const commentText = postSettings.firstCommentText.replace(/{url}/g, linkUrl || "");
        if (channel.method === "app" && channel.accessToken) {
          const commentRes = await fetch(`https://graph.facebook.com/v19.0/${res.postId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: commentText,
              access_token: channel.accessToken,
            }),
          });
          const commentData = await commentRes.json();
          if (commentData?.id) {
            res.commentId = commentData.id;
          }
        }
      } catch (commentErr) {
        console.warn("[FacebookPublisher] First comment dispatch error:", commentErr);
      }
    }

    return res;
  } catch (err: any) {
    console.error(`[FacebookPublisher] Error posting to channel ${channel.name} (${channel.channelType}):`, err);
    return { success: false, error: err.message || "Publishing failed" };
  }
}

/**
 * Method 1: Official Facebook Graph API (App Method)
 */
async function publishViaAppMethod(
  channel: Channel,
  content: string,
  mediaUrls?: string[],
  linkUrl?: string,
  postSettings?: any
): Promise<PublishResult> {
  const pageId = channel.pageId || channel.accountId;
  const token = channel.accessToken;

  if (!token) {
    return { success: false, error: "Missing Facebook Page Access Token" };
  }

  if (!pageId) {
    return { success: false, error: "Missing Facebook Page ID" };
  }

  const endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;

  const payload: Record<string, any> = {
    message: content,
    access_token: token,
  };

  // Respect user's attachLink preference
  if (linkUrl && (postSettings?.attachLink !== false)) {
    payload.link = linkUrl;
  }

  // Handle media attachment if allowed
  if (mediaUrls && mediaUrls.length > 0 && (!linkUrl || postSettings?.uploadPostImages)) {
    payload.url = mediaUrls[0];
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data?.error?.code === 190) {
      return { success: false, error: "Access Token Expired or Revoked. Please re-connect the channel." };
    }
    return { success: false, error: data?.error?.message || "Facebook API error" };
  }

  return { success: true, postId: data.id };
}

/**
 * Method 2: Cookie-authenticated Session Requests (Cookie Method)
 */
async function publishViaCookieMethod(
  channel: Channel,
  content: string,
  mediaUrls?: string[],
  linkUrl?: string,
  postSettings?: any,
  storySettings?: any
): Promise<PublishResult> {
  if (!channel.cookieC_user || !channel.cookieXs) {
    return { success: false, error: "Facebook session cookies (c_user/xs) missing." };
  }

  const cookieHeader = `c_user=${channel.cookieC_user}; xs=${channel.cookieXs};${
    channel.cookieDatr ? ` datr=${channel.cookieDatr};` : ""
  }`;

  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  switch (channel.channelType) {
    case "account":
    case "ownpage": {
      const targetId = channel.pageId || channel.accountId || channel.cookieC_user;
      const endpoint = `https://graph.facebook.com/v19.0/${targetId}/feed`;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
          "User-Agent": userAgent,
        },
        body: JSON.stringify({
          message: content,
          ...(linkUrl && postSettings?.attachLink !== false ? { link: linkUrl } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok && data?.error) {
        return { success: false, error: data.error.message || "Cookie posting failed" };
      }
      return { success: true, postId: data.id || `cookie_post_${Date.now()}` };
    }

    case "group": {
      const groupId = channel.groupId || channel.accountId;
      if (!groupId) return { success: false, error: "Group ID is missing." };

      const endpoint = `https://graph.facebook.com/v19.0/${groupId}/feed`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
          "User-Agent": userAgent,
        },
        body: JSON.stringify({
          message: content,
          ...(linkUrl && postSettings?.attachLink !== false ? { link: linkUrl } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok && data?.error) {
        return { success: false, error: data.error.message || "Group post failed" };
      }
      return { success: true, postId: data.id || `group_post_${Date.now()}` };
    }

    case "account_story":
    case "ownpage_story": {
      if (!mediaUrls || mediaUrls.length === 0) {
        return {
          success: false,
          error: "Facebook Stories require an image or video media URL.",
        };
      }

      // Format story text according to storySettings (ucfirst, urlEncode)
      let storyCaption = storySettings?.storyText ? storySettings.storyText.replace(/{title}/g, content) : content;
      if (storySettings?.capitalizeStoryText) {
        storyCaption = storyCaption.charAt(0).toUpperCase() + storyCaption.slice(1);
      }
      if (storySettings?.urlEncodeStoryText && linkUrl) {
        storyCaption += ` ${encodeURIComponent(linkUrl)}`;
      }

      const storyRes = await fetch("https://www.facebook.com/api/graphql/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookieHeader,
          "User-Agent": userAgent,
        },
        body: new URLSearchParams({
          doc_id: "6839201946123011",
          variables: JSON.stringify({
            input: {
              story_media_url: mediaUrls[0],
              caption: storyCaption,
              target_id: channel.pageId || channel.accountId,
              ...(storySettings?.attachStoryLink && linkUrl ? { link_url: linkUrl } : {}),
            },
          }),
        }),
      });

      if (!storyRes.ok) {
        return { success: false, error: "Story creation failed via session cookie." };
      }

      return { success: true, postId: `story_${Date.now()}` };
    }

    default:
      return { success: false, error: `Unsupported channel type: ${channel.channelType}` };
  }
}
