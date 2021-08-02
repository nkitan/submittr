# GET BASE IMAGE 
FROM node:slim
ENV DEBIAN_FRONTEND=noninteractive
LABEL author = "Ankit Das"

ENV POSTGRES_PASSWORD='dbpassword'

# SET UP POSTGRESQL
RUN apt-get -y update
RUN apt-get -y install postgresql

# INSTALL REQUIREMENTS
RUN mkdir /root/authenticatr/
WORKDIR /root/authenticatr/
COPY . /root/authenticatr/
RUN npm install /root/authenticatr/

#RUN bash scripts/startdb.sh
#RUN bash scripts/initdb.sh

# EXPOSE API PORT
EXPOSE 6969

# START SERVER
CMD ["node","/root/authenticatr/"]
