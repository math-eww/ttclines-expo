const axios = require('axios').default;
const xmlparser = require('fast-xml-parser');
// export default 
class API {
    constructor() {
        this.id = 'ttc-api';
        
        this.baseRequestUrl = 'http://webservices.nextbus.com/service/publicXMLFeed?command=';
        this.agencyString = '&a=ttc';
        this.routeIdString = '';
        this.stopIdString = '';
        this.timeString = '&t=0';
        this.command = '';

        this.requestUrlString = '';
    }

    async getRoutes() {
        // console.log("Refreshing routes list");
        this.command = 'routeList';
        this.requestUrlString = this.baseRequestUrl + this.command + this.agencyString;
        try {
            const response = await axios.get(this.requestUrlString);
            // console.log(response.data);
            return response.data;
        } catch (error) {
            console.log("API request error in getRoutes", error);
        }
    }

    async getStopsOnRoute(route) {
        // console.log("Refreshing stops list for route", route);
        this.command = 'routeConfig';
        this.routeIdString = '&r=' + route;
        this.requestUrlString = this.baseRequestUrl + this.command + this.agencyString + this.routeIdString;
        try {
            return axios.get(this.requestUrlString);
            // console.log(response.data);
            // return response.data;
        } catch (error) {
            console.log("API request error in getStopsOnRoute", error);
        }
    }

    async loadAllStops() {
        // First get the routes
        let allRoutes = xmlparser.parse(await this.getRoutes(), {
            attributeNamePrefix : "",
            ignoreAttributes : false,
        });
        // Iterate the route and await all promises
        let promises = [];
        allRoutes['body']['route'].forEach(route => {
            // console.log(route);
            promises.push(this.getStopsOnRoute(route.tag))
        });
        const results = await Promise.all(promises);
        let stops = {};
        let directions = {};
        results.forEach(result =>{
            const parsed = xmlparser.parse(result.data, {
                attributeNamePrefix : "",
                ignoreAttributes : false,
            });
            //TODO: maybe we can make this more efficient, it loops over all the route results and merges
            //them into the object stops -- maybe I could merge the entire array first then avoid remerging
            //the object repeatedly
            Object.assign(stops, parsed['body']['route']['stop'].reduce((obj, item) => {
                if (item.lat && item.lon) {
                    item.lat = parseFloat(item.lat);
                    item.lon = parseFloat(item.lon);
                } 
                obj[item.stopId] = item
                return obj
            }, {}));
            //Get direction data
            Object.assign(directions, parsed['body']['route']['direction'].reduce((obj, item) => {
                obj[item.tag] = item
                return obj
            }, {}));
            //TODO: extract path data from request here to show route paths
        });
        delete stops['undefined'];
        delete directions['undefined'];
        // console.log("Stops", JSON.stringify(stops, null, 4));
        console.log("Loaded " + Object.keys(stops).length);
        return {'stops': stops, 'directions': directions};
    }

    async getPredictionForStop(stop) {
        // Optionally can provide route here as well to get predictions for one route only
        console.log("Getting prediction for stop", stop);
        this.command = 'predictions';
        this.stopIdString = '&stopId=' + stop;
        this.requestUrlString = this.baseRequestUrl + this.command + this.agencyString + this.stopIdString;
        try {
            const response = await axios.get(this.requestUrlString);
            // console.log(response.data);
            return response.data;
        } catch (error) {
            console.log("API request error in getRoutes", error);
        }
    }

    async getPredictionData(stop) {
        let predictionResult = xmlparser.parse(await this.getPredictionForStop(stop), {
            attributeNamePrefix : "",
            ignoreAttributes : false,
        })['body']['predictions'];
        if (predictionResult === undefined) { return 'No predictions for this stop' }
        if (!Array.isArray(predictionResult)) { predictionResult = [ predictionResult ]}
        // console.log(JSON.stringify(predictionResult, null, 4));
        let predictionsObject = {}; // { "route": { "dirTag": [prediction1, prediction2], "dirTag2": [prediction1, prediction2] }}
        predictionResult.sort((a, b) => parseInt(a.routeTag) - parseInt(b.routeTag));
        predictionResult.forEach(prediction => {
            predictionsObject[prediction['routeTag']] = {};

            if (prediction['direction']) {
                if (!Array.isArray(prediction['direction'])) { prediction['direction'] = [ prediction['direction'] ]}

                prediction['direction'].forEach(predictionDirection => {
                    if (predictionDirection['prediction']) {
                        if (!Array.isArray(predictionDirection['prediction'])) { predictionDirection['prediction'] = [ predictionDirection['prediction'] ]}

                        predictionDirection['prediction'].forEach(predictionTime => {
                            if (predictionsObject[prediction['routeTag']][predictionTime['dirTag']] === undefined) {
                                predictionsObject[prediction['routeTag']][predictionTime['dirTag']] = [];
                            }
                            predictionsObject[prediction['routeTag']][predictionTime['dirTag']].push(predictionTime['minutes']); //Could assign entire predictionTime object here
                        });
                    }
                });
            }
        });
        return predictionsObject
        //TODO: test all stops
    }

    async getVehicleLocations() {
        // console.log("Refreshing routes list");
        //http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&t=<epoch time in msec></epoch>
        this.command = 'vehicleLocations';
        this.requestUrlString = this.baseRequestUrl + this.command + this.agencyString + this.timeString;
        try {
            const response = await axios.get(this.requestUrlString);
            // console.log(response.data);
            return response.data;
        } catch (error) {
            console.log("API request error in getVehicleLocations", error);
        }
    }

    async getVehicleLocationData() {
        let vehicleLocationsResult = xmlparser.parse(await this.getVehicleLocations(), {
            attributeNamePrefix : "",
            ignoreAttributes : false,
        })['body'];
        if (vehicleLocationsResult === undefined) { return 'Unable to load vehicle locations' }
        // console.log(JSON.stringify(vehicleLocationsResult['vehicle'], null, 4));
        // console.log(vehicleLocationsResult['lastTime']['time']);
        this.timeString = '&t=' + vehicleLocationsResult['lastTime']['time'];
        return vehicleLocationsResult['vehicle'];
    }
}

module.exports = API;