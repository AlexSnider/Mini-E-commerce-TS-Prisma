-- AlterTable
ALTER TABLE `users` MODIFY `resetPasswordToken` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `users_access_tokens` MODIFY `access_token` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `users_refresh_tokens` MODIFY `refresh_token` VARCHAR(255) NOT NULL;
