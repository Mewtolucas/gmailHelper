/**
 * Authentication CLI commands
 */
import { Argv } from 'yargs';
import { GmailClient } from '../../services/gmail/gmailClient';
import { ConfigStore } from '../../services/storage/configStore';
import { logger } from '../../utils/logger';
import { env } from '../../config/environment';

const configStore = new ConfigStore();

export const authCommand = (yargs: Argv): Argv => {
  return yargs
    .command(
      'login',
      'Login to Gmail account',
      {},
      async (argv) => {
        try {
          const config = configStore.getConfig();

          if (!config.gmail.clientId || !config.gmail.clientSecret) {
            logger.error(
              'Gmail OAuth credentials not configured. Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET',
            );
            process.exit(1);
          }

          const gmailClient = new GmailClient(config.gmail);
          const authUrl = gmailClient.getAuthUrl();

          console.log('\n📧 Gmail Helper Authentication\n');
          console.log('Please visit this URL to authenticate:');
          console.log(`\n${authUrl}\n`);
          console.log(
            'After authentication, the page will show an authorization code.',
          );
          console.log(
            'Note: If it shows an error, copy the code from the redirect URL.\n',
          );

          // In a real app, this would open the browser automatically
          console.log('Enter the authorization code:');

          // For now, prompt for code via stdin
          const code = await new Promise<string>((resolve) => {
            process.stdin.once('data', (data) => {
              resolve(data.toString().trim());
            });
          });

          await gmailClient.handleAuthCallback(code);
          console.log('\n✅ Authentication successful!\n');
          logger.info('User authenticated successfully');
        } catch (error) {
          console.error('\n❌ Authentication failed\n');
          logger.error('Authentication error', error);
          process.exit(1);
        }
      },
    )
    .command(
      'status',
      'Check authentication status',
      {},
      async () => {
        try {
          const config = configStore.getConfig();
          const gmailClient = new GmailClient(config.gmail);

          if (gmailClient.isAuthenticated()) {
            console.log('\n✅ Authenticated\n');
            try {
              await gmailClient.initialize();
              const profile = await gmailClient.getProfile();
              console.log(`Email: ${profile.emailAddress}`);
              console.log(`Messages: ${profile.messagesTotal}`);
              console.log(`Unread: ${profile.messagesUnread}\n`);
            } catch (error) {
              logger.warn('Could not fetch profile', error);
            }
          } else {
            console.log('\n❌ Not authenticated\n');
            console.log('Run: gmail-helper auth login\n');
          }
        } catch (error) {
          logger.error('Status check failed', error);
          process.exit(1);
        }
      },
    )
    .command(
      'logout',
      'Logout from Gmail account',
      {},
      () => {
        try {
          const config = configStore.getConfig();
          const gmailClient = new GmailClient(config.gmail);
          gmailClient.logout();
          console.log('\n✅ Logged out successfully\n');
          logger.info('User logged out');
        } catch (error) {
          logger.error('Logout failed', error);
          process.exit(1);
        }
      },
    );
};
