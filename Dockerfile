FROM node:6
WORKDIR /srv/
COPY dist/openms.aspects.node/node_modules dist/openms.aspects.angular/node_modules /srv/

EXPOSE 8080
CMD ["node", "/srv/repository server/server/src/server.js"]
