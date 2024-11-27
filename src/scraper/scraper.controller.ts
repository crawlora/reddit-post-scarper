import { Controller, Post, Body } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  private keyword: string | null = 'Web Scraping';

  constructor(private readonly scraperService: ScraperService) {}

  // Run the scraper manually and initialize the keyword for the cron job
  @Post('start')
  async startScraper(@Body('keyword') keyword: string) {
    console.log(`Running scraper manually for keyword: ${keyword}`);
    this.keyword = keyword; // Store the keyword for the cron job
    await this.scraperService.scrapePostsForToday(keyword);

    return { message: `Scraper started for keyword: ${keyword}` };
  }

  // Automatically run the scraper every 10 minutes
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    if (this.keyword) {
      console.log(`Running scheduled scraper for keyword: ${this.keyword}`);
      await this.scraperService.scrapePostsForToday(this.keyword);
    } else {
      console.log('Keyword not set. Cron job skipped.');
    }
  }
}
