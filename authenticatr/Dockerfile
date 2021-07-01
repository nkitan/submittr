# GET BASE IMAGE 
FROM node:slim
ENV DEBIAN_FRONTEND=noninteractive
LABEL author = "Ankit Das"

ENV POSTGRES_PASSWORD=toor

# SET UP POSTGRESQL
RUN apt-get -y update
RUN apt-get -y install postgresql

# USE SQL SCRIPTS TO SET UP TABLE
COPY ./SQLscripts/ /docker-entrypoint-initdb.d/

# INSTALL REQUIREMENTS
RUN mkdir /root/authenticatr/
WORKDIR /root/authenticatr/
COPY ./ /root/authenticatr/
RUN npm install /root/authenticatr/

# EXPOSE API PORT
EXPOSE 6970

# START SERVER
CMD ["node","/root/authenticatr/"]