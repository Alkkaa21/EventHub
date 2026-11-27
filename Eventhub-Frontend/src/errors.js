export const NETWORK_ERROR_MESSAGE = "Cannot connect to the server.";

// Keys whose messages should be shown without a "field: " prefix
const UNPREFIXED_KEYS = ["non_field_errors", "detail", "error"];

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Turns DRF validation data into one readable string.
// Handles: "text", ["a", "b"], {"field": ["a"]}, {"detail": "a"}
function flattenMessages(data) {
  if (data == null) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    return data.map(flattenMessages).filter(Boolean).join(" ");
  }
  if (typeof data === "object") {
    return Object.entries(data)
      .map(([field, value]) => {
        const text = flattenMessages(value);
        if (!text) return "";
        return UNPREFIXED_KEYS.includes(field) ? text : `${field}: ${text}`;
      })
      .filter(Boolean)
      .join(" ");
  }
  return String(data);
}

// Reads a failed Response and returns an ApiError with a friendly message.
export async function parseErrorResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Body was empty or not JSON (e.g. a Django HTML 500 page)
  }

  const status = response.status;
  let message;

  if (status === 401) {
    message = "Your session has expired. Please log in again.";
  } else if (status === 403) {
    message = "You don't have permission to do this.";
  } else if (status === 400) {
    message =
      flattenMessages(data) || "Invalid request. Please check your input.";
  } else if (status >= 500) {
    message = "Server error, please try again later.";
  } else {
    message =
      flattenMessages(data) || "Something went wrong. Please try again.";
  }

  return new ApiError(message, status);
}

// Call right after fetch/apiFetch: does nothing if OK, throws ApiError if not.
export async function throwIfNotOk(response) {
  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
}

// Use in catch blocks to get the message to show the user.
export function getErrorMessage(err) {
  if (err instanceof ApiError) return err.message;
  // fetch() rejects with a TypeError when the server can't be reached
  if (err instanceof TypeError) return NETWORK_ERROR_MESSAGE;
  return err?.message || "Something went wrong. Please try again.";
}