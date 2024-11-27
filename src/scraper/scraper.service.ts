import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Post } from '../entities/post.entity';

@Injectable()
export class ScraperService {
  private accessToken: string;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {
    this.authenticate(); // Authenticate with Reddit API
  }

  // Authenticate with Reddit API to get an access token
  async authenticate() {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const username = process.env.REDDIT_USERNAME;
    const password = process.env.REDDIT_PASSWORD;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    try {
      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        `grant_type=password&username=${encodeURIComponent(
          username,
        )}&password=${encodeURIComponent(password)}`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      console.log('Successfully authenticated with Reddit API');
    } catch (error) {
      console.error('Failed to authenticate with Reddit API:', error.message);
    }
  }

  // Scrape posts uploaded today that strictly contain the keyword
  async scrapePostsForToday(keyword: string) {
    console.log(`Scraping posts for keyword "${keyword}" uploaded today.`);
    const today = new Date();
    const startOfDay =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ).getTime() / 1000;
    const endOfDay = startOfDay + 86400;

    let after = null;
    const uniquePosts = [];

    try {
      do {
        const response = await axios.get('https://oauth.reddit.com/search', {
          params: {
            q: `"${keyword}"`,
            sort: 'new',
            limit: 50,
            after,
          },
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'User-Agent': 'Reddit Scraper',
          },
        });
        const posts = response.data.data.children
          .map((item: any) => ({
            title: item.data.title,
            url: `https://www.reddit.com${item.data.permalink}`,
            self_text: item.data.selftext,
            author_name: item.data.author,
            created_utc: item.data.created_utc,
            keyword,
          }))
          .filter(
            (post) =>
              post.created_utc >= startOfDay && post.created_utc <= endOfDay,
          )
          .filter(
            (post) =>
              post.title.includes(keyword) || post.self_text.includes(keyword),
          );
        for (const post of posts) {
          const exists = await this.postRepository.findOne({
            where: { url: post.url },
          });
          if (!exists) {
            uniquePosts.push(post);
            await this.postRepository.save(post);
            console.log(`New Post Found: ${post.title}`);
            console.log(post);
            await this.notifySlack(post); // Send Slack notification
          }
        }

        after = response.data.data.after; // Pagination token
      } while (after);

      console.log(
        `Scraping completed. ${uniquePosts.length} new posts added to the database.`,
      );

      return uniquePosts; // Return new posts for further processing
    } catch (error) {
      console.error('Error scraping posts:', error.message);
      return [];
    }
  }

  private async notifySlack(post: any) {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      console.error('Slack Webhook URL is not configured.');
      return;
    }

    const message = {
      text: `:newspaper: *New Post Found!* :tada:\n*Title:* ${post.title}\n*URL:* ${post.url}\n*Author:* ${post.author_name}`,
    };

    try {
      await axios.post(slackWebhookUrl, message, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(`Notification sent to Slack for post: ${post.title}`);
    } catch (error) {
      console.error(
        `Failed to send notification to Slack for post: ${post.title}`,
        error.message,
      );
    }
  }
}
