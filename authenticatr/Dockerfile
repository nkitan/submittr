# GET BASE IMAGE 
FROM node:slim
ENV DEBIAN_FRONTEND=noninteractive
LABEL author = "Ankit Das"

# INSTALL REQUIREMENTS
RUN apt-get update -y && apt-get install -y python3 && rm -rf /var/lib/apt/lists/*

# SET WORKDIR
RUN mkdir /authenticatr
WORKDIR /authenticatr/

# INSTALL DEPENDENCIES
COPY ["package.json", "/authenticatr/"]
RUN npm install /authenticatr

# COPY PROGRAM FILES
COPY . /authenticatr/

# EXPOSE API PORT
EXPOSE 6969

# START SERVER
#CMD ["npm", "run", "start"]
CMD ["node", "."]