#!/usr/bin/env node

/**
 * Gmail Helper CLI Entry Point
 */
import * as yargs from 'yargs';
import { logger } from '../utils/logger';
import { authCommand } from './commands/auth';
import { syncCommand } from './commands/sync';
import { categoryCommand } from './commands/category';
import { vipCommand } from './commands/vip';
import { emailCommand } from './commands/email';

const argv = yargs
  .usage('Usage: $0 <command> [options]')
  .command('auth', 'Authentication commands', authCommand)
  .command('sync', 'Synchronize emails', syncCommand)
  .command('category', 'Manage categories', categoryCommand)
  .command('vip', 'Manage VIP contacts', vipCommand)
  .command('email', 'Email operations', emailCommand)
  .version('1.0.0')
  .help()
  .alias('h', 'help')
  .strict()
  .parseSync();

// Ensure a command was provided
if (!argv._.length) {
  yargs.showHelp();
  process.exit(0);
}

logger.info('Gmail Helper started', { command: argv._[0] });
