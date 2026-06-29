-- Student Voice PR - Database Setup
-- Import this file in phpMyAdmin > student_voice DB > Import tab

CREATE DATABASE IF NOT EXISTS student_voice;
USE student_voice;

CREATE TABLE IF NOT EXISTS issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    roll VARCHAR(50),
    dept VARCHAR(100),
    category VARCHAR(100),
    priority VARCHAR(20),
    description TEXT,
    date DATE,
    status VARCHAR(20) DEFAULT 'Pending'
);
