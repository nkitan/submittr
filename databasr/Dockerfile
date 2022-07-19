FROM postgres:latest
ENV POSTGRES_PASSOWRD=toor

# SET UP POSTGRESQL
LABEL author = "Ankit Das"

# USE SQL SCRIPTS TO SET UP TABLE
COPY .scripts/* /docker-entrypoint-initdb.d/

# INSTALL NODE
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y install nodejs npm

RUN mkdir /databasr/

# INSTALL REQUIREMENTS
WORKDIR /databasr
COPY ["package.json", "/databasr/"]
RUN npm install /databasr

# COPY DATA FROM BASE DIRECTORY TO CONTAINER
COPY . /databasr

# EXPOSE API PORT
EXPOSE 6971

# START SERVER
CMD ["node","/databasr/"]
