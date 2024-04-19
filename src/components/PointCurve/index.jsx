import React, { Component, createRef } from "react";
import { connect } from "react-redux";
import { selectors as imageSelectors } from "../../store/image";

class DirectionSelector extends Component {
  constructor() {
    super();
    this.directionRef = createRef();
  }
  state = {
    selectedDirection: null, // Stores the currently selected direction
    polygonPoints: []
  };

  drawDirections = () => {
    const canvas = this.directionRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px Arial";
    // Main Directions
    ctx.fillText("↑", canvas.width / 2 - 15, 50); // Up
    ctx.fillText("↓", canvas.width / 2 - 15, canvas.height - 20); // Down
    ctx.fillText("←", 30, canvas.height / 2 + 15); // Left
    ctx.fillText("→", canvas.width - 80, canvas.height / 2 + 15); // Right
    // Diagonal Directions
    ctx.fillText("↖", 30, 70); // Top-left
    ctx.fillText("↗", canvas.width - 80, 70); // Top-right
    ctx.fillText("↙", 30, canvas.height - 20); // Bottom-left
    ctx.fillText("↘", canvas.width - 80, canvas.height - 20); // Bottom-right
  };

  componentDidMount() {
    this.drawDirections();
  }

  selectDirection = e => {
    const rect = this.directionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = this.directionRef.current.width;
    const height = this.directionRef.current.height;
    const position = { x, y }; // Create an object to store the click position

    // Using some margins for simplicity in direction detection
    const margin = width * 0.1;

    if (x < margin && y < margin) {
      this.setState({ selectedDirection: "TOP-LEFT" });
    } else if (x > width - margin && y < margin) {
      this.setState({ selectedDirection: "TOP-RIGHT" });
    } else if (x < margin && y > height - margin) {
      this.setState({ selectedDirection: "BOTTOM-LEFT" });
    } else if (x > width - margin && y > height - margin) {
      this.setState({ selectedDirection: "BOTTOM-RIGHT" });
    } else if (x > width * 0.3 && x < width * 0.7 && y < height * 0.3) {
      this.setState({ selectedDirection: "UP" });
    } else if (x > width * 0.3 && x < width * 0.7 && y > height * 0.7) {
      this.setState({ selectedDirection: "DOWN" });
    } else if (y > height * 0.3 && y < height * 0.7 && x < width * 0.3) {
      this.setState({ selectedDirection: "LEFT" });
    } else if (y > height * 0.3 && y < height * 0.7 && x > width * 0.7) {
      this.setState({ selectedDirection: "RIGHT" });
    }
  };

  sendDataToBackend = () => {
    const { selectedDirection, polygonPoints } = this.state;
    const canvas = this.directionRef.current; // 获取正确的canvas引用
    const { pointerList, canvasSize } = this.props; // Access pointerList from props
    console.log(selectedDirection, pointerList, canvasSize);
    if (!selectedDirection) {
      alert("choose a direction");
      return;
    }
    fetch("http://127.0.0.1:5000/update_normal_map", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        direction: selectedDirection,
        pointerList: pointerList,
        canvasSize: canvasSize
      })
    })
      .then(response => response.json())
      .then(data => {
        console.log("successed:", data);
      })
      .catch(error => {
        console.error("failed:", error);
      });
  };

  render() {
    return (
      <div>
        <canvas ref={this.directionRef} width="250" height="250" onClick={this.selectDirection} />
        {this.state.selectedDirection && (
          <div>
            <p>Selected Direction: {this.state.selectedDirection}</p>
            <button onClick={this.sendDataToBackend}>Send Direction</button>
          </div>
        )}
      </div>
    );
  }
}
const mapStateToProps = state => ({
  pointerList: imageSelectors.pointerList(state), // Assuming the existence of this selector
  canvasSize: imageSelectors.canvasSize(state)
});

export default connect(mapStateToProps)(DirectionSelector);
