 
# Usage:
#     docker build --tag=derrickoswald/things_dev .
# interactive:
# 
# original:
#     docker run -it -e DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix batmat/docker-eclipse
#     docker run --tty --interactive --rm --env=DISPLAY --volume=/tmp/.X11-unix:/tmp/.X11-unix derrickoswald/things_dev
#     docker run --tty --interactive --rm --name things_development --publish=6984:5984 --publish=9112:8112 derrickoswald/things_development
#     docker run --env=DISPLAY --rm --name things_development --publish=6984:5984 --publish=9112:8112 --volume=$HOME/.Xauthority:/home/developer/.Xauthority:ro --net=host derrickoswald/things_development
#     docker run --env=DISPLAY --rm --name things_development --publish=6984:5984 --publish=9112:8112 --volume=$HOME/.Xauthority:/home/developer/.Xauthority:ro --net=host --user=eclipse --workdir=/home/eclipse derrickoswald/things_dev /usr/local/eclipse/eclipse
# docker run --tty --interactive --rm --env=DISPLAY --volume=/tmp/.X11-unix:/tmp/.X11-unix derrickoswald/things_dev /bin/bash

FROM derrickoswald/things
MAINTAINER Derrick Oswald <derrickoswald@gmail.com>

RUN apt-get update && \
    apt-get install --assume-yes --force-yes \
    firefox

ENV ECLIPSE_DOWNLOAD_URL http://download.eclipse.org/technology/epp/downloads/release/mars/R/eclipse-jee-mars-R-linux-gtk-x86_64.tar.gz
ENV ECLIPSE_INSTALLATION_DIR /usr/local/
RUN curl "$ECLIPSE_DOWNLOAD_URL" | tar --extract --gzip --directory=$ECLIPSE_INSTALLATION_DIR

# Set up the extras for developing the things system
# see https://hub.docker.com/r/xcgd/libreoffice/~/dockerfile/
RUN wget --output-document=/usr/local/bin/erica https://people.apache.org/~dch/dist/tools/erica && \
    chmod +x /usr/local/bin/erica && \
    npm install git+https://github.com/jsdoc3/jsdoc.git -g && \
    apt-get update && \
    apt-get install --assume-yes --force-yes \
    libreoffice \
    libreoffice-writer \
    ure \
    libreoffice-java-common \
    libreoffice-core \
    libreoffice-common \
    fonts-opensymbol \
    hyphen-fr \
    hyphen-de \
    hyphen-en-us \
    hyphen-it \
    hyphen-ru \
    fonts-dejavu \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    fonts-droid \
    fonts-dustin \
    fonts-f500 \
    fonts-fanwood \
    fonts-freefont-ttf \
    fonts-liberation \
    fonts-lmodern \
    fonts-lyx \
    fonts-sil-gentium \
    fonts-texgyre \
    fonts-tlwg-purisa \
    libswt-gtk-3-java && \
    apt-get remove --assume-yes --force-yes \
    libreoffice-gnome

COPY org.eclipse.core.variables.prefs /home/developer/workspace/.metadata/.plugins/org.eclipse.core.runtime/.settings/

#RUN adduser --disabled-password --quiet --gecos '' eclipse && \
#    chown -R root:eclipse $ECLIPSE_INSTALLATION_DIR/eclipse && \
#    chmod -R 775 $ECLIPSE_INSTALLATION_DIR/eclipse

# USER eclipse
#ENTRYPOINT INSTALLATION_DIR/eclipse/eclipse
# Define default command
#CMD ["bash"]

# TODO : variabilize those values # Replace 1000 with your user / group id
RUN export uid=1000 gid=1000 && \
    mkdir -p /home/developer && \
    echo "developer:x:${uid}:${gid}:Developer,,,:/home/developer:/bin/bash" >> /etc/passwd && \
    echo "developer:x:${uid}:" >> /etc/group && \
    echo "developer ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/developer && \
    chmod 0440 /etc/sudoers.d/developer && \
    chown ${uid}:${gid} -R /home/developer
USER developer
ENV HOME /home/developer
WORKDIR /home/developer
RUN git clone https://github.com/derrickoswald/things.git

CMD /usr/local/eclipse/eclipse
