#!/bin/bash

psql -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres <<-EOSQL
    CREATE ROLE admin WITH NOCREATEDB NOCREATEROLE LOGIN ENCRYPTED PASSWORD 'adminpassword';
    CREATE ROLE useracc WITH NOCREATEDB NOCREATEROLE LOGIN ENCRYPTED PASSWORD 'userpassword';
    CREATE DATABASE jwt;
    GRANT ALL PRIVILEGES ON DATABASE jwt TO postgres;
    \c jwt;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE users (
        id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        username        varchar(255) NOT NULL,
        passwd          varchar(255) NOT NULL,
        isAdmin         boolean,
        isTeacher       boolean,
        inDate          date default CURRENT_DATE
    );

    GRANT SELECT,INSERT,UPDATE,DELETE ON users TO admin;
    GRANT SELECT ON users TO useracc;

    INSERT INTO users (username, passwd, isAdmin, isTeacher) VALUES ("ankit", "hashedpassword", 1, 1);
EOSQL
