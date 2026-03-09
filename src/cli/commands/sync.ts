/**
 * Email synchronization CLI commands
 */
import { Argv } from 'yargs';
import { GmailClient } from '../../services/gmail/gmailClient';
import { EmailFetcher } from '../../services/gmail/emailFetcher';
import { ConfigStore } from '../../services/storage/configStore';
import { CategoryStore } from '../../services/storage/categoryStore';
import { VIPListStore } from '../../services/storage/vipListStore';
import { Categorizer } from '../../services/email/categorizer';
import { Prioritizer } from '../../services/email/prioritizer';
import { logger } from '../../utils/logger';

const configStore = new ConfigStore();

export const syncCommand = (yargs: Argv): Argv => {
  return yargs
    .option('full', {
      alias: 'f',
      describe: 'Perform full sync instead of incremental',
      type: 'boolean',
      default: false,
    })
    .option('days', {
      alias: 'd',
      describe: 'Number of days to sync (for full sync)',
      type: 'number',
      default: 30,
    })
    .command(
      '$0',
      'Synchronize emails',
      {},
      async (argv) => {
        try {
          const config = configStore.getConfig();
          const gmailClient = new GmailClient(config.gmail);

          // Check authentication
          if (!gmailClient.isAuthenticated()) {
            console.log('\n❌ Not authenticated\n');
            console.log('Run: gmail-helper auth login\n');
            process.exit(1);
          }

          console.log('\n📧 Synchronizing emails...\n');

          await gmailClient.initialize();
          const emailFetcher = new EmailFetcher(gmailClient);

          let emails;
          if (argv.full) {
            const days = (argv.days as number) || 30;
            console.log(`Fetching emails from last ${days} days...`);
            emails = await emailFetcher.fullSync(days);
          } else {
            console.log('Performing incremental sync...');
            emails = await emailFetcher.incrementalSync();
          }

          console.log(`✅ Fetched ${emails.length} emails\n`);

          // Categorize emails
          const categoryStore = new CategoryStore();
          const categorizer = new Categorizer(categoryStore);
          const categorized = categorizer.bulkCategorize(emails);
          console.log(`✅ Categorized ${categorized} emails`);

          // Prioritize emails
          const vipStore = new VIPListStore();
          const prioritizer = new Prioritizer(vipStore);
          prioritizer.bulkPrioritize(emails);
          console.log('✅ Prioritized all emails');

          // Show statistics
          const categoryStats = categorizer.getStatistics(emails);
          const priorityStats = prioritizer.getStatistics(emails);

          console.log('\n📊 Statistics:\n');
          console.log('Categories:');
          for (const [name, count] of Object.entries(categoryStats)) {
            console.log(`  ${name}: ${count}`);
          }

          console.log('\nPriority Levels:');
          for (const [level, count] of Object.entries(priorityStats)) {
            if (count > 0) {
              console.log(`  ${level}: ${count}`);
            }
          }

          const important = prioritizer.getImportantEmails(emails);
          console.log(`\n⚠️  Important emails: ${important.length}\n`);

          logger.info('Sync completed successfully', {
            emailCount: emails.length,
            categorized,
          });
        } catch (error) {
          console.error('\n❌ Sync failed\n');
          logger.error('Sync error', error);
          process.exit(1);
        }
      },
    );
};
