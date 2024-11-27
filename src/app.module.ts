import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScraperModule } from './scraper/scraper.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.MONGO_URI || 'mongodb://localhost:27017/reddit_scraper',
      synchronize: true,
      entities: [__dirname + '/**/*.entity.{js,ts}'],
    }),
    ScraperModule,
  ],
})
export class AppModule {}
