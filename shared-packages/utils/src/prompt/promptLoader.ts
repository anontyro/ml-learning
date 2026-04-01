import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import logger from "../logger/logger";

const PromptSchema = z.object({
  name: z.string(),
  version: z.string(),
  template: z.string(),
  schema: z.object({}).optional(),
  meta: z
    .object({
      author: z.string().optional(),
      changed_at: z.string().optional(),
      eval_score: z.number().optional(),
    })
    .optional(),
});

export type Prompt = z.infer<typeof PromptSchema>;

export async function loadPrompt(
  promptName: string,
  version: "latest" | "stable" | "canary" | string = "latest",
  promptsDir: string,
): Promise<Prompt> {
  try {
    logger.debug(`Prompt name ${promptName}`, `Prompt version ${version}`);

    const manifestPath = join(promptsDir, promptName, "manifest.json");
    const manifestContent = await readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestContent);

    logger.debug(`Reading prompt manifest from ${manifestPath}`);
    logger.debug("manifest", manifest);

    let resolvedVersion: string;
    if (version === "latest" || version === "stable" || version === "canary") {
      resolvedVersion = manifest[version];
      if (!resolvedVersion) {
        logger.error(
          `Version alias ${version} is not present in manifest for ${promptName}`,
        );
        throw new Error(
          `Version alias "${version}" not found in manifest for prompt "${promptName}"`,
        );
      }
    } else {
      resolvedVersion = version;
    }

    const promptPath = join(promptsDir, promptName, `${resolvedVersion}.json`);
    const rawContent = await readFile(promptPath, "utf-8");
    const raw = JSON.parse(rawContent);

    logger.debug(`Prompt path: ${promptPath}`);

    const template = raw.template_lines?.join("\n") || raw.template || "";

    return PromptSchema.parse({
      ...raw,
      template,
      version: resolvedVersion,
    });
  } catch (err) {
    logger.error("an error occured whilst loading the prompt", err);
    if (err instanceof Error) {
      throw new Error(`Failed to load prompt "${promptName}": ${err.message}`);
    }
    throw err;
  }
}
