# syntax=docker/dockerfile:1
FROM postgres:latest
LABEL author = "Ankit Das"

ENV POSTGRES_PASSWORD='dbpassword'
ENV POSTGRES_DB='jwt'
# USE SQL SCRIPTS TO SET UP TABLE
COPY ./scripts/* /docker-entrypoint-initdb.d/

# EXPOSE PORT
EXPOSE 5432

# ADD VOLUMES FOR BACKUP
VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]

USER postgres
RUN ["pg_ctl", "init"]

# RUN POSTGRES ON STARTUP
CMD ["pg_ctl", "start"]