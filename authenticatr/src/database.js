const Pool = require("pg").Pool;

const db_user = process.env.DB_USER || "notadmin";
const db_password = process.env.DB_PASSWORD || "notadminpassword";
const db_host = process.env.DB_HOST || "localhost";
const db_port = process.env.DB_PORT || 5432;
const db_name = process.env.DB_NAME || "user";
const db_admin = process.env.DB_ADMIN || "root";
const db_adminpassword = process.env.DB_ADMINPASSWORD || "toor";

const userpool = new Pool({
     user: `${db_user}`,
     password: `${db_password}`,
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