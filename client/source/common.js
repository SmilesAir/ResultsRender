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

module.exports.downloadPlayerAndManifestData = function() {
    Common.fetchEx("GET_PLAYER_DATA", {}, {}, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((data) => {
        MainStore.playerData = data.players

        MainStore.cachedDisplayNames = []
        for (let id in MainStore.playerData) {
            let playerData = MainStore.playerData[id]
            MainStore.cachedDisplayNames.push(playerData.firstName.toLowerCase() + "_" + playerData.lastName.toLowerCase())
        }

        ++MainStore.initCount

        console.log("playerData", data)
    }).catch((error) => {
        console.error(`Failed to download Player data: ${error}`)
    })

    Common.fetchEx("GET_EVENT_DATA", {}, {}, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((data) => {
        MainStore.eventData = data.allEventSummaryData

        ++MainStore.initCount

        console.log("eventData", data)
    }).catch((error) => {
        console.error(`Failed to download Event data: ${error}`)
    })

    Common.fetchEx("GET_POINTS_MANIFEST", {}, {}, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((data) => {
        MainStore.pointsManifest = data.manifest

        ++MainStore.initCount

        console.log("manifest", JSON.parse(JSON.stringify(data.manifest)))

        downloadLatestPointsData()
    }).catch((error) => {
        console.error(`Failed to download Manifest data: ${error}`)
    })
}

function downloadLatestPointsData() {
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

    for (let key in manifestData) {
        let sortedDates = manifestData[key].sort((a, b) => {
            return Date.parse(b) - Date.parse(a)
        })

        if (sortedDates.length > 0) {
            let filename = `${key}_${sortedDates[0]}`
            Common.fetchEx("GET_POINTS_DATA", {
                key: filename
            }, {}, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }).then((data) => {
                console.log(filename, data)

                for (let player of data.data) {
                    player.points = Math.round(player.points)
                }

                MainStore.rankingData[key] = data.data
            }).catch((error) => {
                console.error(`Failed to download Manifest data: ${error}`)
            })

        } else {
            console.error("sortedDates is empty")
        }
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

module.exports.uploadPointsData = function(endpoint, date, divisionName, data) {
    Common.fetchEx(endpoint, {
        date: date,
        divisionName: divisionName
    }, {}, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then((response) => {
        console.log(response)
    }).catch((error) => {
        console.error(`Failed to upload: ${error}`)
    })
}
