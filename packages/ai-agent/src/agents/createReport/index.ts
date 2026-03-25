import logger from "../../utils/logger/logger";
import { runGeneration } from "./generate";

runGeneration().catch(logger.error);
