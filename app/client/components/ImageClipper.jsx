import React, {Component} from 'react';
import {Button, Divider, Form, Image, Input, Loader, Modal} from "semantic-ui-react";
import Cropper from 'react-cropper';
import requestJSON from "../helpers/requestJSON";

export default class ImageClipper extends Component {
    constructor(props) {
        super(props);

        this.state = {
            rows: 1,
            columns: 1,
            loading: false,
            loadingDuplicates: false,
            duplicates: [],
        };

        this.onChange = this.onChange.bind(this);
        this.clip = this.clip.bind(this);
    }

    componentDidMount() {
        this.checkDuplicates(this.props.image).catch(console.error);
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.image !== this.props.image) {
            this.setState({
                rows: 1,
                columns: 1,
            });
            this.checkDuplicates(nextProps.image).catch(console.error);
        }
    }

    onChange(crop) {
        this.setState({
            crop
        });
    }

    async checkDuplicates(image) {
        if(!image || !image.src || !image.src.startsWith("http")) return;

        this.setState({
            loadingDuplicates: true,
            duplicates: [],
        });

        const response = await requestJSON({
            method: "POST",
            pathname: `/collage/${this.props.urlName}/imageCheck`,
            data: {url: image.src}
        });

        this.setState({
            loadingDuplicates: false,
            duplicates: response.images,
        })
    }

    async clip() {
        if(this.state.loading) return;

        this.setState({
            loading: true,
        });

        const img = this.cropper.getCroppedCanvas({
            width: this.props.width * this.state.columns,
            height: this.props.height * this.state.rows,
        });

        await this.props.onDone(img, this.state.rows, this.state.columns);

        this.setState({
            loading: false,
        });
    }

    render() {
        const image = this.props.image || {};

        const google = <a href={`http://images.google.com/searchbyimage?image_url=${encodeURIComponent(image.src)}`} target="_blank">Search Google</a>;

        let duplicates = <div className="duplicateTitle">No local duplicates found. ({google})</div>;
        if(!image || !image.src || !image.src.startsWith("http")) {
            duplicates = <div className="duplicateTitle">Searching for duplicates is not supported for this image.</div>;
        } else if(this.state.duplicates.length > 0) {
            duplicates = (
                <div className="duplicateWrapper">
                    <div className="duplicateTitle">Visually similar local images: ({google})</div>
                    {this.state.duplicates.map((dup, id) => (
                        <div className="duplicate" key={id}>
                            <Image src={dup.data} />
                            <span>{100 - dup.diff / 16 / 2 * 100}%</span>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <Modal open={!!this.props.image}
                   closeOnDimmerClick={true}
                   closeIcon={true}
                   onClose={this.props.onClose}
                   className="ImageClipper">
                <Modal.Header>Add an Image</Modal.Header>
                <Modal.Content scrolling>
                    <div className="clipWrap">
                        <Cropper
                            src={image.src}
                            style={{ height: '50vh', width: '100%' }}
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
                    <Divider />
                    {this.state.loadingDuplicates ?
                        <div><Loader active inline inverted />&emsp;Looking for local duplicates...</div>
                        : duplicates}
                </Modal.Content>
                <Modal.Actions>
                    <Button primary onClick={this.clip} loading={this.state.loading}>Import</Button>
                </Modal.Actions>
            </Modal>
        )
    }
}

