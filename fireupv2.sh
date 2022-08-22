#!/bin/bash

docker start sarikd
docker start execd
docker start authd
docker start testd
docker start databasd

xdotool key super+p
xdotool type 'st'
xdotool key KP_Enter
xdotool sleep 1
xdotool type 'docker exec -it execd bash'
xdotool key KP_Enter
xdotool sleep 6
xdotool type 'cd ~/executr && node .'
xdotool key KP_Enter

xdotool sleep 1
xdotool key super+p
xdotool type 'st'
xdotool key KP_Enter
xdotool sleep 1
xdotool type 'docker exec -it authd bash'
xdotool key KP_Enter
xdotool sleep 6
xdotool type 'cd ~/ && node .'
xdotool key KP_Enter

xdotool sleep 1
xdotool key super+p
xdotool type 'st'
xdotool key KP_Enter
xdotool sleep 1
xdotool type 'docker exec -it testd bash'
xdotool key KP_Enter
xdotool sleep 6
xdotool type 'cd ~/ && bash serve.sh'
xdotool key KP_Enter

xdotool sleep 1
xdotool key super+p
xdotool type 'st'
xdotool key KP_Enter
xdotool sleep 1
xdotool type 'docker exec -it databasd bash'
xdotool key KP_Enter
xdotool sleep 6
xdotool type 'cd ~/databasr && node .'
xdotool key KP_Enter
