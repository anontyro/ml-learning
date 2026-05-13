import { logger } from "@repo/utils";

type DataStored = {
  role: "user" | "assistant";
  content: string;
};

class MessageHistory {
  private constructor(tokenLimit = 3500) {
    this.tokenLimit = tokenLimit;
  }

  private static instance: MessageHistory | null = null;
  private tokenLimit: number;
  private data: DataStored[] = [];

  public static getInstance(tokenLimit?: number) {
    if (!MessageHistory.instance) {
      MessageHistory.instance = new MessageHistory(tokenLimit);
    }

    return MessageHistory.instance;
  }

  public push(userData: DataStored) {
    this.data.push(userData);
    this.autoCompact();
  }

  public get() {
    return [...this.data];
  }

  public getHistory(): string {
    return this.data
      .map((x) =>
        x.role === "user" ? `User: ${x.content}` : `Assistant: ${x.content}`,
      )
      .join("\n");
  }

  public clear() {
    this.data = [];
  }

  public tokenCount() {
    const totalContent = this.data.map((x) => x.content).join("");
    const tokenApprox = Math.ceil(totalContent.length / 4);

    return tokenApprox;
  }

  public tokenPercentageUsage() {
    const tokens = this.tokenCount();

    return (tokens / this.tokenLimit) * 100;
  }

  public seralize() {}

  private autoCompact() {
    const percentUsed = this.tokenPercentageUsage();

    if (percentUsed < 95) {
      return;
    }

    this.compact();
  }

  public compact() {
    while (this.tokenCount() > this.tokenLimit) {
      const oldestMessage = this.data.shift();

      if (oldestMessage) {
        logger.debug(`Compacting, removing oldest message`, oldestMessage);
      } else {
        break;
      }
    }
  }
}

export default MessageHistory;
