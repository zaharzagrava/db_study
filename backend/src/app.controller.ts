import { Controller, Get } from '@nestjs/common';
import { FetchService } from './fetch/fetch.service';

@Controller()
export class AppController {
  constructor(private readonly fetchService: FetchService) {}

  @Get('health')
  async health() {
    return 'The server is up and runnning';
  }
}
