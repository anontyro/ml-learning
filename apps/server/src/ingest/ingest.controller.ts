import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { IngestService } from './ingest.service';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async runIngestion() {
    return this.ingestService.ingest();
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'ingest' };
  }
}
