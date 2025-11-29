ALTER TABLE `market_snapshots` ADD `yield_rate` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `market_snapshots` DROP COLUMN `yield`;