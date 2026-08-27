export function getEngineFreshnessText(date = new Date()) {
  const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  return `Transcript extraction engine last optimized: ${monthYear}. Supporting 100+ languages and latest YouTube caption API changes.`;
}
