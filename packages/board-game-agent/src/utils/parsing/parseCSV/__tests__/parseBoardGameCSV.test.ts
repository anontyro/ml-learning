import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parseBoardGameCSV } from "../parseBoardGameCSV";

const FIXTURE = path.join(__dirname, "fixtures", "sample.csv");

const writeTempCSV = (content: string): string => {
  const file = path.join(os.tmpdir(), `bga-test-${Date.now()}.csv`);
  fs.writeFileSync(file, content, "utf-8");
  return file;
};

const HEADERS =
  "id,name,yearpublished,rank,bayesaverage,average,usersrated,is_expansion,abstracts_rank,cgs_rank,childrensgames_rank,familygames_rank,partygames_rank,strategygames_rank,thematic_rank,wargames_rank,description,minplayers,maxplayers,playingtime,minage,categories,mechanics,primaryName";

describe("parseBoardGameCSV", () => {
  describe("with valid data", () => {
    let games: Awaited<ReturnType<typeof parseBoardGameCSV>>["games"];

    beforeAll(async () => {
      ({ games } = await parseBoardGameCSV(FIXTURE));
    });

    it("parses all rows", () => {
      expect(games).toHaveLength(4);
    });

    describe("Brass: Birmingham (rank 1)", () => {
      it("parses scalar fields correctly", () => {
        const game = games[0]!;
        expect(game.id).toBe("224517");
        expect(game.name).toBe("Brass: Birmingham");
        expect(game.primaryName).toBe("Brass: Birmingham");
        expect(game.yearpublished).toBe(2018);
        expect(game.rank).toBe(1);
        expect(game.bayesaverage).toBeCloseTo(8.39793);
        expect(game.average).toBeCloseTo(8.57004);
        expect(game.usersrated).toBe(56044);
        expect(game.minplayers).toBe(2);
        expect(game.maxplayers).toBe(4);
        expect(game.playingtime).toBe(120);
        expect(game.minage).toBe(14);
      });

      it("parses is_expansion as false", () => {
        expect(games[0]!.is_expansion).toBe(false);
      });

      it("parses strategygames_rank and nulls other category ranks", () => {
        const game = games[0]!;
        expect(game.strategygames_rank).toBe(1);
        expect(game.abstracts_rank).toBeNull();
        expect(game.cgs_rank).toBeNull();
        expect(game.childrensgames_rank).toBeNull();
        expect(game.familygames_rank).toBeNull();
        expect(game.partygames_rank).toBeNull();
        expect(game.thematic_rank).toBeNull();
        expect(game.wargames_rank).toBeNull();
      });

      it("parses semicolon-delimited categories into an array", () => {
        expect(games[0]!.categories).toEqual([
          "Age of Reason",
          "Economic",
          "Trains",
        ]);
      });

      it("parses semicolon-delimited mechanics into an array", () => {
        expect(games[0]!.mechanics).toEqual([
          "Chaining",
          "Hand Management",
          "Tile Placement",
        ]);
      });
    });

    describe("Pandemic Legacy: Season 1 (rank 3)", () => {
      it("parses both strategygames_rank and thematic_rank", () => {
        const game = games[2]!;
        expect(game.strategygames_rank).toBe(3);
        expect(game.thematic_rank).toBe(1);
      });
    });

    describe("VolgaFront (expansion, rank 0)", () => {
      it("parses is_expansion as true", () => {
        expect(games[3]!.is_expansion).toBe(true);
      });

      it("parses rank 0 as a valid integer", () => {
        expect(games[3]!.rank).toBe(0);
      });

      it("parses all category ranks as null", () => {
        const game = games[3]!;
        expect(game.strategygames_rank).toBeNull();
        expect(game.thematic_rank).toBeNull();
        expect(game.wargames_rank).toBeNull();
      });
    });
  });

  describe("with limit option", () => {
    it("returns only the first N rows when limit is set", async () => {
      const { games } = await parseBoardGameCSV(FIXTURE, { limit: 2 });
      expect(games).toHaveLength(2);
      expect(games[0]!.id).toBe("224517"); // rank 1
      expect(games[1]!.id).toBe("342942"); // rank 2
    });

    it("returns all rows when limit exceeds total row count", async () => {
      const { games } = await parseBoardGameCSV(FIXTURE, { limit: 100 });
      expect(games).toHaveLength(4);
    });

    it("returns an empty array when limit is 0", async () => {
      const { games } = await parseBoardGameCSV(FIXTURE, { limit: 0 });
      expect(games).toHaveLength(0);
    });
  });

  describe("with skip option", () => {
    it("skips the first N rows when skip is set", async () => {
      const { games } = await parseBoardGameCSV(FIXTURE, { skip: 2 });
      expect(games).toHaveLength(2);
      expect(games[0]!.rank).toBe(3); // 3rd row
    });

    it("returns an empty array when skip exceeds total row count", async () => {
      const { games } = await parseBoardGameCSV(FIXTURE, { skip: 10 });
      expect(games).toHaveLength(0);
    });
  });

  describe("with skip and limit combined", () => {
    it("skips N rows then returns up to limit rows", async () => {
      const { games } = await parseBoardGameCSV(FIXTURE, { skip: 1, limit: 2 });
      expect(games).toHaveLength(2);
      expect(games[0]!.rank).toBe(2); // 2nd row
      expect(games[1]!.rank).toBe(3); // 3rd row
    });

    it("returns fewer than limit when remaining rows after skip are less", async () => {
      const { games } = await parseBoardGameCSV(FIXTURE, { skip: 3, limit: 5 });
      expect(games).toHaveLength(1);
    });
  });

  describe("with invalid data", () => {
    it("skips rows with an invalid required field and reports them in failures", async () => {
      const file = writeTempCSV(
        [
          HEADERS,
          "999,Bad Game,not-a-year,1,7.0,7.0,100,0,,,,,,,,,A game.,2,4,60,10,Strategy,Dice Rolling,Bad Game",
        ].join("\n"),
      );
      const { games, failures } = await parseBoardGameCSV(file);
      expect(games).toHaveLength(0);
      expect(failures).toHaveLength(1);
      expect(failures[0]!.id).toBe("999");
      expect(failures[0]!.reason).toMatch(/yearpublished.*expected number/i);
    });

    it("skips rows with an empty id and reports them in failures", async () => {
      const file = writeTempCSV(
        [
          HEADERS,
          ",No ID Game,2020,1,7.0,7.0,100,0,,,,,,,,,A game.,2,4,60,10,Strategy,Dice Rolling,No ID Game",
        ].join("\n"),
      );
      const { games, failures } = await parseBoardGameCSV(file);
      expect(games).toHaveLength(0);
      expect(failures).toHaveLength(1);
      expect(failures[0]!.id).toBe("(unknown)");
      expect(failures[0]!.reason).toMatch(/id.*Too small/i);
    });

    it("returns valid rows alongside failures when the data is mixed", async () => {
      const file = writeTempCSV(
        [
          HEADERS,
          "224517,Brass: Birmingham,2018,1,8.39793,8.57004,56044,0,,,,,,1,,,A game.,2,4,120,14,Economic,Hand Management,Brass: Birmingham",
          "999,Bad Game,not-a-year,1,7.0,7.0,100,0,,,,,,,,,A game.,2,4,60,10,Strategy,Dice Rolling,Bad Game",
          "342942,Ark Nova,2021,2,8.35441,8.54177,58020,0,,,,,,2,,,A zoo game.,1,4,150,14,Animals,Set Collection,Ark Nova",
        ].join("\n"),
      );
      const { games, failures } = await parseBoardGameCSV(file);
      expect(games).toHaveLength(2);
      expect(games.map((g) => g.id)).toEqual(["224517", "342942"]);
      expect(failures).toHaveLength(1);
      expect(failures[0]!.id).toBe("999");
    });
  });
});
