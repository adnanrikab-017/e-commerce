export class ApiRequestError extends Error {
  constructor(message, { status = 0, details, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

function firstValidationError(details) {
  const fieldErrors = details?.fieldErrors;
  if (!fieldErrors) return null;
  return Object.values(fieldErrors).flat().find(Boolean) || null;
}

export async function fetchJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { credentials: "same-origin", ...options });
  } catch (error) {
    throw new ApiRequestError(`Could not reach ${url}. Check that the application server is running and try again.`, { cause: error });
  }

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiRequestError(`The server returned an invalid response for ${url} (HTTP ${response.status}).`, { status: response.status });
    }
  }

  if (!response.ok) {
    const validationError = firstValidationError(data.details);
    const debug = process.env.NODE_ENV === "development" ? data.details?.debug : null;
    const message = validationError || data.error || `Request failed with HTTP ${response.status}`;
    throw new ApiRequestError(debug && debug !== message ? `${message}: ${debug}` : message, {
      status: response.status,
      details: data.details,
    });
  }
  return data;
}
