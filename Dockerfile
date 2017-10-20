FROM node:6
WORKDIR /srv/services/

COPY dist/openms.aspects.node/ dist/openms.aspects.node/ /srv/

EXPOSE 8080
CMD ["node", "/srv/openms.aspects.node/node_modules/repository server/server/src/server.js"]
