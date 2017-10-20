module.exports = {
  app: {
    port: 8812,
    allowedDomains: "*"
  },
  db: {
    url: 'mongodb://mongodb:27017/sfps',
    name: "sign"
  }
};
