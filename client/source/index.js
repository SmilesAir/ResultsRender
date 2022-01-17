/* eslint-disable no-nested-ternary */
"use strict"

const React = require("react")
const ReactDOM = require("react-dom")
const MobxReact = require("mobx-react")
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

        Common.downloadPlayerAndManifestData()
    }

    render() {
        let hasAllData = MainStore.rankingData["ranking-open"] !== undefined && MainStore.rankingData["ranking-women"] !== undefined
        if (hasAllData) {
            return (
                <div>
                    <Tabs>
                        <TabList>
                            <Tab>
                                Open
                            </Tab>
                            <Tab>
                                Women
                            </Tab>
                            <Tab>
                                Open Detailed
                            </Tab>
                            <Tab>
                                Women Detailed
                            </Tab>
                        </TabList>
                        <TabPanel>
                            <Styles>
                                <RankingTable rankingDataName="ranking-open" />
                            </Styles>
                        </TabPanel>
                        <TabPanel>
                            <Styles>
                                <RankingTable rankingDataName="ranking-women" />
                            </Styles>
                        </TabPanel>
                    </Tabs>
                </div>
            )
        } else {
            return null
        }
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

function RankingTable({ rankingDataName }) {
    const data = React.useMemo(() => MainStore.rankingData[rankingDataName], [])

    const columns = React.useMemo(
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
                                            " 🔽" :
                                            " 🔼" :
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
