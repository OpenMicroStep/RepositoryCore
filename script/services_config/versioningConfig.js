module.exports = {
    app: {
        port: 8803,
        //socket: "/srv/services-dev/sockets/versioning.dev.socket",
        allowedDomains: "*"
    },
    externalProxy: {
        protocol: "https",
        host: "services.logitud.fr",
        port: 8001
    },
    path : __dirname + "/../"
};
