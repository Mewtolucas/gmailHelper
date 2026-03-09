/**
 * Email operations CLI commands
 */
import { Argv } from 'yargs';
import { EmailFetcher } from '../../services/gmail/emailFetcher';
import { Categorizer } from '../../services/email/categorizer';
import { Prioritizer } from '../../services/email/prioritizer';
import { CategoryStore } from '../../services/storage/categoryStore';
import { VIPListStore } from '../../services/storage/vipListStore';
import { logger } from '../../utils/logger';

const emailFetcher = new EmailFetcher(null as any);
const categoryStore = new CategoryStore();
const vipStore = new VIPListStore();

export const emailCommand = (yargs: Argv): Argv => {
  return yargs
    .command(
      'list',
      'List emails',
      (y) =>
        y
          .option('category', { alias: 'c', describe: 'Filter by category' })
          .option('priority', { alias: 'p', describe: 'Filter by priority' })
          .option('vip', { describe: 'Show only VIP emails', type: 'boolean' })
          .option('important', { alias: 'i', describe: 'Show only important emails', type: 'boolean' })
          .option('limit', { alias: 'l', describe: 'Limit results', type: 'number', default: 10 }),
      (argv) => {
        try {
          let emails = emailFetcher.getEmailCache();

          // Apply filters
          if (argv.category) {
            emails = emails.filter((e) => e.category === argv.category);
          }

          if (argv.priority) {
            emails = emails.filter((e) => e.priority === argv.priority);
          }

          if (argv.vip) {
            emails = emails.filter((e) => e.isVIP);
          }

          if (argv.important) {
            emails = emails.filter((e) => e.isImportant || e.priority === 'critical');
          }

          // Sort by importance
          const prioritizer = new Prioritizer(vipStore);
          emails = prioritizer.sortByImportance(emails);

          // Limit results
          emails = emails.slice(0, (argv.limit as number) || 10);

          console.log(`\n📧 Emails (${emails.length}):\n`);

          for (const email of emails) {
            const prefix = email.isPinned ? '📌' : email.isImportant ? '⚠️ ' : '  ';
            const category = email.category
              ? categoryStore.getById(email.category)?.name
              : 'Uncategorized';

            console.log(`${prefix} ${email.subject}`);
            console.log(`   From: ${email.from}`);
            console.log(`   Category: ${category} | Priority: ${email.priority}`);
            console.log();
          }
        } catch (error) {
          logger.error('Failed to list emails', error);
          process.exit(1);
        }
      },
    )
    .command(
      'stats',
      'Show email statistics',
      {},
      () => {
        try {
          const emails = emailFetcher.getEmailCache();
          const categorizer = new Categorizer(categoryStore);
          const prioritizer = new Prioritizer(vipStore);

          const categoryStats = categorizer.getStatistics(emails);
          const priorityStats = prioritizer.getStatistics(emails);
          const important = prioritizer.getImportantEmails(emails);

          console.log('\n📊 Email Statistics:\n');
          console.log(`Total emails: ${emails.length}`);
          console.log(`Important: ${important.length}`);
          console.log(`VIP: ${emails.filter((e) => e.isVIP).length}`);
          console.log(`Spam: ${emails.filter((e) => e.isSpam).length}`);

          console.log('\nBy Category:');
          for (const [name, count] of Object.entries(categoryStats)) {
            console.log(`  ${name}: ${count}`);
          }

          console.log('\nBy Priority:');
          for (const [level, count] of Object.entries(priorityStats)) {
            if (count > 0) {
              console.log(`  ${level}: ${count}`);
            }
          }

          console.log();
        } catch (error) {
          logger.error('Failed to get statistics', error);
          process.exit(1);
        }
      },
    );
};
