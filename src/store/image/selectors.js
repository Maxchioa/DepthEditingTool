export const selectors = {
  pointerList: state => state.image.pointerList,
  rgbImageUrl: state => state.image.rgbImageUrl,
  depthImageUrl: state => state.image.depthImageUrl,
  selectionImageUrl: state => state.image.selectionImageUrl,
  maskImageUrl: state => state.image.maskImageUrl,
  depthImageSize: state => state.image.depthImageSize,
  mainRgbCanvas: state => state.image.mainRgbCanvas,
  mainDepthCanvas: state => state.image.mainDepthCanvas,
  memoryRgbCanvas: state => state.image.memoryRgbCanvas,
  memoryDepthCanvas: state => state.image.memoryDepthCanvas,
  cacheDepthCanvas: state => state.image.cacheDepthCanvas,
  isEffectNew: state => state.image.isEffectNew,
  prevRgbSize: state => state.image.prevRgbSize,
  prevDepthSize: state => state.image.prevDepthSize,
  scribbleParams: state => state.image.scribbleParams,
  boxParams: state => state.image.boxParams,
  rgbScaleParams: state => state.image.rgbScaleParams,
  depthScaleParams: state => state.image.depthScaleParams,
  isPanActive: state => state.image.isPanActive,
  activeDepthTool: state => state.image.activeDepthTool,
  toolsParameters: state => state.image.toolsParameters,
  parameters: state => state.image.parameters,
  operationStack: state => state.image.operationStack
};
