-- Migration: Add 'Inactive' status to seats enum
-- This allows marking seats as unavailable areas (Khu vực không ngồi)
-- without the 'Broken' semantic which implies a damaged seat

USE galaxy_cinema;

ALTER TABLE seats 
MODIFY COLUMN status ENUM('Active', 'Broken', 'Inactive') DEFAULT 'Active';
