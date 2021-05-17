# GET BASE IMAGE 
FROM node:latest-buster-slim
ENV DEBIAN_FRONTEND=noninteractive
LABEL author = "Ankit Das"

ENV POSTGRES_PASSOWRD=toor

# SET UP POSTGRESQL
RUN apt-get -y update
RUN apt-get -y install postgres

# USE SQL SCRIPTS TO SET UP TABLE
COPY ./SQLscripts/ /docker-entrypoint-initdb.d/

# INSTALL REQUIREMENTS
RUN mkdir /authenticatr/
WORKDIR /authenticatr
COPY ["package.json", "package-lock.json", "/authenticatr/"]
RUN npm install /authenticatr/

# COPY DATA FROM BASE DIRECTORY TO CONTAINER
COPY . /authenticatr

# EXPOSE API PORT
EXPOSE 6970

# START SERVER
CMD ["node","/authenticatr/"]
