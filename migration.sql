-- Migration SQL pour ajouter les nouvelles features
-- A executer dans Supabase SQL Editor

-- 1. Ajouter les nouvelles colonnes a la table rooms
ALTER TABLE rooms
ADD COLUMN creator_id UUID REFERENCES participants(id) ON DELETE SET NULL,
ADD COLUMN deck_type TEXT DEFAULT 'fibonacci' CHECK (deck_type IN ('fibonacci', 'tshirt', 'hours')),
ADD COLUMN password TEXT,
ADD COLUMN auto_reveal BOOLEAN DEFAULT false;

-- 2. Ajouter les nouvelles colonnes a la table participants
ALTER TABLE participants
ADD COLUMN is_spectator BOOLEAN DEFAULT false,
ADD COLUMN avatar TEXT DEFAULT '😀';

-- 3. Creer un index sur creator_id pour ameliorer les performances
CREATE INDEX idx_rooms_creator_id ON rooms(creator_id);

-- 4. Creer un index sur room_id et is_spectator
CREATE INDEX idx_participants_room_spectator ON participants(room_id, is_spectator);

-- Note: Apres avoir execute cette migration, il faudra:
-- 1. Mettre a jour app/types/database.types.ts avec les nouveaux types
-- 2. Redemarrer l'application
