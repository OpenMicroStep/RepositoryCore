
// /////////////
// Requires 
// add here all requires necessary to provide full method access
var apiRapo = require('../lib/externalServices/apiRapo');
var location = require('../lib/location');

// END Requires 
// /////////////

var proxyServices = {
    "api-rapo-logitud": [
        {
            "in-url": "/fines/v1", 
            "in-method": "POST", 
            "service-method": apiRapo.sendExtraDataFromFPS
            // ,"not-transactional": true // for tests

        }
    ], 
    // "api-rapo-other-provider": [
    //     {
    //         "in-url": "/fines/v1", 
    //         "in-method": "POST", 
    //         "service-method": "sendExtraInfoToOtherRapoProvider"
    //     }, 
    //     {
    //         "in-url": "/fines/v2", 
    //         "in-method": "POST", 
    //         "service-method": "sendExtraInfoToOtherRapoProviderV2"
    //     }
    // ], 
    "api-location": [
        // {
        //     "in-url": "https://services-dev.logitud.fr/location/i-am-here/v1", 
        //     "in-method": "POST", 
        //     "service-method": location.currentPosition
        // }, 
        {
            "in-url": "/fines/v1", 
            "in-method": "POST", 
            "service-method": location.locateFromFine,
            "not-transactional": true
        }, 
        // {
        //     "in-url": "/fine-values/v1/", 
        //     "in-method": "SEARCH", 
        //     "service-method": location.locateFromFineValues
        // }, 
        // {
        //     "in-url": "/fine-values/v1/", 
        //     "in-method": "GET", 
        //     "service-method": location.locateFromFineValues
        // }
    ], 
    // "api-controls-fps": [
    //     {
    //         "in-url": ":baseurl/controls/startSessionControls/v1", 
    //         "in-method": "POST", 
    //         "service-method": "stashStartSessionControls"
    //     }, 
    //     {
    //         "in-url": "https://services-dev.logitud.fr/controls/closeSessionControls/v2", 
    //         "in-method": "POST", 
    //         "service-method": "stashCloseSessionControls"
    //     }, 
    //     {
    //         "in-url": "https://services-dev.logitud.fr/controls/next/v1", 
    //         "in-method": "GET", 
    //         "service-method": "controls.getNextControlForAgent"
    //     }, 
    //     {
    //         "in-url": "https://services-dev.logitud.fr/fines-values/v1", 
    //         "in-method": "POST", 
    //         "service-method": "controls.stashControlCalculating"
    //     }, 
    //     {
    //         "in-url": "https://services-dev.logitud.fr/fines/v1", 
    //         "in-method": "POST", 
    //         "service-method": "controls.stashControlEmitting"
    //     }
    // ]
};


module.exports.proxyServices = proxyServices;
