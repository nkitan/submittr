FROM node:slim
ENV POSTGRES_PASSWORD=toor

# SET UP POSTGRESQL
LABEL author = "Ankit Das"

# INSTALL NODE
RUN apt-get -y update && \
    apt-get install -y postgresql && \
    rm -rf /var/lib/apt/lists/*

# USE SQL SCRIPTS TO SET UP TABLE
COPY ./scripts/* /docker-entrypoint-initdb.d/

# CREATE WORKSPACE
RUN mkdir /databasr/
RUN mkdir /databasr_data

# INSTALL REQUIREMENTS
WORKDIR /databasr
COPY ["package.json", "/databasr/"]
RUN npm install /databasr

# COPY DATA FROM BASE DIRECTORY TO CONTAINER
COPY . /databasr

# EXPOSE API PORT
EXPOSE 6971

# START SERVER
CMD ["npm","run","start"]
