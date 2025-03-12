/*
  Warnings:

  - The values [TRESURE_HUNT] on the enum `Event_eventName` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `event` MODIFY `eventName` ENUM('TECH_ROADIES', 'NON_TECH_ROADIES', 'DEBUG', 'QUIZMANIA', 'CODE_RELAY', 'PANCHAYAT', 'SPELL_BEE', 'ROBO_RACE', 'ROBO_WAR', 'TREASURE_HUNT', 'GULLEY_CRICKET', 'BEACH_VOLLEY', 'DUNK_THE_BALL', 'DART', 'PING_PONG', 'FOOTSOL', 'SMASH', 'SOLO_DANCE', 'DUO_DANCE', 'GROUP_DANCE', 'SOLO_SINGING', 'DUO_SINGING', 'GROUP_SINGING', 'SKIT', 'INFORMAL_ANCHORING', 'FORMAL_ANCHORING') NOT NULL;
