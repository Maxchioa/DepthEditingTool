import React, { useEffect, useState, Fragment } from "react";
import { connect } from "react-redux";
import { djangoActions } from "store/django";
import { toolExtActions } from "store/toolext";
import { imageActions } from "store/image";
import { selectors as toolExtSelectors } from "store/toolext";
import { selectors as imageSelectors } from "store/image";
import { Button, UncontrolledCollapse, CardBody, Card, FormGroup, Label, Input, UncontrolledTooltip } from "reactstrap";
import SidePaneStyle from "./style";
import Tools from "config/tools";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdDownload, MdDelete, MdContentCopy } from "react-icons/md";
import { AiOutlinePlus } from "react-icons/ai";
import { RiArrowUpDownLine } from "react-icons/ri";

import {
  addScaleShift,
  cloneCanvas,
  editHighlightPixelArea,
  getRgbBitmap,
  scaleSelection,
  getBoundingArea,
  canvasToImage,
  invertBitmap,
  downloadCanvas
} from "utils/canvasUtils";
import PointCurve from "components/PointCurve";
import { GroundBox, SelectionBox } from "config/toolBox";

export function SidePane({
  toolExtOpen,
  toolExtActions,
  mainDepthCanvas,
  memoryDepthCanvas,
  displayRgbCanvas,
  activeDepthTool,
  activeGroundTool,
  toolsParameters,
  parameters,
  groundParams,
  operationStack,
  selectTool,
  selectGroundTool,
  initImage,
  storeToolParameters,
  storeGroundParams,
  storeScribbleParams,
  addEffect,
  addLayer,
  updateLayerIndex,
  updateLayer,
  duplicateLayer,
  removeLayer,
  removeAllLayers,
  toggleLayerSelect,
  clear,
  getGround,
  setRectangle
}) {
  const [activeTool, setActiveTool] = useState(0);
  const [layers, setLayers] = useState(null);
  const [tempToolsParams, setTempToolsParams] = useState({
    disparity: 0,
    scale: 1,
    aConstant: 1,
    bConstant: 0
  });

  const toggleTool = index => {
    setActiveTool(index);
  };
  const onHandleChange = e => {
    let { name, value } = e.target;
    setTempToolsParams({ ...tempToolsParams, [name]: +value });
  };
  const onHandleUpdate = e => {
    let { name } = e.target;
    storeToolParameters({ [name]: tempToolsParams[name] });
  };
  const onHandleEnter = e => {
    let { name } = e.target;
    if (e.key === "Enter") {
      storeToolParameters({ [name]: tempToolsParams[name] });
    }
  };

  const onModifyBitmap = () => {
    if (memoryDepthCanvas) {
      if (!activeDepthTool || SelectionBox[activeDepthTool].type === "boundingBox") {
        const { croppedCanvasImage, croppedArea, histogramParams } = parameters;
        const { activeIndex, layerStack } = operationStack;
        if (activeIndex > 0) {
          let newArea = null;
          let newCroppedCanvasImage = null;
          if (croppedArea) {
            newArea = croppedArea;
            newCroppedCanvasImage = croppedCanvasImage;
          } else {
            newArea = getBoundingArea(memoryDepthCanvas);
            newCroppedCanvasImage = cloneCanvas(memoryDepthCanvas);
          }
          const newBitmapCanvas = SelectionBox[activeDepthTool || "singleSelection"].func(
            cloneCanvas(layerStack[activeIndex].bitmap),
            newCroppedCanvasImage,
            newArea,
            histogramParams.pixelRange
          );
          updateLayer({ index: activeIndex, value: { bitmap: newBitmapCanvas, toolsParameters: null } });
          initImage({
            rgbBitmapCanvas: getRgbBitmap(cloneCanvas(layerStack[activeIndex].bitmap), cloneCanvas(displayRgbCanvas))
          });
          clear();
        }
      }
    }
  };
  useEffect(() => {
    const { activeIndex } = operationStack;
    if (activeIndex === 0) {
      toggleTool(1);
    }
  }, [operationStack.activeIndex]);
  useEffect(() => {
    let tempLayer = operationStack.layerStack.map((element, key) => {
      let image = canvasToImage(element.bitmap);
      return (
        <Fragment key={key}>
          <div
            onClick={() => {
              updateLayerIndex(key);
            }}
            className={
              (!operationStack.isSelectActive && operationStack.activeIndex === key) ||
              (operationStack.isSelectActive && operationStack.selectedLayers.has(key))
                ? "my-2 layer-mode-body-content layer-mode-body-content-active"
                : "my-2 layer-mode-body-content"
            }
          >
            <Card className="layer-mode-body-content-image-card">
              <CardBody className="layer-mode-body-content-image">
                <img src={image} />
              </CardBody>
            </Card>
            {key !== 0 && !operationStack.isSelectActive ? (
              <div className="top-right-options">
                <div
                  onClick={e => {
                    e.stopPropagation();
                    let newBitmapCanvas = invertBitmap(
                      cloneCanvas(memoryDepthCanvas),
                      cloneCanvas(operationStack.layerStack[key].bitmap)
                    );
                    updateLayer({ index: key, value: { bitmap: newBitmapCanvas, toolsParameters: null } });
                  }}
                  className="top-right-option"
                >
                  <RiArrowUpDownLine />
                </div>
                <div
                  onClick={e => {
                    e.stopPropagation();
                    duplicateLayer(key);
                  }}
                  className="top-right-option"
                >
                  <MdContentCopy />
                </div>
                <div
                  onClick={e => {
                    e.stopPropagation();
                    downloadCanvas(operationStack.layerStack[key].bitmap, "bitmap.png");
                  }}
                  className="top-right-option"
                >
                  <MdDownload />
                </div>
                <div
                  onClick={e => {
                    e.stopPropagation();
                    removeLayer(key);
                  }}
                  className="top-right-option"
                >
                  <MdDelete />
                </div>
              </div>
            ) : null}
          </div>
          {key === 0 ? <hr style={{ borderTop: "1px solid #7e838e", width: "100%", marginBottom: "20px" }} /> : null}
        </Fragment>
      );
    });
    setLayers(tempLayer);
  }, [operationStack.layerStack, operationStack.isSelectActive]);
  useEffect(() => {
    const { activeIndex, layerStack } = operationStack;
    if (parameters.histogramParams.pixelRange && activeIndex > -1 && layerStack.length) {
      addEffect({
        name: "depthStack",
        value: {
          func: editHighlightPixelArea,
          params: [cloneCanvas(layerStack[activeIndex].bitmap), toolsParameters.disparity]
        }
      });
    }
  }, [toolsParameters.disparity]);
  useEffect(() => {
    const { activeIndex, layerStack } = operationStack;
    if (parameters.histogramParams.pixelRange && activeIndex > -1 && layerStack.length) {
      addEffect({
        name: "depthStack",
        value: {
          func: scaleSelection,
          params: [cloneCanvas(layerStack[activeIndex].bitmap), toolsParameters.scale]
        }
      });
    }
  }, [toolsParameters.scale]);
  useEffect(() => {
    const { activeIndex, layerStack } = operationStack;
    if (parameters.histogramParams.pixelRange && activeIndex > -1 && layerStack.length) {
      addEffect({
        name: "depthStack",
        value: {
          func: addScaleShift,
          params: [cloneCanvas(layerStack[activeIndex].bitmap), toolsParameters.aConstant, toolsParameters.bConstant]
        }
      });
    }
  }, [toolsParameters.aConstant, toolsParameters.bConstant]);
  const toolBox = () => {
    return (
      <>
        <div className="tool-ext w-100">
          <div className="tool-ext-selection">
            <div disabled={operationStack.activeIndex <= 0} className="tool-ext-selection-icons">
              {Object.keys(SelectionBox).map((key, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (memoryDepthCanvas) {
                      selectTool(key);
                    }
                  }}
                  id={`tool-tooltip-${index}`}
                  className={
                    activeDepthTool === key && memoryDepthCanvas
                      ? "selection-tool selection-tool-active"
                      : "selection-tool"
                  }
                >
                  {SelectionBox[key].icon}
                  <UncontrolledTooltip placement="bottom" target={`tool-tooltip-${index}`}>
                    {SelectionBox[key].tooltip}
                  </UncontrolledTooltip>
                </div>
              ))}
            </div>
            <div className="d-flex my-2">
              <Button
                disabled={
                  (activeDepthTool && SelectionBox[activeDepthTool].type !== "boundingBox") || activeGroundTool !== null
                }
                size="sm"
                className="mx-2"
                color="secondary"
                onClick={() => {
                  onModifyBitmap();
                }}
              >
                {activeDepthTool === "singleSelection" || activeDepthTool === "addSelection"
                  ? "Add"
                  : activeDepthTool === "subtractSelection"
                  ? "Subtract"
                  : activeDepthTool === "intersectSelection"
                  ? "Intersect"
                  : "Select"}
              </Button>
              <Button
                disabled={activeDepthTool && SelectionBox[activeDepthTool].type !== "boundingBox"}
                size="sm"
                className="mx-2"
                color="secondary"
                onClick={() => {}}
              >
                Clear
              </Button>
            </div>
            <p className="tool-ext-selection-title">Ground Selection</p>
            <div disabled={operationStack.activeIndex <= 0} className="tool-ext-selection-icons">
              {Object.keys(GroundBox).map((key, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (memoryDepthCanvas) {
                      selectGroundTool(key);
                    }
                  }}
                  id={`ground-tooltip-${index}`}
                  className={
                    activeGroundTool === key && memoryDepthCanvas
                      ? "selection-tool selection-tool-active"
                      : "selection-tool"
                  }
                >
                  {GroundBox[key].icon}
                  <UncontrolledTooltip placement="bottom" target={`ground-tooltip-${index}`}>
                    {GroundBox[key].tooltip}
                  </UncontrolledTooltip>
                </div>
              ))}
            </div>
            <div className="d-flex my-2">
              <Button
                disabled={!memoryDepthCanvas || activeDepthTool !== null} // should also be disabled if no ground params
                size="sm"
                className="mx-2"
                color="secondary"
                onClick={() => {
                  let rectangle = groundParams["rectangle"];
                  let points = groundParams["path"];
                  let formData = new FormData();
                  formData.append("image", canvasToImage(memoryDepthCanvas));
                  formData.append("rectangle", JSON.stringify(rectangle));
                  formData.append("points", JSON.stringify(points));
                  formData.append("z_length", 250);
                  formData.append("threshold", 1);
                  storeGroundParams({ rectangle: null, path: null });
                  storeScribbleParams({
                    pos: { x: 0, y: 0 },
                    offset: {},
                    path: []
                  });
                  setRectangle(rectangle);
                  getGround(formData);
                }}
              >
                Estimate Ground
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  };
  const adjust = () => {
    return (
      <>
        <div className="tool-ext w-100">
          <div className="w-100 mt-3 tool-ext-section">
            <p className="mb-1">Depth Selection</p>
            <Button className="mt-4 mb-2 dropdown-button" size="sm" color="secondary" id="depth-adjust-toggler">
              Adjust Selection
            </Button>
            <UncontrolledCollapse style={{ width: "100%" }} toggler="#depth-adjust-toggler">
              <Card className="tool-ext-card">
                <CardBody className="tool-ext-card-body">
                  <FormGroup className="w-100">
                    <Label for="disparity">Depth Intensity</Label>
                    <div className="tool-ext-input d-flex justify-content-between w-100">
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseUp={onHandleUpdate}
                        className="tool-ext-input-slider"
                        id="disparity"
                        name="disparity"
                        min="-1"
                        max="1"
                        step={0.01}
                        type="range"
                        value={tempToolsParams.disparity}
                      />
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseLeave={onHandleUpdate}
                        onKeyDown={onHandleEnter}
                        bsSize="sm"
                        className="tool-ext-input-number"
                        id="disparity"
                        name="disparity"
                        type="number"
                        min="-1"
                        max="1"
                        step={0.01}
                        value={tempToolsParams.disparity}
                      />
                    </div>
                  </FormGroup>
                  <FormGroup className="w-100">
                    <Label for="scale">Depth Detail</Label>
                    <div className="tool-ext-input d-flex justify-content-between w-100">
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseUp={onHandleUpdate}
                        className="tool-ext-input-slider"
                        id="scale"
                        name="scale"
                        min="0"
                        max="1"
                        step={0.01}
                        type="range"
                        value={tempToolsParams.scale}
                      />
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseLeave={onHandleUpdate}
                        onKeyDown={onHandleEnter}
                        bsSize="sm"
                        className="tool-ext-input-number"
                        id="scale"
                        name="scale"
                        type="number"
                        min="0"
                        max="1"
                        step={0.01}
                        value={tempToolsParams.scale}
                      />
                    </div>
                  </FormGroup>
                </CardBody>
              </Card>
            </UncontrolledCollapse>
          </div>
          <div className="w-100 mt-3 tool-ext-section">
            <p className="mb-1">Non-linearity</p>
            <Button className="mt-3 mb-3 dropdown-button" size="sm" color="secondary" id="depth-rotate-toggler">
              Point Curve
            </Button>
            <UncontrolledCollapse toggler="#depth-rotate-toggler">
              <Card className="tool-ext-card">
                <CardBody className="tool-ext-card-body">
                  <PointCurve
                    pointCurveProps={{
                      disabled: !memoryDepthCanvas || !parameters.histogramParams.pixelRange
                    }}
                  />
                  <FormGroup className="w-100">
                    <Label for="aConstant">A</Label>
                    <div className="tool-ext-input d-flex justify-content-between w-100">
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseUp={onHandleUpdate}
                        className="tool-ext-input-slider"
                        id="aConstant"
                        name="aConstant"
                        min="0"
                        max="2"
                        step={0.01}
                        type="range"
                        value={tempToolsParams.aConstant}
                      />
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseLeave={onHandleUpdate}
                        onKeyDown={onHandleEnter}
                        bsSize="sm"
                        className="tool-ext-input-number"
                        id="aConstant"
                        name="aConstant"
                        type="number"
                        min="0"
                        max="2"
                        step={0.01}
                        value={tempToolsParams.aConstant}
                      />
                    </div>
                  </FormGroup>
                  <FormGroup className="w-100">
                    <Label for="bConstant">B</Label>
                    <div className="tool-ext-input d-flex justify-content-between w-100">
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseUp={onHandleUpdate}
                        className="tool-ext-input-slider"
                        id="bConstant"
                        name="bConstant"
                        min="0"
                        max="2"
                        step={0.01}
                        type="range"
                        value={tempToolsParams.bConstant}
                      />
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseLeave={onHandleUpdate}
                        onKeyDown={onHandleEnter}
                        bsSize="sm"
                        className="tool-ext-input-number"
                        id="bConstant"
                        name="bConstant"
                        type="number"
                        min="0"
                        max="2"
                        step={0.01}
                        value={tempToolsParams.bConstant}
                      />
                    </div>
                  </FormGroup>
                </CardBody>
              </Card>
            </UncontrolledCollapse>
          </div>
        </div>
      </>
    );
  };
  return (
    <SidePaneStyle>
      <div className="layer-mode-pane">
        <div className="layer-mode-header">
          <div className="layer-mode-header-title">
            <p>Selection Pane</p>
          </div>
        </div>
        <div className="layer-mode-body">
          {layers || null}
          {/* if later stack is empty, disable this */}
          <div
            disabled={mainDepthCanvas === null || operationStack.isSelectActive}
            className="my-2 layer-mode-body-add"
          >
            <Card className="layer-mode-body-add-card" onClick={addLayer}>
              <AiOutlinePlus />
            </Card>
          </div>
        </div>
        <div
          disabled={mainDepthCanvas === null || operationStack.layerStack.length <= 1}
          className="layer-mode-footer text-center"
        >
          <div className="layer-mode-apply-button mx-2">
            <Button size="sm" color="secondary" onClick={toggleLayerSelect}>
              {operationStack.isSelectActive ? `Cancel (${operationStack.selectedLayers.size})` : "Select"}
            </Button>
          </div>
          <div className="layer-mode-apply-button mx-2">
            <Button size="sm" color="secondary" onClick={removeAllLayers}>
              Remove all
            </Button>
          </div>
        </div>
      </div>

      <div
        disabled={operationStack.isSelectActive}
        className={toolExtOpen ? "tools-ext tool-ext-active" : "tools-ext tool-ext-inactive"}
      >
        <div className="tools-ext-header">
          {Tools.map((tool, key) => (
            <div
              key={key}
              onClick={() => {
                toggleTool(key);
              }}
              disabled={key === 0 && operationStack.activeIndex === 0}
              className={key === activeTool ? "active tool" : "tool"}
            >
              {tool.icon}
              <span>{tool.name}</span>
            </div>
          ))}
        </div>
        <div className="tools-ext-body">
          <div className="tools-ext-elements">
            {activeTool === 0 && operationStack.activeIndex !== 0 ? toolBox() : activeTool === 1 ? adjust() : null}
            <Button onClick={toolExtActions} className="toggle-button">
              {toolExtOpen ? <MdKeyboardArrowLeft /> : <MdKeyboardArrowRight />}
            </Button>
          </div>
        </div>
      </div>
    </SidePaneStyle>
  );
}

const mapStateToProps = state => ({
  toolExtOpen: toolExtSelectors.toolExtOpen(state),
  mainDepthCanvas: imageSelectors.mainDepthCanvas(state),
  displayRgbCanvas: imageSelectors.displayRgbCanvas(state),
  memoryDepthCanvas: imageSelectors.memoryDepthCanvas(state),
  rgbBitmapCanvas: imageSelectors.rgbBitmapCanvas(state),
  activeDepthTool: imageSelectors.activeDepthTool(state),
  activeGroundTool: imageSelectors.activeGroundTool(state),
  toolsParameters: imageSelectors.toolsParameters(state),
  parameters: imageSelectors.parameters(state),
  groundParams: imageSelectors.groundParams(state),
  operationStack: imageSelectors.operationStack(state)
});

const mapDispatchToProps = {
  getGround: djangoActions.getGround,
  setRectangle: djangoActions.setRectangle,
  toolExtActions: toolExtActions.toggleToolExt,
  initImage: imageActions.initImage,
  selectTool: imageActions.selectTool,
  selectGroundTool: imageActions.selectGroundTool,
  addEffect: imageActions.addEffect,
  removeOperation: imageActions.removeOperation,
  storeParameters: imageActions.storeParameters,
  storeGroundParams: imageActions.storeGroundParams,
  storeScribbleParams: imageActions.storeScribbleParams,
  addLayer: imageActions.addLayer,
  updateLayerIndex: imageActions.updateLayerIndex,
  updateLayer: imageActions.updateLayer,
  duplicateLayer: imageActions.duplicateLayer,
  removeLayer: imageActions.removeLayer,
  removeAllLayers: imageActions.removeAllLayers,
  toggleLayerSelect: imageActions.toggleLayerSelect,
  storeToolParameters: imageActions.storeToolParameters,
  clear: imageActions.clear
};

export default connect(mapStateToProps, mapDispatchToProps)(SidePane);
