FROM mhart/alpine-node

WORKDIR /app

COPY . .
RUN apk add --no-cache \
        build-base \
        g++ \
        cairo-dev \
        jpeg-dev \
        pango-dev \
        giflib-dev
RUN npm install
RUN npm run build:prod

EXPOSE 80

CMD npm run start:prod
