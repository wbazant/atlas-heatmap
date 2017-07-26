import React from 'react'
import PropTypes from 'prop-types'

import Anatomogram from 'anatomogram'

import uncontrollable from 'uncontrollable'

import GenomeBrowsersDropdown from './controls/GenomeBrowsersDropdown.js'
import OrderingsDropdown from './controls/OrderingsDropdown.js'
import DownloadButton from './controls/download-button/DownloadButton.js'
import FiltersButton from './controls/filter/FiltersButton.js'

import HeatmapCanvas from '../show/HeatmapCanvas.js'

import cellTooltipFormatter from './formatters/heatmapCellTooltipFormatter.js'
import axesFormatters from './formatters/axesFormatters.js'

import {DataSeriesLegend as MultiExperimentLegend , GradientLegend as SingleExperimentLegend} from './heatmap-legend/Main.js'
import CoexpressionOption from './coexpression/CoexpressionOption.js'

import makeEventCallbacks from './Events.js'

import {manipulate} from './Manipulators.js'

import {heatmapDataPropTypes, heatmapConfigPropTypes, orderingPropTypes, filterPropTypes, colourAxisPropTypes, columnGroupsPropTypes} from '../manipulate/chartDataPropTypes.js'


const renderGenomeBrowsersDropdown = ({
    allGenomeBrowsers,
    currentGenomeBrowser,
    onChangeCurrentGenomeBrowser }) => (
    allGenomeBrowsers.length
    ?   <div style={{display: `inline-block`, padding: `5px`}}>
            <GenomeBrowsersDropdown
                genomeBrowsers={allGenomeBrowsers}
                selected={currentGenomeBrowser}
                onSelect={onChangeCurrentGenomeBrowser} />
        </div>
    : null
)

const renderOrderings = ({heatmapData,heatmapConfig,allOrderings,currentOrdering,onChangeCurrentOrdering, currentZoom}) => {
    const orderingCanChangeRowOrder = heatmapData.yAxisCategories.length > 1

    return (
        heatmapConfig.isMultiExperiment ?
            <div style={{display: `inline-block`, padding: `5px`}}>
                <OrderingsDropdown
                    allOptions={allOrderings.map(o => o.name)}
                    currentOption={currentOrdering.name}
                    onChangeCurrentOption={(name) => onChangeCurrentOrdering(allOrderings.find(o => o.name == name))}
                    title={currentZoom ? `Reset zoom to enable sorting options` : ``}
                    disabled={currentZoom || ! orderingCanChangeRowOrder}
                />
            </div> :
            null
    )
}

const renderDownloadButton = ({
    heatmapData,
    heatmapConfig:{
        shortDescription,
        description,
        disclaimer
    },
    currentOrdering,
    allNumCoexpressions,
    currentNumCoexpressions}) => (
    <div style={{display: `inline-block`, padding: `5px`}}>
        <DownloadButton {...{
          download: {
              name: shortDescription || "download",
              descriptionLines:
                  [
                      description,
                      `Ordering: ${currentOrdering.name}`,
                      ...allNumCoexpressions ?
                          [`Including ${currentNumCoexpressions} genes with similar expression pattern`] :
                          []
                  ],
              heatmapData
          },
          disclaimer
        }}/>
    </div>
)

const renderFiltersButton = ({
    heatmapConfig,
    heatmapData: {xAxisCategories},
    columnGroups: {groupingNames, categories, data},
    currentZoom,
    allColumnLabels,
    currentSelectedColumnLabels,
    onChangeCurrentSelectedColumnLabels
 }) => (
    heatmapConfig.isMultiExperiment &&
        <div style={{display: `inline-block`, padding: `5px`}}>
            <FiltersButton
                allCategories={categories}
                allValues={allColumnLabels}
                currentValues={currentSelectedColumnLabels}
                disabled={currentZoom}
                onChangeCurrentValues={onChangeCurrentSelectedColumnLabels}
                tabNames={groupingNames}
                />
        </div>
)

const renderCoexpressionOption = ({heatmapConfig,heatmapData,allNumCoexpressions,currentNumCoexpressions,onChangeCurrentNumCoexpressions}) => (
    heatmapConfig.coexpressionsAvailable && !heatmapConfig.isWidget ?
      <CoexpressionOption geneName={heatmapData.yAxisCategories[0].label}
                numCoexpressionsVisible={currentNumCoexpressions}
                numCoexpressionsAvailable={allNumCoexpressions}
                showCoexpressionsCallback={onChangeCurrentNumCoexpressions}
      /> :
      null
)

const renderGenomeBrowserHint = ({currentGenomeBrowser}) => (
    <p style={{clear: `both`, float: `right`, fontSize: `small`, margin: `0`,
               visibility: currentGenomeBrowser === `none` ? `hidden` : ` visible`}}>
      Click on a cell to open the selected genome browser with attached tracks if available
    </p>
)

const CanvasLegend = ({heatmapData,heatmapConfig,colourAxis,children}) => {
    return (
          heatmapConfig.isMultiExperiment ?
            <div>
                {
                    children
                }
              <MultiExperimentLegend
                dataSeries={heatmapData.dataSeries}
              />
            </div> :
            <div>
              <SingleExperimentLegend
                heatmapConfig={heatmapConfig}
                colourAxis={colourAxis}
              />
              {
                  children
              }
            </div>
    )
}
CanvasLegend.propTypes = {
    heatmapConfig: heatmapConfigPropTypes.isRequired,
    heatmapData: heatmapDataPropTypes.isRequired,
    colourAxis: colourAxisPropTypes
}

const heatmapExtraArgs = ({
    heatmapData,
    onOntologyIdIsUnderFocus,
    currentGenomeBrowser,
    heatmapConfig,
    onChangeCurrentZoom,
    ontologyIdsToHighlight
} ) => ({
    ontologyIdsToHighlight,
    onZoom:onChangeCurrentZoom,
    events:
        makeEventCallbacks({
          heatmapData: heatmapData,
          onSelectOntologyIds: onOntologyIdIsUnderFocus,
          genomeBrowser: currentGenomeBrowser,
          experimentAccession: heatmapConfig.experiment && heatmapConfig.experiment.accession,
          accessKey: heatmapConfig.experiment && heatmapConfig.experiment.accessKey,
          atlasUrl: heatmapConfig.atlasUrl}),
    cellTooltipFormatter:
        cellTooltipFormatter(heatmapConfig),
    ...axesFormatters(heatmapConfig)
})

const heatmapDataToPresent = ({
    heatmapConfig,
    heatmapData,
    currentNumCoexpressions,
    currentSelectedColumnLabels,
    currentOrdering}) => manipulate (
    {
        keepSeries: series => true,
        keepRow: heatmapConfig.coexpressionsAvailable
            ? rowHeader => (
                heatmapData.yAxisCategories
                    .slice(0, currentNumCoexpressions + 1)
                    .map(yAxisCategory => yAxisCategory.label)
                    .includes(rowHeader.label)
            )
            : () => true,
        keepColumn:
            columnHeader => currentSelectedColumnLabels.includes(columnHeader.label),
        ordering: currentOrdering,
        allowEmptyColumns: Boolean(heatmapConfig.experiment)
    },
    heatmapData
)

const _HeatmapWithControls = args => (
  <div>
    <div>
      <div style={{float: `left`, lineHeight: `2.5rem`, padding: `0.5rem 0`}}>
        {args.heatmapConfig.introductoryMessage}
      </div>
      <div style={{float: `right`, padding: `0.5rem 0`}}>
        {renderGenomeBrowsersDropdown(args)}
        {renderOrderings(args)}
        {renderFiltersButton(args)}
        {renderDownloadButton(args)}
      </div>
     {
         renderGenomeBrowserHint(args)
     }
    </div>
    <div style={{clear: `both`}}>
    <CanvasLegend {...args}>
        <HeatmapCanvas
            {...heatmapExtraArgs(args)}
            heatmapData={heatmapDataToPresent(args)} />
    </CanvasLegend>
    {
        renderCoexpressionOption(args)
    }
    </div>
  </div>
)

_HeatmapWithControls.propTypes = {
    allGenomeBrowsers: PropTypes.arrayOf(PropTypes.string).isRequired,
    currentGenomeBrowser: PropTypes.string.isRequired,
    onChangeCurrentGenomeBrowser: PropTypes.func.isRequired,
    allOrderings: PropTypes.arrayOf(orderingPropTypes),
    currentOrdering: orderingPropTypes,
    onChangeCurrentOrdering: PropTypes.func.isRequired,
    allColumnLabels: PropTypes.arrayOf(PropTypes.string).isRequired,
    currentSelectedColumnLabels: PropTypes.arrayOf(PropTypes.string).isRequired,
    onChangeCurrentSelectedColumnLabels: PropTypes.func.isRequired,
    allNumCoexpressions: PropTypes.number.isRequired,
    currentNumCoexpressions: PropTypes.number.isRequired,
    onChangeCurrentNumCoexpressions: PropTypes.func.isRequired,
    currentZoom: PropTypes.bool.isRequired,
    onChangeCurrentZoom: PropTypes.func.isRequired,
    //and also props that aren't controls, in particular:
    heatmapConfig: heatmapConfigPropTypes.isRequired,
    heatmapData: heatmapDataPropTypes.isRequired,
    colourAxis: colourAxisPropTypes,    // Only available in experiment heatmap
    columnGroups: columnGroupsPropTypes,
}

const HeatmapWithControls = uncontrollable(_HeatmapWithControls,{
    currentGenomeBrowser: `onChangeCurrentGenomeBrowser`,
    currentOrdering: `onChangeCurrentOrdering`,
    currentSelectedColumnLabels:`onChangeCurrentSelectedColumnLabels`,
    currentNumCoexpressions:`onChangeCurrentNumCoexpressions`,
    currentZoom:`onChangeCurrentZoom`
})

const HeatmapWithControlsContainer = props => {
    const {heatmapData:{xAxisCategories,yAxisCategories}, orderings, heatmapConfig} = props
    const allColumnLabels = xAxisCategories.map((columnHeader)=> columnHeader.label)
    return (
        <HeatmapWithControls
            {...props}
            allGenomeBrowsers={heatmapConfig.genomeBrowsers}
            allOrderings={orderings}
            allColumnLabels={allColumnLabels}
            allNumCoexpressions={heatmapConfig.coexpressionsAvailable ? yAxisCategories.length - 1 :0}
            defaultCurrentGenomeBrowser={"none"}
            defaultCurrentOrdering={orderings[0]}
            defaultCurrentSelectedColumnLabels={allColumnLabels}
            defaultCurrentNumCoexpressions={0}
            defaultCurrentZoom={false}
        />
    )
}

HeatmapWithControlsContainer.propTypes = {
    onOntologyIdIsUnderFocus: PropTypes.func.isRequired,
    ontologyIdsToHighlight: PropTypes.arrayOf(PropTypes.string).isRequired,
    heatmapConfig: heatmapConfigPropTypes.isRequired,
    heatmapData: heatmapDataPropTypes.isRequired,
    orderings: PropTypes.arrayOf(orderingPropTypes)
}

class HeatmapWithControlsAndAnatomogram extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      highlightIds: [],
      highlightColumns: []
    }

    this._onOntologyIdIsUnderFocus = this._onOntologyIdIsUnderFocus.bind(this)
    this._onTissueIdIsUnderFocus = this._onTissueIdIsUnderFocus.bind(this)
    this._onTissueIdIsNotUnderFocus = this._onTissueIdIsNotUnderFocus.bind(this)
  }

  _onOntologyIdIsUnderFocus(id) {
    this.setState({
      highlightIds: id
    })
  }

  _onTissueIdIsUnderFocus(id) {
    this.setState({
      highlightColumns: [id]
    })
  }

  _onTissueIdIsNotUnderFocus() {
    this.setState({
      highlightColumns: []
    })
  }

  render() {
    return (
      <div className="row">
        {this.props.anatomogramConfig.show &&
        <div className="small-3 columns">
          <Anatomogram species={this.props.anatomogramConfig.anatomogramData.species}
                       showIds={this.props.anatomogramConfig.anatomogramData.allSvgPathIds}
                       highlightIds={this.state.highlightIds}
                       selectIds={[]}
                       onMouseOver={this._onTissueIdIsUnderFocus}
                       onMouseOut={this._onTissueIdIsNotUnderFocus}
          />
        </div>}

        <div className={this.props.anatomogramConfig.show ? `small-9 columns` : `small-12 columns`}>
          <HeatmapWithControlsContainer {...this.props}
                               onOntologyIdIsUnderFocus={this._onOntologyIdIsUnderFocus}
                               ontologyIdsToHighlight={this.state.highlightColumns} />
        </div>

      </div>
    )
  }
}

export default HeatmapWithControlsAndAnatomogram
