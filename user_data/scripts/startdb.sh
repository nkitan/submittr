#!/bin/bash

pg_ctlcluster 11 main start
#su postgres && psql <<-EOSQL
#	ALTER ROLE postgres with LOGIN ENCRYPTED PASSWORD 'dbpassword';
#EOSQL
#exit
