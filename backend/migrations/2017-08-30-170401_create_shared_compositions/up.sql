CREATE TABLE `noise_composition`.`shared_compositions` ( `id` INT NOT NULL AUTO_INCREMENT , `username` VARCHAR(32) NOT NULL DEFAULT 'Anonymous User' , `thumbnail_url` VARCHAR(1024) NOT NULL , `definition_string` MEDIUMTEXT NOT NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB;