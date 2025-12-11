CREATE TABLE `tum_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`tum_email` varchar(320) NOT NULL,
	`student_id` varchar(50) NOT NULL,
	`first_name` varchar(100),
	`last_name` varchar(100),
	`faculty` varchar(200),
	`is_verified` int NOT NULL DEFAULT 0,
	`verification_code` varchar(10),
	`verification_expiry` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tum_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `tum_accounts_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `tum_accounts_tum_email_unique` UNIQUE(`tum_email`)
);
