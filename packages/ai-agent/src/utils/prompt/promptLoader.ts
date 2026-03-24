import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import logger from "../logger/logger";

const PromptSchema = z.object({
  name: z.string(),
  version: z.string(),
  template: z.string(),
  meta: z
    .object({
      author: z.string().optional(),
      changed_at: z.string().optional(),
      eval_score: z.number().optional(),
    })
    .optional(),
});

export type Prompt = z.infer<typeof PromptSchema>;

// Resolve path to prompts directory relative to package root
// From dist/utils/prompt -> go up 3 levels -> dist -> (root) -> packages/ai-agent/prompts
const getPromptDir = () => {
  // In production: __dirname = dist/utils/prompt
  // In development with tsx: __dirname = src/utils/prompt
  const isDev = __dirname.includes("/src/");
  const levelsUp = isDev ? 3 : 2;

  let currentDir = __dirname;
  for (let i = 0; i < levelsUp; i++) {
    currentDir = join(currentDir, "..");
  }

  return join(currentDir, "prompts");
};

export async function loadPrompt(
  promptName: string,
  version: "latest" | "stable" | "canary" | string = "latest",
): Promise<Prompt> {
  try {
    logger.debug(`Prompt name ${promptName}`, `Prompt version ${version}`);

    const PROMPT_DIR = getPromptDir();
    const manifestPath = join(PROMPT_DIR, promptName, "manifest.json");
    const manifestContent = await readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestContent);

    logger.debug(`Reading prompt manifest from ${manifestPath}`);
    logger.debug("manifest", manifest);

    // Resolve version alias or use provided version
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

    const promptPath = join(PROMPT_DIR, promptName, `${resolvedVersion}.json`);
    const rawContent = await readFile(promptPath, "utf-8");
    const raw = JSON.parse(rawContent);

    logger.debug(`Prompt path: ${promptPath}`);

    // Join template lines into single string
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
