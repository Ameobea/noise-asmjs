CREATE TABLE `noise_composition`.`shared_compositions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(32) NOT NULL DEFAULT 'Anonymous User',
  `creation_date` DATETIME NOT NULL,
  `title` VARCHAR(128) NOT NULL,
  `thumbnail_url` VARCHAR(1024) NOT NULL,
  `description` MEDIUMTEXT NOT NULL,
  `definition_string` MEDIUMTEXT NOT NULL,
  `votes` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;
