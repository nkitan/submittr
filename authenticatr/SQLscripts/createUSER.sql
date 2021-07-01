CREATE ROLE notadmin WITH NOCREATEDB PASSWORD 'notadminpassword';
GRANT SELECT ON users TO notadmin;



SELECT json_object_agg(each.grp, each.names) FROM (SELECT username, passwd, isadmin, isteacher, array_agg(id) as names FROM users GROUP BY id ) AS each;
                  id                  |  username  |                            passwd                            | isadmin | isteacher |   indate
