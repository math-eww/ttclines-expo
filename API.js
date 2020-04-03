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
        this.timeString = '';
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

    async loadPredictionString(stop) {
        let predictionResult = xmlparser.parse(await this.getPredictionForStop(stop), {
            attributeNamePrefix : "",
            ignoreAttributes : false,
        })['body']['predictions'];
        if (predictionResult === undefined) { return 'No predictions for this stop' }
        if (!Array.isArray(predictionResult)) { predictionResult = [ predictionResult ]}
        // console.log(JSON.stringify(predictionResult, null, 4));
        let predictionString = '';
        predictionResult.sort((a, b) => parseInt(a.routeTag) - parseInt(b.routeTag));
        predictionResult.forEach(prediction => {
            predictionString = predictionString + prediction['routeTag'] + ': ';
            if (prediction['direction']) {
                if (!Array.isArray(prediction['direction'])) { prediction['direction'] = [ prediction['direction'] ]}
                // console.log(prediction['direction']);
                prediction['direction'].forEach(predictionDirection => {
                    // console.log(predictionDirection);
                    // predictionString = predictionString + ' ' + predictionDirection['title'] + ' ';
                    if (predictionDirection['prediction']) {
                        if (!Array.isArray(predictionDirection['prediction'])) { predictionDirection['prediction'] = [ predictionDirection['prediction'] ]}
                        predictionDirection['prediction'].forEach(predictionTime => {
                            predictionString = predictionString + predictionTime['minutes'] + 'm | '
                        });
                    }
                });
            }
            predictionString = predictionString + '\n';
        });
        predictionString = predictionString.substring(0, predictionString.length - 2);
        console.log("Built prediction string\n" + predictionString + '\n\n');
        return predictionString
        //TODO: this needs some work still getting undefined errors sometimes -- fixed?
        //TODO: change to send direction data (dirTag) and parse actual sub-route title from it and directionsData in App.js
    }
}

module.exports = API;