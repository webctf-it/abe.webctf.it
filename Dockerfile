FROM node:lts-alpine

# Install pm2 and curl
RUN npm install pm2 -g && \
    apk add --update curl chromium tzdata && \
    rm -f /var/cache/apk/*

# Timezone
ENV TZ=Europe/Rome

# Bundle APP files
COPY ./site src/

# Change workdir
WORKDIR src/

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install --omit=dev

# Running APP
CMD [ "pm2-runtime", "start", "bin/www" ]

