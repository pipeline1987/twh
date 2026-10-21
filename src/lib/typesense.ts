import { connection } from "next/server";
import Typesense from "typesense";

export const TYPESENSE_COLLECTION = "herald_articles";

export function getTypesenseConfig() {
  return {
    host: process.env.TYPESENSE_HOST ?? "localhost",
    port: Number(process.env.TYPESENSE_PORT ?? 8108),
    protocol: process.env.TYPESENSE_PROTOCOL ?? "http",
    apiKey: process.env.TYPESENSE_API_KEY ?? "wizardherald-dev",
  };
}

export async function getTypesenseClient() {
  await connection();
  const config = getTypesenseConfig();
  return new Typesense.Client({
    nodes: [
      {
        host: config.host,
        port: config.port,
        protocol: config.protocol,
      },
    ],
    apiKey: config.apiKey,
    connectionTimeoutSeconds: 8,
  });
}

export async function typesenseAvailable() {
  try {
    const client = await getTypesenseClient();
    await client.health.retrieve();
    return true;
  } catch {
    return false;
  }
}
