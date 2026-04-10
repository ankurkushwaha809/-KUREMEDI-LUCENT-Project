/**
 * Centralized error handling utility for API calls
 * Extracts meaningful error messages from various error types
 */

export const getErrorMessage = (error) => {
  if (!error) return "An unknown error occurred";

  // If error has response (from Axios)
  if (error.response?.data) {
    const data = error.response.data;

    // Check for message field
    if (data.message) {
      return String(data.message);
    }

    // Check for success: false with msg
    if (data.msg) {
      return String(data.msg);
    }

    // Check for errors array (validation errors)
    if (Array.isArray(data.errors)) {
      return data.errors
        .map((e) => (typeof e === "string" ? e : e.message || String(e)))
        .join(", ");
    }

    // Check for error string
    if (data.error) {
      return String(data.error);
    }

    // Return whole data if it's a string
    if (typeof data === "string") {
      return data;
    }
  }

  // Check status codes
  if (error.response?.status) {
    const status = error.response.status;
    const statusMessages = {
      400: "Bad Request: " + (error.response.data?.message || "Invalid input"),
      401: "Unauthorized: Please log in again",
      403: "Forbidden: You don't have permission to perform this action",
      404: "Not Found: The requested resource does not exist",
      409: "Conflict: " + (error.response.data?.message || "This resource already exists"),
      413: "Request too large: File size exceeds maximum allowed",
      422: "Validation Error: " + (error.response.data?.message || "Please check your input"),
      429: "Too Many Requests: Please wait before trying again",
      500: "Server Error: " + (error.response.data?.message || "Something went wrong on the server"),
      502: "Service Unavailable: Bad Gateway - Server is not responding",
      503: "Service Unavailable: Server is temporarily unavailable",
      504: "Gateway Timeout: Request took too long",
    };

    if (statusMessages[status]) {
      return statusMessages[status];
    }

    return `HTTP Error ${status}: ${error.message || "Request failed"}`;
  }

  // Network error
  if (error.code === "ECONNABORTED") {
    return "Request timeout: The server is not responding. Please check your connection.";
  }

  if (error.message?.includes("Network") || error.message?.includes("network")) {
    return "Network or CORS Error: Could not reach API server. Check internet, API domain, and upload size limits.";
  }

  // Custom error message
  if (error.message) {
    return String(error.message);
  }

  // Last resort
  return "An unexpected error occurred. Please try again.";
};

/**
 * Formats error for display - truncates very long messages
 */
export const formatErrorDisplay = (error, maxLength = 200) => {
  const message = getErrorMessage(error);
  return message.length > maxLength ? message.substring(0, maxLength) + "..." : message;
};

/**
 * Logs error with context for debugging
 */
export const logError = (context, error) => {
  console.error(`[${context}]`, {
    message: error?.message,
    response: error?.response?.data,
    status: error?.response?.status,
    code: error?.code,
    fullError: error,
  });
};
