FROM node:slim
RUN dpkg-reconfigure -p critical dash

# CREATE RUNNERS
RUN for i in $(seq 1001 1500); do \
        groupadd -g $i runner$i && \
        useradd -M runner$i -g $i -u $i ; \
    done

# CREATE DATA DIRECTORY
RUN mkdir /executr_data

# SET WORKDIR
WORKDIR /executr/

# UPDATE PACKAGES
RUN echo "" > /etc/apt/apt.conf 
RUN apt-get -y update && \
    apt-get -y install libxml2 gnupg tar coreutils util-linux libc6-dev \
    binutils build-essential locales libpcre3-dev libevent-dev libgmp3-dev \
    libncurses6 libncurses5 libedit-dev libseccomp-dev rename procps python3 \
    libreadline-dev libblas-dev liblapack-dev libpcre3-dev libarpack2-dev \
    libfftw3-dev libglpk-dev libqhull-dev libqrupdate-dev libsuitesparse-dev \
    libsundials-dev && \
    rm -rf /var/lib/apt/lists/*

# set locale to en_US
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

# INSTALL REQUIREMENTS
COPY ["package.json", "/executr/"]
RUN npm install node-gyp
RUN npm install /executr

# IMPORT SOURCE
COPY . /executr/

# INSTALL NOSOCKET
RUN make -C ./src/nosocket/ all && make -C ./src/nosocket/ install

# EXPOSE PORT
EXPOSE 6970

# START SERVER
CMD ["node", "."]