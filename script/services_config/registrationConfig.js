module.exports = {
  app: {
    port: 8811,
    allowedDomains: "*"
  },
  db: {
    url: "http://couchdb:5984",
    registration: "api-keys"
  }
};
