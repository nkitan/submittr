const Pool = require("pg").Pool;

const db_password = process.env.DB_PASSWORD || "dbpassword";
const db_host = process.env.DB_HOST || "localhost";
const db_port = process.env.DB_PORT || 5432;
const db_name = process.env.DB_NAME || "jwt";
const db_admin = process.env.DB_ADMIN || "admin";
const db_user = process.env.DB_USER || "useracc";
const db_adminpassword = process.env.DB_ADMINPASSWORD || "adminpassword";
const db_userpassword = process.env.DB_USERPASSWORD || "userpassword";

const userpool = new Pool({
     user: `${db_user}`,
     password: `${db_userpassword}`,
     host: `${db_host}`,
     port: `${db_port}`,
     database: `${db_name}`,
});

const adminpool = new Pool({
     user: `${db_admin}`,
     password: `${db_adminpassword}`,
     host: `${db_host}`,
     port: `${db_port}`,
     database: `${db_name}`,
})

module.exports = { userpool, adminpool };