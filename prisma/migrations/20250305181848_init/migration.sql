-- AlterTable
ALTER TABLE `event` MODIFY `eventName` ENUM('TECH_ROADIES', 'NON_TECH_ROADIES', 'DEBUG', 'QUIZMANIA', 'CODE_RELAY', 'PANCHAYAT', 'SPELL_BEE', 'ROBO_RACE', 'ROBO_WAR', 'TRESURE_HUNT', 'GULLEY_CRICKET', 'DUNK_THE_BALL', 'DART', 'PING_PONG', 'FOOTSOL', 'SOLO_DANCE', 'DUO_DANCE', 'GROUP_DANCE', 'SOLO_SINGING', 'DUO_SINGING', 'GROUP_SINGING', 'SKIT', 'INFORMAL_ANCHORING', 'FORMAL_ANCHORING') NOT NULL;
