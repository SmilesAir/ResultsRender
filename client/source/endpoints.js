"use strict"


let urls = undefined
if (__STAGE__ === "DEVELOPMENT") {
    urls = {
        GET_PLAYER_DATA: "https://tkhmiv70u9.execute-api.us-west-2.amazonaws.com/development/getAllPlayers",
        GET_EVENT_DATA: "https://xyf6qhiwi1.execute-api.us-west-2.amazonaws.com/development/getAllEvents",
        GET_RESULTS_DATA: "https://pkbxpw400j.execute-api.us-west-2.amazonaws.com/development/getAllResults",
        GET_POINTS_MANIFEST: "https://k7p1y5ntz6.execute-api.us-west-2.amazonaws.com/development/getManifest",
        GET_POINTS_DATA: "https://k7p1y5ntz6.execute-api.us-west-2.amazonaws.com/development/downloadPointsData/<key>"
    }
} else {
    urls = {
        GET_PLAYER_DATA: "https://4wnda3jb78.execute-api.us-west-2.amazonaws.com/production/getAllPlayers",
        GET_EVENT_DATA: "https://wyach4oti8.execute-api.us-west-2.amazonaws.com/production/getAllEvents",
        GET_RESULTS_DATA: "https://v869a98rf9.execute-api.us-west-2.amazonaws.com/production/getAllResults",
        GET_POINTS_MANIFEST: "https://kvq5a3et4b.execute-api.us-west-2.amazonaws.com/production/getManifest",
        GET_POINTS_DATA: "https://kvq5a3et4b.execute-api.us-west-2.amazonaws.com/production/downloadPointsData/<key>"
    }
}

module.exports.buildUrl = function(key, pathParams, queryParams) {
    let path = __STAGE__ === "DEVELOPMENT" ? "https://0uzw9x3t5g.execute-api.us-west-2.amazonaws.com" : "https://w0wkbj0dd9.execute-api.us-west-2.amazonaws.com"
    path += `/${__STAGE__.toLowerCase()}`

    let pathReplaceData = {
        "path": path,
        "stage": __STAGE__.toLowerCase()
    }

    Object.assign(pathReplaceData, pathParams)

    let url = urls[key]
    for (let wildName in pathReplaceData) {
        url = url.replace(`<${wildName}>`, pathReplaceData[wildName])
    }

    let firstQueryParam = true
    for (let paramName in queryParams) {
        let prefix = firstQueryParam ? "?" : "&"
        firstQueryParam = false

        url += `${prefix}${paramName}=${queryParams[paramName]}`
    }

    return url
}
