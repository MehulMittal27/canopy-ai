import { getMyOrg, updateMyOrg, type Org } from "@/lib/api/orgs";

export type NewsPreferences = {
  countries: string[];
  topics: string[];
  languages: string[];
  trustedDomains: string[];
};

export function normalizeNewsPreferences(org: Org | null): NewsPreferences {
  if (!org) {
    return {
      countries: [],
      topics: [],
      languages: [],
      trustedDomains: [],
    };
  }

  return {
    countries: preferArray(org.news_countries, org.country ? [org.country] : []),
    topics: preferArray(org.news_topics, org.topics ?? []),
    languages: preferArray(org.news_languages, org.languages ?? []),
    trustedDomains: preferArray(org.trusted_news_domains, []),
  };
}

export async function getMyNewsPreferences(): Promise<NewsPreferences> {
  return normalizeNewsPreferences(await getMyOrg());
}

export async function updateMyNewsPreferences(
  preferences: NewsPreferences,
): Promise<NewsPreferences> {
  const org = await updateMyOrg({
    news_countries: cleanList(preferences.countries),
    news_topics: cleanList(preferences.topics),
    news_languages: cleanList(preferences.languages),
    trusted_news_domains: cleanDomains(preferences.trustedDomains),
  });

  return normalizeNewsPreferences(org);
}

function preferArray(primary: string[] | null, fallback: string[]) {
  return primary && primary.length > 0 ? primary : fallback;
}

export function cleanList(values: readonly string[]) {
  return dedupe(values.map((value) => value.trim()).filter(Boolean));
}

export function cleanDomains(values: readonly string[]) {
  return dedupe(
    values
      .map((value) =>
        value
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/.*$/, ""),
      )
      .filter(Boolean),
  );
}

function dedupe(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}
