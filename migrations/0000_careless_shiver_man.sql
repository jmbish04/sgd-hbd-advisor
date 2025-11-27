CREATE TABLE `logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`level` text NOT NULL,
	`component` text NOT NULL,
	`message` text NOT NULL,
	`trace_id` text,
	`user_id` text,
	`session_id` text,
	`request_id` text,
	`error` text,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`town` text NOT NULL,
	`flat_type` text NOT NULL,
	`price` integer NOT NULL,
	`yield` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trace_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trace_id` text NOT NULL,
	`event_id` text NOT NULL,
	`timestamp` text NOT NULL,
	`level` text NOT NULL,
	`component` text NOT NULL,
	`action` text NOT NULL,
	`message` text NOT NULL,
	`data` text,
	`code_location` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `traces` (
	`id` text PRIMARY KEY NOT NULL,
	`trace_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`component` text NOT NULL,
	`status` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text,
	`duration` integer,
	`metadata` text,
	`created_at` text NOT NULL
);
