CREATE TABLE `commutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`from_location` varchar(255) NOT NULL,
	`to_location` varchar(255) NOT NULL,
	`from_lat` varchar(32),
	`from_lng` varchar(32),
	`to_lat` varchar(32),
	`to_lng` varchar(32),
	`transport_mode` varchar(64),
	`planned_duration` int,
	`actual_duration` int,
	`departure_time` timestamp NOT NULL,
	`arrival_time` timestamp,
	`route_details` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commutes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`context` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`course_name` varchar(255) NOT NULL,
	`course_code` varchar(64),
	`location` varchar(255),
	`building_name` varchar(255),
	`room_number` varchar(64),
	`latitude` varchar(32),
	`longitude` varchar(32),
	`start_time` timestamp NOT NULL,
	`end_time` timestamp NOT NULL,
	`day_of_week` int,
	`recurrence_rule` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `focus_modes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`current_mode` enum('study','health','balanced','exam') NOT NULL DEFAULT 'balanced',
	`study_priority` int DEFAULT 5,
	`health_priority` int DEFAULT 5,
	`social_priority` int DEFAULT 5,
	`auto_switch_enabled` int DEFAULT 1,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `focus_modes_id` PRIMARY KEY(`id`),
	CONSTRAINT `focus_modes_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`meal_type` enum('breakfast','lunch','dinner','snack') NOT NULL,
	`mensa_name` varchar(255),
	`dish_name` varchar(255) NOT NULL,
	`calories` int,
	`protein` int,
	`carbs` int,
	`fat` int,
	`price` int,
	`consumed_at` timestamp NOT NULL,
	`rating` int,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mensa_dishes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mensa_id` varchar(64) NOT NULL,
	`mensa_name` varchar(255) NOT NULL,
	`dish_name` varchar(255) NOT NULL,
	`category` varchar(64),
	`price` int,
	`calories` int,
	`protein` int,
	`carbs` int,
	`fat` int,
	`allergens` text,
	`labels` text,
	`available_date` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mensa_dishes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wellness_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`daily_calorie_goal` int,
	`protein_goal` int,
	`carb_goal` int,
	`fat_goal` int,
	`budget_goal` int,
	`dietary_restrictions` text,
	`preferred_cuisines` text,
	`activity_level` varchar(32),
	`sleep_goal` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wellness_profiles_id` PRIMARY KEY(`id`)
);
