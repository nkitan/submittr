psql -U postgres <<-EOSQL
    CREATE ROLE admin WITH NOCREATEDB NOCREATEROLE LOGIN ENCRYPTED PASSWORD 'adminpassword';
    CREATE ROLE useracc WITH NOCREATEDB NOCREATEROLE LOGIN ENCRYPTED PASSWORD 'userpassword';
    CREATE DATABASE databasr;
    GRANT ALL PRIVILEGES ON DATABASE databasr TO postgres;
    \c databasr;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE students (
        id              varchar(255) PRIMARY KEY,
        username        varchar(255) NOT NULL,
        classes         varchar(255) NOT NULL
    );

    CREATE TABLE teachers (
        id              varchar(255) PRIMARY KEY,
        username        varchar(255) NOT NULL,
        classes         JSONB NOT NULL
    );
    
    CREATE TABLE assignments (
        id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        classes         JSONB NOT NULL,
        owner           uuid NOT NULL,
        marks           decimal NOT NULL,
        deadline        timestamp NOT NULL
    );

    GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE teachers TO admin;
    GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE students TO admin;
    GRANT SELECT ON teachers TO useracc;
    GRANT SELECT ON students TO useracc;
    GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE assignments to admin;
    GRANT SELECT ON assignments to useracc;
EOSQL