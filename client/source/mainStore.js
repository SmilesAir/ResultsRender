"use strict"

const Mobx = require("mobx")

module.exports = Mobx.observable({
    playerData: {},
    eventData: {},
    pointsManifest: {},
    initCount: 0,
    rankingData: {}
})
