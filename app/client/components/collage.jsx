import React from 'react';
import {Visibility} from "semantic-ui-react";



export default class Collage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            zoom: 1,
            posx: 0,
            posy: 0,
            canvasWidth: 100,
            canvasHeight: 100,
        };

        this.handleUpdate = this.handleUpdate.bind(this);
        this.onWheel = this.onWheel.bind(this);
    }

    handleUpdate(e, {calculations}) {
        this.setState({
            canvasWidth: calculations.width,
            canvasHeight: calculations.height,
        });
    }

    onWheel(e) {
        e.preventDefault();

        const {posx, posy, canvasWidth, canvasHeight, zoom} = this.state;

        const newZoom = zoom * (1 - (e.deltaX || e.deltaY || e.deltaZ) / 20);

        this.setState({
            zoom: newZoom,
            posx: (posx - (e.clientX / canvasWidth  - 0.5)) / zoom * newZoom + (e.clientX / canvasWidth  - 0.5),
            posy: (posy - (e.clientY / canvasHeight - 0.5)) / zoom * newZoom + (e.clientY / canvasHeight - 0.5),
        })
    };

    calculateZoom(zoom) {
        const {collage} = this.props;
        const {canvasWidth, canvasHeight} = this.state;

        return Math.min(canvasWidth * 0.9 / (collage.img_width / collage.img_height * 100) / collage.columns, canvasHeight * 0.9 / 100 / collage.rows) * zoom
    }

    render() {
        const {collage} = this.props;
        const {zoom, posx, posy, canvasWidth, canvasHeight} = this.state;

        if(!collage){
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
                cells.push(<div className="cell" key={c} style={cellStyle} />)
            }
            rows.push(<div className="row" key={r}>{cells}</div>)
        }

        return (
            <Visibility className="Collage"
                        onUpdate={this.handleUpdate}
                        onWheel={this.onWheel}
                        fireOnMount>
                <div className="wrap" style={wrapStyle}>
                    {rows}
                </div>
            </Visibility>
        );
    }
}

