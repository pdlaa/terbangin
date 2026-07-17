-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'staff', 'customer', 'manager') NOT NULL DEFAULT 'customer',
    `remember_token` VARCHAR(191) NULL,
    `email_verified_at` DATETIME(3) NULL,
    `email_verification_token` VARCHAR(191) NULL,
    `email_verification_token_expiry` DATETIME(3) NULL,
    `phone` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `airports` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `iata_code` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `airports_iata_code_key`(`iata_code`),
    INDEX `airports_iata_code_idx`(`iata_code`),
    INDEX `airports_city_idx`(`city`),
    INDEX `airports_country_idx`(`country`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `airlines` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `photos` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `airlines_code_key`(`code`),
    INDEX `airlines_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `airplanes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `airline_id` BIGINT NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `registration_number` VARCHAR(191) NULL,
    `capacity` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `photos` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `airplanes_airline_id_idx`(`airline_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seats` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `airplane_id` BIGINT NOT NULL,
    `seat_number` VARCHAR(191) NOT NULL,
    `class` ENUM('economy', 'business', 'first') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `seats_airplane_id_idx`(`airplane_id`),
    INDEX `seats_class_idx`(`class`),
    UNIQUE INDEX `seats_airplane_id_seat_number_key`(`airplane_id`, `seat_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flights` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `airline_id` BIGINT NOT NULL,
    `airplane_id` BIGINT NOT NULL,
    `departure_airport_id` BIGINT NOT NULL,
    `arrival_airport_id` BIGINT NOT NULL,
    `flight_number` VARCHAR(191) NOT NULL,
    `departure_time` DATETIME(3) NOT NULL,
    `arrival_time` DATETIME(3) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `price_multiplier_business` DECIMAL(4, 2) NULL,
    `price_multiplier_first` DECIMAL(4, 2) NULL,
    `available_seats` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `duration` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `flights_airline_id_idx`(`airline_id`),
    INDEX `flights_airplane_id_idx`(`airplane_id`),
    INDEX `flights_departure_airport_id_arrival_airport_id_idx`(`departure_airport_id`, `arrival_airport_id`),
    INDEX `flights_departure_time_idx`(`departure_time`),
    INDEX `flights_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `flight_id` BIGINT NOT NULL,
    `booking_code` VARCHAR(191) NOT NULL,
    `passenger_name` VARCHAR(191) NOT NULL,
    `passenger_email` VARCHAR(191) NOT NULL,
    `passenger_phone` VARCHAR(191) NULL,
    `total_price` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('pending', 'confirmed', 'cancelled', 'used', 'expired') NOT NULL DEFAULT 'pending',
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bookings_booking_code_key`(`booking_code`),
    INDEX `bookings_user_id_idx`(`user_id`),
    INDEX `bookings_flight_id_idx`(`flight_id`),
    INDEX `bookings_booking_code_idx`(`booking_code`),
    INDEX `bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passengers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `booking_id` BIGINT NOT NULL,
    `flight_id` BIGINT NOT NULL,
    `seat_id` BIGINT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `gender` ENUM('male', 'female') NOT NULL,
    `birth_date` DATETIME(3) NOT NULL,
    `passport_number` VARCHAR(191) NOT NULL,
    `seat_number` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `passengers_booking_id_idx`(`booking_id`),
    INDEX `passengers_seat_id_idx`(`seat_id`),
    INDEX `passengers_flight_id_idx`(`flight_id`),
    UNIQUE INDEX `passengers_flight_id_seat_id_key`(`flight_id`, `seat_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `booking_id` BIGINT NOT NULL,
    `payment_method` VARCHAR(191) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_status` ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
    `transaction_code` VARCHAR(191) NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` BIGINT NOT NULL,

    UNIQUE INDEX `payments_booking_id_key`(`booking_id`),
    INDEX `payments_booking_id_idx`(`booking_id`),
    INDEX `payments_transaction_code_idx`(`transaction_code`),
    INDEX `payments_payment_status_idx`(`payment_status`),
    INDEX `payments_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `airplanes` ADD CONSTRAINT `airplanes_airline_id_fkey` FOREIGN KEY (`airline_id`) REFERENCES `airlines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seats` ADD CONSTRAINT `seats_airplane_id_fkey` FOREIGN KEY (`airplane_id`) REFERENCES `airplanes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flights` ADD CONSTRAINT `flights_airline_id_fkey` FOREIGN KEY (`airline_id`) REFERENCES `airlines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flights` ADD CONSTRAINT `flights_airplane_id_fkey` FOREIGN KEY (`airplane_id`) REFERENCES `airplanes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flights` ADD CONSTRAINT `flights_departure_airport_id_fkey` FOREIGN KEY (`departure_airport_id`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flights` ADD CONSTRAINT `flights_arrival_airport_id_fkey` FOREIGN KEY (`arrival_airport_id`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_flight_id_fkey` FOREIGN KEY (`flight_id`) REFERENCES `flights`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passengers` ADD CONSTRAINT `passengers_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passengers` ADD CONSTRAINT `passengers_flight_id_fkey` FOREIGN KEY (`flight_id`) REFERENCES `flights`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passengers` ADD CONSTRAINT `passengers_seat_id_fkey` FOREIGN KEY (`seat_id`) REFERENCES `seats`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
