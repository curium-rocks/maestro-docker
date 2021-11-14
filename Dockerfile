FROM node:lts-alpine AS build
WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
COPY tsconfig.json /usr/src/app/
COPY src /usr/src/app/src
RUN npm ci
RUN npm run build

FROM node:lts-alpine AS lib
WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
RUN npm ci --only=production


FROM node:lts-alpine
RUN apk add dumb-init
ENV NODE_ENV production
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=lib /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node --from=build /usr/src/app/build/src /usr/src/app
CMD ["dumb-init", "node", "index.js"]