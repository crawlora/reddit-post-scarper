import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { MongoModule } from '../database/mongo.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';

@Module({
  imports: [MongoModule, TypeOrmModule.forFeature([Post])],
  controllers: [ScraperController],
  providers: [ScraperService],
})
export class ScraperModule {}
