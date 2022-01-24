import styled from "styled-components";

const MainPaneStyle = styled.div`
  height: 100%;
  width: calc(100% - 272px);
  .main {
    background: #f0f1f2;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 10px;
    .main-row {
      height: 100%;
      width: 100%;
      display: flex;
      justify-content: space-between;
      .main-column {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin: 10px;
        .box {
          background-color: #d9dadd;
          margin: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow-y: hidden;
          overflow-x: hidden;
        }
        .rgb-box {
          height: 50%;
          width: 100%;
        }
        .depth-box {
          height: 50%;
          width: 100%;
        }
        .threeD-box {
          height: 50%;
          width: 100%;
        }
        .histogram-box {
          height: 50%;
          width: 100%;
        }
      }
      .main-column-2d {
        width: 50%;
      }
      .main-column-3d {
        width: 50%;
      }
    }
  }
  .main-expand {
    margin-left: 0;
    transition: all 0.5s;
    -webkit-transition: all 0.5s;
  }
  .main-shrink {
    margin-left: 300px;
    transition: all 0.5s;
    -webkit-transition: all 0.5s;
  }
`;

export default MainPaneStyle;
