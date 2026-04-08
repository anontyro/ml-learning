import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { parse } from "csv-parse";
import { Transform } from "node:stream";
import { z } from "zod";
import { join } from "path";

const nullableInt = z
  .string()
  .transform((s) => {
    const trimmed = s.trim();
    if (trimmed === "" || trimmed === "N/A") return null;
    const n = parseInt(trimmed, 10);
    return isNaN(n) ? null : n;
  })
  .pipe(z.number().int().nullable());

const requiredInt = z
  .string()
  .transform((s) => parseInt(s.trim(), 10))
  .pipe(z.number().int());

const requiredFloat = z
  .string()
  .transform((s) => parseFloat(s.trim()))
  .pipe(z.number());

const semicolonList = z.string().transform((s) =>
  s
    ? s
        .split(";")
        .map((v) => v.trim())
        .filter(Boolean)
    : [],
);

export const BoardGameSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  primaryName: z.string(),
  yearpublished: requiredInt,
  rank: requiredInt,
  bayesaverage: requiredFloat,
  average: requiredFloat,
  usersrated: requiredInt,
  is_expansion: z
    .string()
    .transform((s) => s === "1")
    .pipe(z.boolean()),
  abstracts_rank: nullableInt,
  cgs_rank: nullableInt,
  childrensgames_rank: nullableInt,
  familygames_rank: nullableInt,
  partygames_rank: nullableInt,
  strategygames_rank: nullableInt,
  thematic_rank: nullableInt,
  wargames_rank: nullableInt,
  description: z.string(),
  minplayers: nullableInt,
  maxplayers: nullableInt,
  playingtime: nullableInt,
  minage: nullableInt,
  categories: semicolonList,
  mechanics: semicolonList,
});

export type BoardGame = z.infer<typeof BoardGameSchema>;

export interface ParseOptions {
  /** Number of rows to skip from the start (default: 0) */
  skip?: number;
  /** Maximum number of rows to return (default: unlimited) */
  limit?: number;
}

export interface ParseResult {
  games: BoardGame[];
  failures: Array<{ id: string; reason: string }>;
}

export const parseBoardGames = async (options?: ParseOptions): Promise<ParseResult> => {
  const pathToCSV = join(process.cwd(), "../../data/boardgames_enriched.csv");
  return parseBoardGameCSV(pathToCSV, options);
};

export async function parseBoardGameCSV(
  filePath: string,
  { skip = 0, limit }: ParseOptions = {},
): Promise<ParseResult> {
  const games: BoardGame[] = [];
  const failures: Array<{ id: string; reason: string }> = [];
  let rowIndex = 0;

  const rowProcessor = new Transform({
    objectMode: true,
    transform(raw: Record<string, string>, _encoding, callback) {
      const currentIndex = rowIndex++;

      if (currentIndex < skip) {
        callback();
        return;
      }

      if (limit !== undefined && games.length >= limit) {
        callback();
        return;
      }

      const result = BoardGameSchema.safeParse(raw);
      if (!result.success) {
        failures.push({
          id: raw.id || "(unknown)",
          reason: result.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(", "),
        });
        callback();
        return;
      }
      games.push(result.data);
      callback();
    },
  });

  await pipeline(
    createReadStream(filePath),
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: false,
      bom: true,
      relax_column_count: true,
    }),
    rowProcessor,
  );

  return { games, failures };
}
