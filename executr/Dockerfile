FROM node:slim
RUN dpkg-reconfigure -p critical dash

# create runner users
RUN for i in $(seq 1001 1500); do \
        groupadd -g $i runner$i && \
        useradd -M runner$i -g $i -u $i ; \
    done

# update packages and get essentials
RUN apt-get -y update && \
    apt-get install -y libxml2 gnupg tar coreutils util-linux libc6-dev \
    binutils build-essential locales libpcre3-dev libevent-dev libgmp3-dev \
    libncurses6 libncurses5 libedit-dev libseccomp-dev rename procps python3 \
    libreadline-dev libblas-dev liblapack-dev libpcre3-dev libarpack2-dev \
    libfftw3-dev libglpk-dev libqhull-dev libqrupdate-dev libsuitesparse-dev \
    libsundials-dev && \
    rm -rf /var/lib/apt/lists/*

# set locale to en_US
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

#install nosocket
RUN make -C ./src/nosocket/ all && make -C ./src/nosocket/ install
# import files from base
WORKDIR /root/executr/
COPY . /root/executr/
RUN npm install

EXPOSE 6970