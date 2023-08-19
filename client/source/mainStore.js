"use strict"

const Mobx = require("mobx")

module.exports = Mobx.observable({
    playerData: {},
    eventData: {},
    resultsData: {},
    pointsManifest: {},
    topRankingResultsCount: 8,
    selectedVersion: null,
    versions: [],
    cachedPointsData: {}
})
