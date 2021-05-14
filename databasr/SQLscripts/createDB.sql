CREATE TABLE user (
    username        char(20) CONSTRAINT PRIMARY KEY,
    passwd          varchar(30) NOT NULL,
    token           varchar(128) NOT NULL,
    isAdmin         boolean,
    isTeacher       boolean,
    inDate          date default CURRENT_DATE
);