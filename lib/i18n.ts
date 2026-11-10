import messages from "./messages.json";
export type Locale = "pt-BR" | "en" | "es" | "fr" | "it";
export const dictionary: Record<Locale, Record<string, string>> = messages;
