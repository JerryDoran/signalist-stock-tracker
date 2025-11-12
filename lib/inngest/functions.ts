import { inngest } from '@/lib/inngest/client';
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from './prompts';
import { sendWelcomeEmail } from '../nodemailer';
import { getAllUsersForNewsEmail } from '../actions/user.actions';
import { getWatchlistSymbolsByEmail } from '../actions/watchlist.actions';
import { getNews } from '../actions/finnhub.actions';

export const sendSignUpEmail = inngest.createFunction(
  { id: 'signup-email' },
  { event: 'app/user.created' },
  async ({ event, step }) => {
    const userProfile = `
    - Country: ${event.data.country}
    - Investment goals: ${event.data.investmentGoals}
    - Risk tolerance: ${event.data.riskTolerance}
    - Preferred industry: ${event.data.preferredIndustry}
`;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      '{{userProfile}}',
      userProfile
    );

    const response = await step.ai.infer('generate-welcome-intro', {
      model: step.ai.models.gemini({
        model: 'gemini-2.5-flash-lite',
      }),
      body: {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run('send-welcome-email', async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && 'text' in part ? part.text : null) ||
        'Thanks for joining Signalist. You now have the tools to track your investments and make informed decisions.';

      const {
        data: { email, name },
      } = event;
      return await sendWelcomeEmail({
        email: email,
        name: name,
        intro: introText,
      });
    });

    return {
      success: true,
      message: 'Welcome email sent successfully',
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: 'daily-news-summary' },
  [{ event: 'app/send.daily.news' }, { cron: '0 12 * * *' }], // run every day at 12pm UTC
  async ({ step }) => {
    // Step 1: Get all users for news delivery
    const users = await step.run('get-all-users', getAllUsersForNewsEmail);

    if (!users || users.length === 0) {
      return {
        success: false,
        message: 'No users found for news delivery',
      };
    }

    // Step 2: For each user, get their watchlist symbols and fetch news
    interface UserNewsData {
      userId: string;
      email: string;
      name: string;
      symbols: string[];
    }

    interface UserWithNews extends UserNewsData {
      articles: Array<{
        id: string;
        headline: string;
        summary: string;
        image: string | null;
        source: string;
        url: string;
        datetime: number;
      }>;
    }

    const usersWithNews: UserWithNews[] = [];

    for (const user of users) {
      const userNewsData: UserNewsData = {
        userId: user.id,
        email: user.email,
        name: user.name,
        symbols: [],
      };

      // Get user's watchlist symbols
      try {
        userNewsData.symbols = await step.run(`get-watchlist-${user.id}`, () =>
          getWatchlistSymbolsByEmail(user.email)
        );
      } catch (error) {
        console.error(
          `Error fetching watchlist for user ${user.email}:`,
          error
        );
        userNewsData.symbols = [];
      }

      // Fetch news based on symbols or general market news
      try {
        const articles = await step.run(`fetch-news-${user.id}`, () =>
          getNews(
            userNewsData.symbols.length > 0 ? userNewsData.symbols : undefined
          )
        );

        usersWithNews.push({
          ...userNewsData,
          articles: articles,
        });
      } catch (error) {
        console.error(`Error fetching news for user ${user.email}:`, error);
        usersWithNews.push({
          ...userNewsData,
          articles: [],
        });
      }
    }

    // Step 3: Summarize news via AI (placeholder)
    // TODO: Implement AI-powered news summarization
    // This would use step.ai.infer() with a summarization prompt

    // Step 4: Send personalized news summary emails (placeholder)
    // TODO: Implement email sending for news summaries
    // This would use step.run() to send emails via nodemailer

    return {
      success: true,
      message: 'Daily news summary processed successfully',
      usersProcessed: usersWithNews.length,
    };
  }
);
