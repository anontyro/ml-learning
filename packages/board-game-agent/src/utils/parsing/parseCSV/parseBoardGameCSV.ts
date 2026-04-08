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
  minplayers: requiredInt,
  maxplayers: requiredInt,
  playingtime: requiredInt,
  minage: requiredInt,
  categories: semicolonList,
  mechanics: semicolonList,
});

export type BoardGame = z.infer<typeof BoardGameSchema>;

export const parseBoardGames = async () => {
  const pathToCSV = join(process.cwd(), "../../data/boardgames_enriched.csv");

  const gamesList = await parseBoardGameCSV(pathToCSV);

  return gamesList;
};

export async function parseBoardGameCSV(
  filePath: string,
): Promise<BoardGame[]> {
  const games: BoardGame[] = [];

  const rowProcessor = new Transform({
    objectMode: true,
    transform(raw: Record<string, string>, _encoding, callback) {
      const result = BoardGameSchema.safeParse(raw);
      if (!result.success) {
        callback(
          new Error(
            `Invalid row (id=${raw.id}): ${result.error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join(", ")}`,
          ),
        );
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

  return games;
}
