import { Injectable } from '@nestjs/common';
import { runIngestion } from '@ai-agent/core/ingest';

@Injectable()
export class IngestService {
  async ingest(): Promise<{ success: boolean; message: string }> {
    try {
      const vectorStore = await runIngestion();

      if (!vectorStore) {
        return {
          success: false,
          message: 'Ingestion failed - no vector store created',
        };
      }

      return {
        success: true,
        message: 'Documents ingested successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Ingest error:', errorMessage);

      return {
        success: false,
        message: `Ingestion failed: ${errorMessage}`,
      };
    }
  }
}
