const Pool = require("pg").Pool;

const db_host = process.env.DBSR_HOST || "localhost";
const db_port = process.env.DBSR_PORT || 5432;
const db_name = process.env.DBSR_NAME || "databasr";
const db_admin = process.env.DBSR_ADMIN || "admin";
const db_user = process.env.DBSR_USER || "useracc";
const db_adminpassword = process.env.DBSR_ADMINPASSWORD || "adminpassword";
const db_userpassword = process.env.DBSR_USERPASSWORD || "userpassword";

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