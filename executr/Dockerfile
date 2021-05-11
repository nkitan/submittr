FROM alpine:latest
LABEL authon = "Ankit Das"
RUN apk add --update nodejs npm
RUN mkdir /executr
COPY package.json /executr/package.json
RUN npm install /executr/
COPY . /executr
CMD ["node","/executr/api/"]  