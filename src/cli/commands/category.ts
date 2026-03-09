/**
 * Category management CLI commands
 */
import { Argv } from 'yargs';
import { CategoryStore } from '../../services/storage/categoryStore';
import { logger } from '../../utils/logger';

const categoryStore = new CategoryStore();

export const categoryCommand = (yargs: Argv): Argv => {
  return yargs
    .command(
      'create <name>',
      'Create a new category',
      (y) => y.option('color', { alias: 'c', describe: 'Hex color code', default: '#757575' }),
      (argv) => {
        try {
          const category = categoryStore.create({
            name: argv.name as string,
            color: argv.color as string,
            rules: [],
            autoApply: true,
            priority: categoryStore.count() + 1,
          });
          console.log(`\n✅ Created category: ${category.name} (${category.id})\n`);
          logger.info('Category created', { name: category.name });
        } catch (error) {
          console.error(`\n❌ Failed to create category\n`);
          logger.error('Category creation error', error);
          process.exit(1);
        }
      },
    )
    .command(
      'list',
      'List all categories',
      {},
      () => {
        try {
          const categories = categoryStore.getSortedCategories();
          console.log('\n📂 Categories:\n');
          for (const cat of categories) {
            console.log(`  ${cat.name} (${cat.id})`);
            console.log(`    Color: ${cat.color}`);
            console.log(`    Rules: ${cat.rules.length}`);
          }
          console.log();
        } catch (error) {
          logger.error('Failed to list categories', error);
          process.exit(1);
        }
      },
    )
    .command(
      'delete <id>',
      'Delete a category',
      {},
      (argv) => {
        try {
          const success = categoryStore.delete(argv.id as string);
          if (success) {
            console.log('\n✅ Category deleted\n');
          } else {
            console.log('\n❌ Category not found\n');
          }
        } catch (error) {
          logger.error('Category deletion error', error);
          process.exit(1);
        }
      },
    );
};
