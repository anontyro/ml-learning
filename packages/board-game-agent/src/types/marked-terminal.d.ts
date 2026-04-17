declare module "marked-terminal" {
  import type { MarkedExtension } from "marked";

  interface MarkedTerminalOptions {
    reflowText?: boolean;
    showSectionPrefix?: boolean;
    unescape?: boolean;
    emoji?: boolean;
    width?: number;
    tab?: number;
  }

  export function markedTerminal(
    options?: MarkedTerminalOptions,
  ): MarkedExtension;
}
