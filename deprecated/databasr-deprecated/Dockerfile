# GET BASE IMAGE 
FROM postgres:latest

# SET UP POSTGRESQL
LABEL author = "Ankit Das"

# USE SQL SCRIPTS TO SET UP TABLE
COPY ./SQLscripts/ /docker-entrypoint-initdb.d/

# INSTALL NODE
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y install nodejs npm

RUN mkdir /databasr/

# INSTALL REQUIREMENTS
WORKDIR /databasr
COPY ["package.json", "package-lock.json", "./"]
RUN npm install /databasr

# COPY DATA FROM BASE DIRECTORY TO CONTAINER
COPY . /databasr

# START SERVER
CMD ["node","/databasr/api/"]