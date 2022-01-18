"use strict"

const Mobx = require("mobx")

module.exports = Mobx.observable({
    playerData: {},
    eventData: {},
    resultsData: {},
    pointsManifest: {},
    initCount: 0,
    rankingData: {},
    ratingData: {},
    topRankingResultsCount: 8
})
