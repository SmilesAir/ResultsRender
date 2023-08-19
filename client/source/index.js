/* eslint-disable no-nested-ternary */
"use strict"

const React = require("react")
const ReactDOM = require("react-dom")
const MobxReact = require("mobx-react")
const ReactSelect = require("react-select").default
const { runInAction } = require("mobx")
import { useTable, useSortBy } from "react-table"
import styled from "styled-components"
import { Tab, Tabs, TabList, TabPanel } from "react-tabs"
import "react-tabs/style/react-tabs.css"

const MainStore = require("mainStore.js")
const Common = require("common.js")

require("./index.less")

@MobxReact.observer class Main extends React.Component {
    constructor() {
        super()

        Common.downloadPlayerAndManifestData().then(async() => {
            Common.parseVersions()
            if (MainStore.versions.length > 0) {
                MainStore.selectedVersion = {
                    label: `Current - ${MainStore.versions[0]}`,
                    value: MainStore.versions[0]
                }
                await Common.downloadPointsData(MainStore.versions[0])

                // Have no idea why this doesn't update automatically
                this.forceUpdate()
            }
        })
    }

    getVersionOptions() {
        return MainStore.versions.map((data, i) => {
            return {
                label: i === 0 ? `Current - ${data}` : data,
                value: data
            }
        })
    }

    onSelectVersion(selected) {
        runInAction(async() => {
            MainStore.selectedVersion = selected
            await Common.downloadPointsData(selected.value)

            // A little hacky, but version updates rarely
            this.forceUpdate()
        })
    }

    render() {
        return (
            <div>
                <ReactSelect value={MainStore.selectedVersion} onChange={(e) => this.onSelectVersion(e)} options={this.getVersionOptions()} isLoading={MainStore.versions.length === 0} placeholder="Choose Version" />
                <Tabs>
                    <TabList>
                        <Tab>
                            Open Rankings
                        </Tab>
                        <Tab>
                            Women Rankings
                        </Tab>
                        <Tab>
                            Open Ratings
                        </Tab>
                        <Tab>
                            Open Rankings Detailed
                        </Tab>
                        <Tab>
                            Women Rankings Detailed
                        </Tab>
                    </TabList>
                    <TabPanel>
                        <Styles>
                            <RankingTable dataName="ranking-open" />
                        </Styles>
                    </TabPanel>
                    <TabPanel>
                        <Styles>
                            <RankingTable dataName="ranking-women" />
                        </Styles>
                    </TabPanel>
                    <TabPanel>
                        <Styles>
                            <RatingTable dataName="rating-open" />
                        </Styles>
                    </TabPanel>
                    <TabPanel>
                        <Styles>
                            <RankingTable dataName="ranking-open" isDetailed={true} />
                        </Styles>
                    </TabPanel>
                    <TabPanel>
                        <Styles>
                            <RankingTable dataName="ranking-women" isDetailed={true} />
                        </Styles>
                    </TabPanel>
                </Tabs>
            </div>
        )
    }
}

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`
function tryGetData(dataName) {
    if (MainStore.selectedVersion === null || MainStore.selectedVersion === undefined ||
        MainStore.selectedVersion.value === null || MainStore.selectedVersion.value === undefined) {
        return {
            errorElement: <h2>Loading...</h2>
        }
    }

    const filename = `${dataName}_${MainStore.selectedVersion.value}`
    const data = MainStore.cachedPointsData[filename]
    if (MainStore.versions.length === 0) {
        return {
            errorElement: <h2>Loading...</h2>
        }
    }
    if (data === undefined) {
        if (MainStore.pointsManifest[filename] !== undefined) {
            return {
                errorElement: <h2>Loading...</h2>
            }
        } else {
            return {
                errorElement: <h2>No Ranking Data for Selected Version</h2>
            }
        }
    }

    return {
        data: data
    }
}

function RankingTable({ dataName, isDetailed }) {
    let ret = tryGetData(dataName)
    if (ret.data === undefined) {
        return ret.errorElement
    }

    let columns = React.useMemo(
        () => [
            {
                Header: "Rank",
                accessor: "rank",
                sortDescFirst: true
            },
            {
                Header: "Name",
                accessor: "fullName"
            },
            {
                Header: "Points",
                accessor: "points",
                sortDescFirst: true
            },
            {
                Header: "Events",
                accessor: "resultsCount",
                sortDescFirst: true
            }
        ],
        []
    )

    if (isDetailed) {
        for (let i = 1; i <= MainStore.topRankingResultsCount; ++i) {
            columns.push({
                Header: `Event ${i}`,
                accessor: `event${i}`,
                sortDescFirst: true
            })
        }
    }

    return resultsTable(columns, ret.data)
}

function RatingTable({ dataName }) {
    let ret = tryGetData(dataName)
    if (ret.data === undefined) {
        return ret.errorElement
    }

    let columns = React.useMemo(
        () => [
            {
                Header: "#",
                accessor: "rank",
                sortDescFirst: true
            },
            {
                Header: "Name",
                accessor: "fullName"
            },
            {
                Header: "Rating",
                accessor: "rating",
                sortDescFirst: true
            },
            {
                Header: "Matches",
                accessor: "matchCount",
                sortDescFirst: true
            },
            {
                Header: "Peak Rating",
                accessor: "highestRating",
                sortDescFirst: true
            },
            {
                Header: "Peak Rating Date",
                accessor: "highestRatingDate",
                sortDescFirst: true
            }
        ],
        []
    )

    return resultsTable(columns, ret.data)
}

function resultsTable(columns, data) {
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns: columns, data: data }, useSortBy)

    return (
        <table {...getTableProps()} style={{ border: "solid 1px blue" }}>
            <thead>
                {headerGroups.map((headerGroup, i) =>
                    <tr key={i} {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column, j) =>
                            <th key={j} {...column.getSortByToggleProps()}>
                                {column.render("Header")}
                                <span>
                                    {column.isSorted ?
                                        column.isSortedDesc ?
                                            " \u2B07" :
                                            " \u2B06" :
                                        ""}
                                </span>
                            </th>
                        )}
                    </tr>
                )}
            </thead>
            <tbody {...getTableBodyProps()}>
                {rows.map((row, i) => {
                    prepareRow(row)
                    return (
                        <tr key={i} {...row.getRowProps()}>
                            {row.cells.map((cell, j) => {
                                return (
                                    <td key={j} {...cell.getCellProps()} >
                                        {cell.render("Cell")}
                                    </td>
                                )
                            })}
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}

ReactDOM.render(
    <Main />,
    document.getElementById("mount")
)
