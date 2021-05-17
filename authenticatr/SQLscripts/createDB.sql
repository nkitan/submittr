CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE DATABASE jwt;

CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        varchar(255) NOT NULL,
    passwd          varchar(255) NOT NULL,
    isAdmin         boolean,
    isTeacher       boolean,
    inDate          date default CURRENT_DATE
);