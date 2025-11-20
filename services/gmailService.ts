// Using Google Identity Services v2 (Token Model) + Raw Fetch API
// This ensures compatibility with GitHub Pages (Serverless)

declare var google: any;

let tokenClient: any;
let accessToken: string | null = null;

export const initTokenClient = (
  clientId: string,
  onTokenReceived: () => void
) => {
  if (!window.google) {
    console.error("Google Identity Services script not loaded.");
    return;
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    callback: (tokenResponse: any) => {
      if (tokenResponse && tokenResponse.access_token) {
        accessToken = tokenResponse.access_token;
        onTokenReceived();
      }
    },
  });
};

export const triggerAuth = () => {
  if (tokenClient) {
    // prompt: '' skips consent if already granted
    tokenClient.requestAccessToken({ prompt: "" });
  } else {
    console.error("Token client not initialized");
  }
};

export const fetchEmailsSince = async (timestamp: number) => {
  if (!accessToken) throw new Error("No access token");

  // Convert timestamp to seconds for Gmail query (after:EPOCH)
  // If timestamp is 0 (first run), we scan last 30 days to be safe, or just don't filter by date
  const dateQuery =
    timestamp > 0 ? ` after:${Math.floor(timestamp / 1000)}` : "";
  const query = `(subject:(application OR interview OR offer OR rejected OR assessment) OR from:(recruiter OR talent OR careers))${dateQuery}`;

  try {
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=${encodeURIComponent(
      query
    )}`;
    const listResponse = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const listData = await listResponse.json();
    if (!listData.messages) return [];

    return listData.messages; // Returns array of { id, threadId }
  } catch (error) {
    console.error("Error fetching message list:", error);
    return [];
  }
};

export const fetchEmailDetails = async (messageId: string) => {
  if (!accessToken) throw new Error("No access token");

  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();

    const headers = data.payload.headers;
    const subject =
      headers.find((h: any) => h.name === "Subject")?.value || "No Subject";
    const from =
      headers.find((h: any) => h.name === "From")?.value || "Unknown";
    const snippet = data.snippet;

    // Decode Body
    let body = snippet;
    if (data.payload.parts) {
      const textPart = data.payload.parts.find(
        (p: any) => p.mimeType === "text/plain"
      );
      if (textPart && textPart.body.data) {
        // URL-safe Base64 decode
        body = new TextDecoder().decode(
          Uint8Array.from(
            atob(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/")),
            (c) => c.charCodeAt(0)
          )
        );
      }
    } else if (data.payload.body && data.payload.body.data) {
      body = new TextDecoder().decode(
        Uint8Array.from(
          atob(data.payload.body.data.replace(/-/g, "+").replace(/_/g, "/")),
          (c) => c.charCodeAt(0)
        )
      );
    }

    return {
      id: messageId,
      subject,
      sender: from,
      snippet,
      body,
      date: new Date(parseInt(data.internalDate)).toISOString(),
    };
  } catch (error) {
    console.error(`Error details for ${messageId}:`, error);
    return null;
  }
};
