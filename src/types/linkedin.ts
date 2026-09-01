export interface Channel {
  userId: string;
  network: "linkedin";
  channelType: "linkedin_profile" | "linkedin_page";
  method: "app";
  accountId: string; // The LinkedIn URN (e.g., urn:li:person:12345 or urn:li:organization:67890)
  accessToken: string;
  tokenExpiry: number; // Unix timestamp in milliseconds
  proxy?: string; // Optional proxy URL (e.g. http://user:pass@host:port)
}

export interface PostData {
  text: string;
  link?: string;
  imageUrl?: string;
}
