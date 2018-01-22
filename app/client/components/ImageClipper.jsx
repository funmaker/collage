import React, {Component} from 'react';
import {Button, Form, Input, Modal} from "semantic-ui-react";
import Cropper from 'react-cropper';

export default class ImageClipper extends Component {
    constructor(props) {
        super(props);

        this.state = {
            rows: 1,
            columns: 1,
            loading: false,
        };

        this.onChange = this.onChange.bind(this);
        this.clip = this.clip.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.image !== this.props.image) {
            this.setState({
                rows: 1,
                columns: 1,
            })
        }
    }

    onChange(crop) {
        this.setState({
            crop
        });
    }

    async clip() {
        if(this.state.loading) return;

        this.setState({
            loading: true,
        });

        const img = this.cropper.getCroppedCanvas({
            width: this.props.width * this.state.rows,
            height: this.props.height * this.state.columns,
        });

        await this.props.onDone(img, this.state.rows, this.state.columns);

        this.setState({
            loading: false,
        });
    }

    render() {
        const image = this.props.image || {};

        return (
            <Modal open={!!this.props.image}
                   closeOnDimmerClick={true}
                   closeIcon={true}
                   onClose={this.props.onClose}
                   className="ImageClipper">
                <Modal.Header>Add an Image</Modal.Header>
                <Modal.Content>
                    <div className="clipWrap">
                        <Cropper
                            src={image.src}
                            style={{ height: '60vh', width: '100%' }}
                            viewMode={2}
                            dragMode="move"
                            autoCropArea={1}
                            aspectRatio={this.props.width / this.props.height * this.state.columns / this.state.rows}
                            guides={false}
                            ref={cropper => this.cropper = cropper} />
                    </div>
                    <div className="clipSpan">
                        Image will take
                        <Input value={this.state.columns}
                               onChange={e => this.setState({columns: e.target.value})}
                               type="number"
                               label="cells"
                               labelPosition="right"
                               min={1} /> horizontally and
                        <Input value={this.state.rows}
                               onChange={e => this.setState({rows: e.target.value})}
                               type="number"
                               label="cells"
                               labelPosition="right"
                               min={1} /> vertically.
                    </div>
                </Modal.Content>
                <Modal.Actions>
                    <Button primary onClick={this.clip} loading={this.state.loading}>Import</Button>
                </Modal.Actions>
            </Modal>
        )
    }
}

