const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(`${iso}T00:00:00.000Z`));
}

export function formatShortDate(iso: string) {
  return shortDateFormatter.format(new Date(`${iso}T00:00:00.000Z`));
}

export function issueNumber(articleCount: number) {
  return (6400 + articleCount).toLocaleString("en-GB");
}
