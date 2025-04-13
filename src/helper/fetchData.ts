export const fetchData = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Fetch failed");
  }
  return response.json();
};

export const fetchAuth = async (
  url: string,
  token: string,
  options: RequestInit = {}
) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Fetch failed");
  }
  return response.json();
};
