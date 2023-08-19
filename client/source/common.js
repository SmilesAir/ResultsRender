/* eslint-disable no-loop-func */
"use strict"

const MainStore = require("mainStore.js")
const Endpoints = require("endpoints.js")

let Common = module.exports

module.exports.fetchEx = function(key, pathParams, queryParams, options) {
    return fetch(Endpoints.buildUrl(key, pathParams, queryParams), options).then((response) => {
        return response.json()
    })
}

function isValidText(str) {
    return str !== undefined && str !== null && str.length > 0
}

module.exports.getDisplayNameFromPlayerData = function(playerData) {
    let displayName = ""
    if (isValidText(playerData.firstName) && isValidText(playerData.lastName)) {
        displayName = playerData.firstName.toLowerCase() + "_" + playerData.lastName.toLowerCase()
    } else if (isValidText(playerData.firstName)) {
        displayName = playerData.firstName.toLowerCase()
    }else if (isValidText(playerData.lastName)) {
        displayName = playerData.lastName.toLowerCase()
    }

    return displayName.replaceAll(" ", "_")
}

module.exports.downloadPlayerAndManifestData = function() {
    let playerPromise = Common.fetchEx("GET_PLAYER_DATA", {}, {}, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((data) => {
        MainStore.playerData = data.players

        MainStore.cachedDisplayNames = []
        for (let id in MainStore.playerData) {
            let playerData = MainStore.playerData[id]
            MainStore.cachedDisplayNames.push(Common.getDisplayNameFromPlayerData(playerData))
        }

        console.log("playerData", data)
    }).catch((error) => {
        console.error(`Failed to download Player data: ${error}`)
    })

    let eventPromise = Common.fetchEx("GET_EVENT_DATA", {}, {}, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((data) => {
        MainStore.eventData = data.allEventSummaryData

        console.log("eventData", data)
    }).catch((error) => {
        console.error(`Failed to download Event data: ${error}`)
    })

    let resultsPromise = Common.fetchEx("GET_RESULTS_DATA", {}, {}, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((data) => {
        MainStore.resultsData = data.results

        console.log("resultsData", JSON.parse(JSON.stringify(MainStore.resultsData)))
    }).catch((error) => {
        console.error(`Failed to download Results data: ${error}`)
    })

    let manifestPromise = Common.fetchEx("GET_POINTS_MANIFEST", {}, {}, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((data) => {
        MainStore.pointsManifest = data.manifest

        console.log("manifest", JSON.parse(JSON.stringify(data.manifest)))
    }).catch((error) => {
        console.error(`Failed to download Manifest data: ${error}`)
    })

    return Promise.all([ playerPromise, eventPromise, resultsPromise, manifestPromise ])
}

function dateFromString(str) {
    let a = str.split(/[^0-9]/).map((s) => {
        return parseInt(s, 10)
    })
    return new Date(a[0], a[1] - 1 || 0, a[2] || 1, a[3] || 0, a[4] || 0, a[5] || 0, a[6] || 0)
}

module.exports.parseVersions = function() {
    let manifestData = {}
    for (let key in MainStore.pointsManifest) {
        let splits = key.split("_")
        if (splits.length === 2) {
            let type = splits[0]
            if (manifestData[type] === undefined) {
                manifestData[type] = [ splits[1] ]
            } else {
                manifestData[type].push(splits[1])
            }
        } else {
            console.error(`Can't parse manifest data '${key}'`)
        }
    }

    let rankingManifestData = manifestData["ranking-open"]
    let sortedDates = rankingManifestData.sort((a, b) => {
        return dateFromString(b).getTime() - dateFromString(a).getTime()
    })

    // Use ranking-open dates as versions
    MainStore.versions = sortedDates
}

module.exports.downloadPointsData = async function(version) {
    let pointsTypes = [ "ranking-open", "ranking-women", "rating-open" ]
    for (let type of pointsTypes) {
        let filename = `${type}_${version}`
        if (MainStore.cachedPointsData[filename] !== undefined) {
            continue
        }

        await Common.fetchEx("GET_POINTS_DATA", {
            key: filename
        }, {}, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }).then((data) => {
            if (filename.startsWith("ranking")) {
                for (let player of data.data) {
                    player.points = Math.round(player.points)
                    for (let i = 0; i < MainStore.topRankingResultsCount && i < player.pointsList.length; ++i) {
                        let resultData = MainStore.resultsData[player.pointsList[i].resultsId]
                        player[`event${i + 1}`] = `${resultData.eventName}, ${resultData.divisionName}: ${Math.round(player.pointsList[i].points)}`
                    }
                }

                MainStore.cachedPointsData[filename] = data.data
            } else {
                let rank = 1
                for (let player of data.data) {
                    player.rating = Math.round(player.rating)
                    player.highestRating = Math.round(player.highestRating)
                    player.rank = rank++
                }

                MainStore.cachedPointsData[filename] = data.data
            }
        }).catch((error) => {
            console.error(`Failed to download Manifest data: ${error}`)
        })
    }
}

module.exports.generatePoolsRankingPointsArray = function(numPlayers, numPlaces, kFactor, bonus) {
    let topScore = numPlayers * kFactor + (bonus || 0)
    let base = Math.pow(topScore, 1 / (numPlaces - 1))

    let pointsArray = []
    for (let i = 0; i < numPlaces; ++i) {
        pointsArray.splice(0, 0, Math.round(topScore / Math.pow(base, i) * 10) / 10)
    }

    return pointsArray
}

module.exports.getSortedEventData = function(startTime, endTime) {
    let sortedEventData = []
    for (let eventId in MainStore.eventData) {
        let eventData = MainStore.eventData[eventId]
        if (startTime !== undefined && endTime !== undefined) {
            let eventTime = Date.parse(eventData.startDate)
            if (eventTime < startTime || eventTime > endTime) {
                continue
            }
        }

        sortedEventData.push(eventData)
    }

    return sortedEventData.sort((a, b) => {
        return Date.parse(a.startDate) - Date.parse(b.startDate)
    })
}
