How to test
===========

```sh
npm install @openmicrostep/msbuildsystem.cli
msbuildsystem build -w dist
cd script && npm install && cd ..
docker-compose up
# open http://localhost:8080/UUID/APP
```
