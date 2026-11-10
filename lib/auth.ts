export function safeInternalPath(value: string | null | undefined, fallback = "/salas") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const parsed = new URL(value, "https://show-english.invalid");
    if (parsed.origin !== "https://show-english.invalid") return fallback;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}
