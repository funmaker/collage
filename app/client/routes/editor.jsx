import React from 'react'
import {fetchInitialData, getInitialData} from "../helpers/initialData";
import {Accordion, Button, Form, Icon, Input} from "semantic-ui-react";
import qs from 'querystring';
import ThreadBrowser from "../components/threadBrowser";
import Collage from "../components/collage";
import FormIterator from "../helpers/FormIterator";
import requestJSON from "../helpers/requestJSON";
import ImageClipper from "../components/ImageClipper";
import Cropper from 'react-cropper';
import ImageImport from "../components/ImageImport";

export default class Editor extends React.Component {
    constructor() {
        super();

        this.state = {
            activeIndex: 0,
            clipImage: null,
            loading: false,
            ...getInitialData(),
        };

        this.openMenu = this.openMenu.bind(this);
        this.submitSettings = this.submitSettings.bind(this);
        this.onImageClip = this.onImageClip.bind(this);
        this.onMoveImage = this.onMoveImage.bind(this);
        this.onImageImport = this.onImageImport.bind(this);
    }

    async componentDidMount() {
        this.setState({
            ...await fetchInitialData(),
            ...this.state,
        });
    }

    openMenu(e, titleProps) {
        const { index } = titleProps;
        const { activeIndex } = this.state;
        const newIndex = activeIndex === index ? -1 : index;

        this.setState({ activeIndex: newIndex });
        window.dispatchEvent(new Event('resize'));
    }

    async onImageImport(img) {
        const image = new Image();
        this.setState({
            loading: true,
        });

        if(img instanceof File) {

        }

        image.onload = () => {
            this.setState({
                clipImage: image,
                loading: false,
            });
        };
        image.src = img;
    }

    async onImageClip(image, rows, columns) {
        const result = await requestJSON({
            method: "POST",
            pathname: `/collage/${this.props.match.params.collage}/image`,
            data: {
                source_url: this.state.clipImage.src.length > 1024 ? null : this.state.clipImage.src,
                data: image.toDataURL('image/jpeg'),
                posx: null,
                posy: null,
                rows: rows,
                columns: columns,
            },
        });

        this.setState({
            clipImage: null,
            images: [...this.state.images, result.image]
        });
    }

    async onMoveImage(id, posx, posy) {
        let image = this.state.images.find(img => img.id === id);

        const result = await requestJSON({
            method: "PATCH",
            pathname: `/collage/${this.props.match.params.collage}/image/${id}`,
            data: {
                posx,
                posy
            },
        });

        this.setState({
            images: [...this.state.images.filter(img => img.id !== id), result.image],
        })
    }

    async submitSettings(e) {
        e.preventDefault();

        const data = new FormIterator(e.target).toJSON();

        if(data.img_width !== this.state.collage.img_width.toString() || data.img_height !== this.state.collage.img_height.toString()) {
            data.resetImages = true;
            if(!confirm("This operation will remove all imported images.\nDo you wish to continue?")) return;
        }

        const result = await requestJSON({
            method: "POST",
            pathname: `/collage/${this.props.match.params.collage}/update`,
            data,
        });

        console.log(result);

        if(data.resetImages) {
            this.setState({
                collage: {
                    ...this.state.collage,
                    ...data,
                },
                images: []
            });
        } else {
            this.setState({
                collage: {
                    ...this.state.collage,
                    ...data,
                },
                images: this.state.images.map(image => result.movedImages.includes(image.id) ? {...image, posx: null, posy: null} : image)
            });
        }
    }

    render() {
        const {activeIndex} = this.state;

        const collage = this.state.collage || {};
        const images = this.state.images || [];

        return (
            <div className="editorPage">
                <Accordion className="content" fluid styled>
                    <Accordion.Title active={activeIndex === 0} index={0} onClick={this.openMenu}>
                        <Icon name='dropdown' /> Collage Settings
                    </Accordion.Title>
                    <Accordion.Content active={activeIndex === 0}>
                        <Form onSubmit={this.submitSettings}>
                            <Form.Group widths='equal'>
                                <Form.Input fluid label='Rows' type="number" name="rows" defaultValue={collage.rows} min="1"/>
                                <Form.Input fluid label='Columns' type="number" name="columns" defaultValue={collage.columns} min="1"/>
                                <Form.Field>
                                    <label>Cell Width</label>
                                    <Input fluid label="px" labelPosition="right" type="number" name="img_width" defaultValue={collage.img_width} min="5"/>
                                </Form.Field>
                                <Form.Field>
                                    <label>Cell Height</label>
                                    <Input fluid label="px" labelPosition="right" type="number" name="img_height" defaultValue={collage.img_height} min="5"/>
                                </Form.Field>
                            </Form.Group>
                            <Form.Group>
                                <Form.Input width={12} label='Collage title' name="name" defaultValue={collage.name}/>
                                <Form.Field width={4}>
                                    <label className="settingsWarn">Changing cell dimensions will remove all imported images*</label>
                                    <Button fluid type='submit' primary>Update</Button>
                                </Form.Field>
                            </Form.Group>
                        </Form>
                    </Accordion.Content>

                    <Collage collage={this.state.collage} images={images} moveImage={this.onMoveImage} />

                    <Accordion.Title active={activeIndex === 1} index={1} onClick={this.openMenu}>
                        <Icon name='dropdown' /> Import External Image
                    </Accordion.Title>
                    <Accordion.Content active={activeIndex === 1}>
                        <ImageImport onImageImport={this.onImageImport} />
                    </Accordion.Content>

                    <Accordion.Title active={activeIndex === 2} index={2} onClick={this.openMenu}>
                        <Icon name='dropdown' /> Export
                    </Accordion.Title>
                    <Accordion.Content active={activeIndex === 2}>
                        <Form>
                            <Form.Group>
                                <Form.Field width={4}>
                                    <Button as="a" href={`/collage/${this.props.match.params.collage}/4chan`} target="_blank" fluid>4Chan Size</Button>
                                </Form.Field>
                                <Form.Field width={4}>
                                    <Button as="a" href={`/collage/${this.props.match.params.collage}/half`} target="_blank" fluid>Half Size</Button>
                                </Form.Field>
                                <Form.Field width={4}>
                                    <Button as="a" href={`/collage/${this.props.match.params.collage}/full`} target="_blank" fluid>Full Size</Button>
                                </Form.Field>
                                <Form.Field width={4}>
                                    <Button as="a" href={`/collage/${this.props.match.params.collage}/`} target="_blank" fluid primary>Live Preview</Button>
                                </Form.Field>
                            </Form.Group>
                        </Form>
                    </Accordion.Content>
                </Accordion>
                <ThreadBrowser onImagePick={this.onImageImport}
                               showLoader={this.state.loading} />

                <ImageClipper image={this.state.clipImage}
                              onClose={() => this.setState({clipImage: null})}
                              onDone={this.onImageClip}
                              width={collage.img_width}
                              height={collage.img_height} />
            </div>
        )
    }
}
