-- Migration: Add max_discount column to promotions table
-- Run once to enable max discount cap for percentage-type promotions

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS max_discount DECIMAL(10,2) DEFAULT NULL
    COMMENT 'Số tiền giảm tối đa (chỉ áp dụng cho loại PERCENT)';
