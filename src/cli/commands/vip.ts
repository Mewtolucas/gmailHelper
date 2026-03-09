/**
 * VIP contacts management CLI commands
 */
import { Argv } from 'yargs';
import { VIPListStore } from '../../services/storage/vipListStore';
import { logger } from '../../utils/logger';

const vipStore = new VIPListStore();

export const vipCommand = (yargs: Argv): Argv => {
  return yargs
    .command(
      'add <email> <name>',
      'Add VIP contact',
      (y) =>
        y
          .option('priority', {
            alias: 'p',
            describe: 'Priority level',
            choices: ['vip', 'important', 'normal'],
            default: 'important',
          })
          .positional('email', { describe: 'Email address' })
          .positional('name', { describe: 'Contact name' }),
      (argv) => {
        try {
          const contact = vipStore.add(
            argv.email as string,
            argv.name as string,
            argv.priority as 'vip' | 'important' | 'normal',
          );
          console.log(`\n✅ Added VIP contact: ${contact.name} (${contact.email})\n`);
          logger.info('VIP contact added', { email: contact.email });
        } catch (error) {
          console.error(`\n❌ Failed to add VIP contact\n`);
          logger.error('VIP contact error', error);
          process.exit(1);
        }
      },
    )
    .command(
      'list',
      'List VIP contacts',
      {},
      () => {
        try {
          const contacts = vipStore.getSortedByPriority();
          console.log('\n👥 VIP Contacts:\n');
          for (const contact of contacts) {
            console.log(`  ${contact.name} (${contact.email})`);
            console.log(`    Priority: ${contact.priority}`);
          }
          console.log();
        } catch (error) {
          logger.error('Failed to list VIP contacts', error);
          process.exit(1);
        }
      },
    )
    .command(
      'remove <email>',
      'Remove VIP contact',
      (y) => y.positional('email', { describe: 'Email address' }),
      (argv) => {
        try {
          const success = vipStore.removeByEmail(argv.email as string);
          if (success) {
            console.log('\n✅ VIP contact removed\n');
          } else {
            console.log('\n❌ Contact not found\n');
          }
        } catch (error) {
          logger.error('VIP contact removal error', error);
          process.exit(1);
        }
      },
    );
};
