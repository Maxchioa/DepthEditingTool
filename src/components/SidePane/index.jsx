import React, { useEffect, useState, Fragment } from "react";
import { connect } from "react-redux";
import { toolExtActions } from "store/toolext";
import { imageActions } from "store/image";
import { selectors as toolExtSelectors } from "store/toolext";
import { selectors as imageSelectors } from "store/image";
import { Button, UncontrolledCollapse, CardBody, Card, FormGroup, Label, Input } from "reactstrap";
import SidePaneStyle from "./style";
import Tools from "config/tools";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdCancel } from "react-icons/md";
import { AiOutlineClose, AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";

import {
  addScaleShift,
  cloneCanvas,
  editBrightness,
  editContrast,
  editHighlightPixelArea,
  getRgbBitmap,
  scaleSelection,
  getBoundingArea,
  canvasToImage
} from "utils/canvasUtils";
import PointCurve from "components/PointCurve";
import ToolBox from "config/toolBox";

export function SidePane({
  toolExtOpen,
  toolExtActions,
  mainDepthCanvas,
  memoryDepthCanvas,
  displayRgbCanvas,
  depthBitmapCanvas,
  tools,
  toolsParameters,
  parameters,
  operationStack,
  selectTool,
  initImage,
  storeToolParameters,
  storeParameters,
  addEffect,
  addLayer,
  updateLayerIndex,
  updateLayer,
  removeLayer,
  removeAllLayers
}) {
  const [activeTool, setActiveTool] = useState(0);
  const [layers, setLayers] = useState(null);
  const [tempToolsParams, setTempToolsParams] = useState({
    disparity: 0,
    scale: 1,
    brightness: 0,
    contrast: 0,
    sharpness: 0,
    aConstant: 0,
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
      if (ToolBox[tools.currentTool].type === "boundingBox") {
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
          const newBitmapCanvas = ToolBox[tools.currentTool].func(
            cloneCanvas(layerStack[activeIndex].bitmap),
            newCroppedCanvasImage,
            newArea,
            histogramParams.pixelRange
          );
          updateLayer({ index: activeIndex, value: { bitmap: newBitmapCanvas, toolsParameters: null } });
          initImage({
            rgbBitmapCanvas: getRgbBitmap(cloneCanvas(layerStack[activeIndex].bitmap), cloneCanvas(displayRgbCanvas))
          });
          storeParameters({
            croppedCanvasImage: null,
            croppedArea: null,
            histogramParams: {
              pixelRange: [0, 255],
              domain: [0, 255],
              values: [0, 255],
              update: [0, 255]
            }
          });
        }
      }
    }
  };
  useEffect(() => {
    const { activeIndex, layerStack } = operationStack;
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
              operationStack.activeIndex === key
                ? "my-2 layer-mode-body-content layer-mode-body-content-active"
                : "my-2 layer-mode-body-content"
            }
          >
            <Card className="layer-mode-body-content-image-card">
              <CardBody className="layer-mode-body-content-image">
                <img src={image} />
              </CardBody>
            </Card>
            {key !== 0 ? (
              <div
                onClick={e => {
                  e.stopPropagation();
                  removeLayer(key);
                }}
                className="remove-layer"
              >
                <MdCancel />
              </div>
            ) : null}
          </div>
          {key === 0 ? <hr style={{ borderTop: "1px solid #7e838e", width: "100%", marginBottom: "20px" }} /> : null}
        </Fragment>
      );
    });
    setLayers(tempLayer);
  }, [operationStack.layerStack]);
  useEffect(() => {
    const { activeIndex, layerStack } = operationStack;
    if (parameters.histogramParams.pixelRange && activeIndex > -1) {
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
    if (parameters.histogramParams.pixelRange && activeIndex > -1) {
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
    if (memoryDepthCanvas) {
      const { croppedArea } = parameters;
      let newArea = null;
      if (croppedArea) {
        newArea = croppedArea;
      } else {
        newArea = getBoundingArea(memoryDepthCanvas);
      }
      addEffect({
        name: "depthStack",
        value: {
          func: editBrightness,
          params: [newArea, toolsParameters.brightness]
        }
      });
    }
  }, [toolsParameters.brightness]);
  useEffect(() => {
    if (memoryDepthCanvas) {
      const { croppedArea } = parameters;
      let newArea = null;
      if (croppedArea) {
        newArea = croppedArea;
      } else {
        newArea = getBoundingArea(memoryDepthCanvas);
      }
      addEffect({
        name: "depthStack",
        value: {
          func: editContrast,
          params: [newArea, toolsParameters.contrast]
        }
      });
    }
  }, [toolsParameters.contrast]);
  useEffect(() => {
    if (memoryDepthCanvas) {
      const { croppedArea } = parameters;
      let newArea = null;
      if (croppedArea) {
        newArea = croppedArea;
      } else {
        newArea = getBoundingArea(memoryDepthCanvas);
      }
      addEffect({
        name: "depthStack",
        value: {
          func: addScaleShift,
          params: [newArea, toolsParameters.aConstant, toolsParameters.bConstant]
        }
      });
    }
  }, [toolsParameters.aConstant, toolsParameters.bConstant]);
  const toolBox = () => {
    return (
      <>
        <div className="tool-ext w-100">
          <div className="tool-ext-selection">
            <div className="tool-ext-selection-icons">
              {Object.keys(ToolBox).map((key, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (memoryDepthCanvas) {
                      selectTool(key);
                    }
                  }}
                  className={
                    tools[key] && memoryDepthCanvas ? "selection-tool selection-tool-active" : "selection-tool"
                  }
                >
                  {ToolBox[key].icon}
                </div>
              ))}
            </div>
            <div className="d-flex">
              <Button
                disabled={!tools.currentTool || ToolBox[tools.currentTool].type !== "boundingBox"}
                size="sm"
                className="mx-2"
                color="secondary"
                onClick={onModifyBitmap}
              >
                {tools.singleSelection || tools.addSelection
                  ? "Add"
                  : tools.subtractSelection
                  ? "Subtract"
                  : tools.intersectSelection
                  ? "Intersect"
                  : "Select"}
              </Button>
              <Button
                disabled={!tools.currentTool || ToolBox[tools.currentTool].type !== "boundingBox"}
                size="sm"
                className="mx-2"
                color="secondary"
                onClick={() => {
                  const bitmapContext = depthBitmapCanvas.getContext("2d");
                  bitmapContext.clearRect(0, 0, depthBitmapCanvas.width, depthBitmapCanvas.height);
                  setBitmapImage(canvasToImage(depthBitmapCanvas));
                }}
              >
                Clear
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
                        min="-100"
                        max="100"
                        type="range"
                        value={tempToolsParams.disparity}
                      />
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseLeave={onHandleUpdate}
                        onKeyDown={onHandleEnter}
                        size="sm"
                        className="tool-ext-input-number"
                        id="disparity"
                        name="disparity"
                        type="number"
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
                        size="sm"
                        className="tool-ext-input-number"
                        id="scale"
                        name="scale"
                        type="number"
                        value={tempToolsParams.scale}
                      />
                    </div>
                  </FormGroup>
                </CardBody>
              </Card>
            </UncontrolledCollapse>
          </div>
          <div className="w-100 mt-3 tool-ext-section">
            <p className="mb-1">Brightness &#38; Color</p>
            <Button className="mt-4 mb-2 dropdown-button" size="sm" color="secondary" id="basic-adjust-toggler">
              Basic Adjust
            </Button>
            <UncontrolledCollapse style={{ width: "100%" }} toggler="#basic-adjust-toggler">
              <Card className="tool-ext-card">
                <CardBody className="tool-ext-card-body">
                  <FormGroup className="w-100">
                    <Label for="brightness">Brightness</Label>
                    <div className="tool-ext-input d-flex justify-content-between w-100">
                      <Input
                        disabled={!memoryDepthCanvas}
                        onChange={onHandleChange}
                        onMouseUp={onHandleUpdate}
                        className="tool-ext-input-slider"
                        id="brightness"
                        name="brightness"
                        min="-100"
                        max="100"
                        type="range"
                        value={tempToolsParams.brightness}
                      />
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseLeave={onHandleUpdate}
                        onKeyDown={onHandleEnter}
                        size="sm"
                        className="tool-ext-input-number"
                        id="brightness"
                        name="brightness"
                        type="number"
                        value={tempToolsParams.brightness}
                      />
                    </div>
                  </FormGroup>
                  <FormGroup className="w-100">
                    <Label for="contrast">Contrast</Label>
                    <div className="tool-ext-input d-flex justify-content-between w-100">
                      <Input
                        disabled={!memoryDepthCanvas}
                        onChange={onHandleChange}
                        onMouseUp={onHandleUpdate}
                        className="tool-ext-input-slider"
                        id="contrast"
                        name="contrast"
                        min="0"
                        max="100"
                        type="range"
                        value={tempToolsParams.contrast}
                      />
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseLeave={onHandleUpdate}
                        onKeyDown={onHandleEnter}
                        size="sm"
                        className="tool-ext-input-number"
                        id="contrast"
                        name="contrast"
                        type="number"
                        value={tempToolsParams.contrast}
                      />
                    </div>
                  </FormGroup>
                  <FormGroup className="w-100">
                    <Label for="sharpness">Sharpness</Label>
                    <div className="tool-ext-input d-flex justify-content-between w-100">
                      <Input
                        disabled={!memoryDepthCanvas}
                        onChange={onHandleChange}
                        onMouseUp={onHandleUpdate}
                        className="tool-ext-input-slider"
                        id="sharpness"
                        name="sharpness"
                        min="-100"
                        max="100"
                        type="range"
                        value={tempToolsParams.sharpness}
                      />
                      <Input
                        disabled={!memoryDepthCanvas || !parameters.histogramParams.pixelRange}
                        onChange={onHandleChange}
                        onMouseLeave={onHandleUpdate}
                        onKeyDown={onHandleEnter}
                        size="sm"
                        className="tool-ext-input-number"
                        id="sharpness"
                        name="sharpness"
                        type="number"
                        value={tempToolsParams.sharpness}
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
                  <PointCurve />
                  <FormGroup className="w-100">
                    <Label for="aConstant">A</Label>
                    <div className="tool-ext-input d-flex justify-content-between w-100">
                      <Input
                        disabled={!memoryDepthCanvas}
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
                        size="sm"
                        className="tool-ext-input-number"
                        id="aConstant"
                        name="aConstant"
                        type="number"
                        value={tempToolsParams.aConstant}
                      />
                    </div>
                  </FormGroup>
                  <FormGroup className="w-100">
                    <Label for="bConstant">B</Label>
                    <div className="tool-ext-input d-flex justify-content-between w-100">
                      <Input
                        disabled={!memoryDepthCanvas}
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
                        size="sm"
                        className="tool-ext-input-number"
                        id="bConstant"
                        name="bConstant"
                        type="number"
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
  const effect = () => {
    return (
      <>
        <div className="tool-ext mt-4 w-100">
          <div className="w-100 mt-3 tool-ext-section"></div>
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
          <div disabled={mainDepthCanvas === null} className="my-2 layer-mode-body-add">
            <Card className="layer-mode-body-add-card" onClick={addLayer}>
              <AiOutlinePlus />
            </Card>
          </div>
        </div>
        <div className="layer-mode-footer text-center">
          <div className="layer-mode-apply-button mx-2">
            <Button size="sm" color="secondary" onClick={addLayer}>
              Add
            </Button>
          </div>
          <div className="layer-mode-apply-button mx-2">
            <Button size="sm" color="secondary" onClick={removeAllLayers}>
              Remove all
            </Button>
          </div>
        </div>
      </div>

      <div className={toolExtOpen ? "tools-ext tool-ext-active" : "tools-ext tool-ext-inactive"}>
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
            {activeTool === 0 && operationStack.activeIndex !== 0
              ? toolBox()
              : activeTool === 1
              ? adjust()
              : activeTool === 2
              ? effect()
              : null}
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
  depthBitmapCanvas: imageSelectors.depthBitmapCanvas(state),
  layerMode: imageSelectors.layerMode(state),
  tools: imageSelectors.tools(state),
  toolsParameters: imageSelectors.toolsParameters(state),
  parameters: imageSelectors.parameters(state),
  operationStack: imageSelectors.operationStack(state)
});

const mapDispatchToProps = {
  toolExtActions: toolExtActions.toggleToolExt,
  initImage: imageActions.initImage,
  selectTool: imageActions.selectTool,
  addEffect: imageActions.addEffect,
  removeOperation: imageActions.removeOperation,
  storeParameters: imageActions.storeParameters,
  toggleLayerMode: imageActions.toggleLayerMode,
  addLayer: imageActions.addLayer,
  updateLayerIndex: imageActions.updateLayerIndex,
  updateLayer: imageActions.updateLayer,
  removeLayer: imageActions.removeLayer,
  removeAllLayers: imageActions.removeAllLayers,
  storeToolParameters: imageActions.storeToolParameters
};

export default connect(mapStateToProps, mapDispatchToProps)(SidePane);
