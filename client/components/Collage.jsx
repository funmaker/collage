import React from 'react';
import { Dimmer, Icon, Loader, Visibility } from "semantic-ui-react";

export default class Collage extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      zoom: 1,
      posx: 0,
      posy: 0,
      canvasWidth: 100,
      canvasHeight: 100,
      drag: null,
      dragSize: { x: null, y: null },
      loading: false,
    };
    
    this.handleUpdate = this.handleUpdate.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onDelete = this.onDelete.bind(this);
  }
  
  handleUpdate(e, { calculations }) {
    this.setState({
      canvasWidth: calculations.width,
      canvasHeight: calculations.height,
    });
  }
  
  onWheel(e) {
    e.preventDefault();
    
    const { posx, posy, canvasWidth, canvasHeight, zoom } = this.state;
    
    console.log(e.deltaX || e.deltaY || e.deltaZ);
    
    let newZoom = zoom * (1 - Math.sign(e.deltaX || e.deltaY || e.deltaZ) / 5);
    if(newZoom < 0.01) newZoom = 0.01;
    if(newZoom > 10) newZoom = 10;
    
    this.setState({
      zoom: newZoom,
      posx: (posx - (e.clientX / canvasWidth  - 0.5)) / zoom * newZoom + (e.clientX / canvasWidth  - 0.5),
      posy: (posy - (e.clientY / canvasHeight - 0.5)) / zoom * newZoom + (e.clientY / canvasHeight - 0.5),
    });
  }
  
  onMouseMove(e) {
    if((e.buttons & 1) === 0) return;
    if(e.target.tagName === "IMG") return;
    
    const { posx, posy, canvasWidth, canvasHeight } = this.state;
    
    this.setState({
      posx: posx + e.nativeEvent.movementX / canvasWidth,
      posy: posy + e.nativeEvent.movementY / canvasHeight,
    });
  }
  
  onDragStart(e, img) {
    e.nativeEvent.dataTransfer.setData("text", img.id);
    const canvas = document.createElement("canvas");
    canvas.width = this.props.collage.img_width / this.props.collage.img_height * 100 * img.columns * this.calculateZoom(this.state.zoom);
    canvas.height = 100 * img.rows * this.calculateZoom(this.state.zoom);
    canvas.getContext("2d").drawImage(e.target, 0, 0, canvas.width, canvas.height);
    e.nativeEvent.dataTransfer.setDragImage(canvas, canvas.width / 2 / img.columns, canvas.height / 2 / img.rows);
    this.setState({
      dragSize: { x: img.columns, y: img.rows },
    });
  }
  
  async onDrop(e, targetX, targetY) {
    e.stopPropagation();
    
    const dropImage = this.props.images.find(el => el.id === parseInt(e.nativeEvent.dataTransfer.getData("text")));
    
    if(targetX === dropImage.posx && targetY === dropImage.posy) return;
    
    this.setState({
      loading: true,
    });
    
    if(targetX !== null && targetY !== null) {
      if(targetX + dropImage.columns > this.props.collage.columns || targetY + dropImage.rows > this.props.collage.rows) {
        this.setState({
          drag: null,
          loading: false,
        });
        return;
      }
      
      for(const image of this.props.images) {
        if(image.posx !== null && image.posy !== null
                    && image.posx < targetX + dropImage.columns
                    && image.posx + image.columns > targetX
                    && image.posy < targetY + dropImage.rows
                    && image.posy + image.rows > targetY) {
          await this.props.moveImage(image.id, null, null);
        }
      }
    }
    
    await this.props.moveImage(dropImage.id, targetX, targetY);
    
    this.setState({
      drag: null,
      loading: false,
    });
  }
  
  async onDelete(e) {
    e.stopPropagation();
    
    const dropImage = this.props.images.find(el => el.id === parseInt(e.nativeEvent.dataTransfer.getData("text")));
    
    this.setState({
      loading: true,
    });
    
    await this.props.removeImage(dropImage.id);
    
    this.setState({
      drag: null,
      loading: false,
    });
  }
  
  calculateZoom(zoom) {
    const { collage } = this.props;
    const { canvasWidth, canvasHeight } = this.state;
    
    return Math.min(canvasWidth * 0.9 / (collage.img_width / collage.img_height * 100) / collage.columns, canvasHeight * 0.9 / 100 / collage.rows) * zoom;
  }
  
  render() {
    const { collage, images } = this.props;
    const { zoom, posx, posy, canvasWidth, canvasHeight } = this.state;
    
    if(!collage) {
      return <div className="Collage" />;
    }
    
    const cssZoom = this.calculateZoom(zoom);
    
    const wrapStyle = {
      transform: `translate(${(posx + 0.5) * canvasWidth + "px"}, ${(posy + 0.5) * canvasHeight + "px"}) translate(-50%, -50%) scale(${cssZoom})`,
    };
    
    const cellStyle = {
      width: collage.img_width / collage.img_height * 100 + "px",
      height: 100 + "px",
    };
    
    const rows = [];
    
    for(let r = 0; r < collage.rows; r++) {
      const cells = [];
      for(let c = 0; c < collage.columns; c++) {
        const { drag, dragSize } = this.state;
        const hover = drag && c >= drag.c && c < drag.c + dragSize.x && r >= drag.r && r < drag.r + dragSize.y;
        cells.push(
          <div className={"cell " + (hover ? "dragHover" : "")}
               key={c}
               style={cellStyle}
               onDragEnter={e => { e.stopPropagation(); this.setState({ drag: { r, c } }); }}
               onDragOver={e => { e.stopPropagation(); e.preventDefault(); }}
               onDragExit={e => { e.stopPropagation(); this.setState({ drag: null }); }}
               onDrop={e => this.onDrop(e, c, r)} />,
        );
      }
      rows.push(<div className="row" key={r}>{cells}</div>);
    }
    
    const generateImg = img => (
      <img className="collageImage"
           key={img.id}
           src={img.data}
           height={img.rows * 100}
           draggable
           onDragStart={e => this.onDragStart(e, img)}
           onDragEnd={() => this.setState({ drag: null })}
           style={img.posx !== null ? {
                     left: img.posx * collage.img_width / collage.img_height * 100 + "px",
                     top: img.posy * 100 + "px",
                 } : undefined} />
    );
    
    const collageImages = images.filter(img => img.posx !== null && img.posy !== null).map(generateImg);
    const extraImages = images.filter(img => img.posx === null || img.posy === null).map(generateImg);
    
    return (
      <Visibility className={"Collage " + (this.state.drag === "out" ? "dragHover " : "") + (this.state.drag ? "anyDrag " : "") + (this.props.readOnly ? "readOnly " : "")}
                  onUpdate={this.handleUpdate}
                  onWheel={this.onWheel}
                  onMouseMove={this.onMouseMove}
                  onDrop={e => this.onDrop(e, null, null)}
                  onDragEnter={() => this.setState({ drag: "out" })}
                  onDragOver={e => e.preventDefault()}
                  onDragExit={() => this.setState({ drag: null })}
                  fireOnMount>
        <div className="wrap" style={wrapStyle}>
          {rows}
          {collageImages}
          <div className="extraImages">
            {extraImages}
          </div>
          <div className={"remove " + (this.state.drag === "delete" ? "dragHover " : "")}
               onDragEnter={e => { e.stopPropagation(); this.setState({ drag: "delete" }); }}
               onDragOver={e => { e.stopPropagation(); e.preventDefault(); }}
               onDragExit={e => { e.stopPropagation(); this.setState({ drag: null }); }}
               onDrop={e => this.onDelete(e)} >
            <Icon name="remove" />
          </div>
        </div>
        <Dimmer active={this.state.loading}>
          <Loader size="massive" />
        </Dimmer>
      </Visibility>
    );
  }
}

