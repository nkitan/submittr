CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE DATABASE tasks;

CREATE TABLE assignments (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    author          varchar(30) NOT NULL,
    recipentgroup   varchar(10) NOT NULL,
    content         varchar(255) NOT NULL,
    inDate          date default CURRENT_DATE,
    outDate         date default
);