# submittr
a microservice based assignment management engine with cloud based code execution


## building submittr
1. clone the repository
  > git clone https://github.com/nkitan/submittr
2. cd into submittr
  > cd submittr
3. build docker stack
  > docker compose build

## usage
1. start stack
  > docker compose up

this starts up all services and starts apis

### API's
  * /auth - authentication apis
  * /dbsr - assignment data api
  * /exec - code execution api
