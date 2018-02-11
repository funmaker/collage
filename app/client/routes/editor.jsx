import React from 'react'
import {fetchInitialData, getInitialData} from "../helpers/initialData";
import {Accordion, Button, Form, Icon, Input, Message} from "semantic-ui-react";
import qs from 'querystring';
import ThreadBrowser from "../components/ThreadBrowser";
import Collage from "../components/Collage";
import FormIterator from "../helpers/FormIterator";
import requestJSON from "../helpers/requestJSON";
import ImageClipper from "../components/ImageClipper";
import Cropper from 'react-cropper';
import ImageImport from "../components/ImageImport";
import PasswordModal from "../components/PasswordModal";
import {Redirect} from "react-router";

export default class Editor extends React.Component {
    constructor() {
        super();

        const settings = getInitialData() ? getInitialData().collage : {
            rows: 0,
            columns: 0,
            img_width: 0,
            img_height: 0,
        };

        this.state = {
            activeIndex: 0,
            clipImage: null,
            loading: false,
            redirect: null,
            settings,
            ...getInitialData(),
        };

        this.openMenu = this.openMenu.bind(this);
        this.submitSettings = this.submitSettings.bind(this);
        this.onImageClip = this.onImageClip.bind(this);
        this.onMoveImage = this.onMoveImage.bind(this);
        this.onRemoveImage = this.onRemoveImage.bind(this);
        this.onImageImport = this.onImageImport.bind(this);
        this.onLogin = this.onLogin.bind(this);
        this.deleteCollage = this.deleteCollage.bind(this);
    }

    async componentDidMount() {
        const initialData = await fetchInitialData();
        this.setState({
            ...initialData,
            ...this.state,
            settings: initialData.collage,
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

    async onRemoveImage(id, posx, posy) {
        await requestJSON({
            method: "DELETE",
            pathname: `/collage/${this.props.match.params.collage}/image/${id}`
        });

        this.setState({
            images: [...this.state.images.filter(img => img.id !== id)],
        })
    }

    onLogin() {
        this.setState({hasAccess: true});
    }

    async deleteCollage(e) {
        e.preventDefault();

        if(!confirm("Are you sure you want to delete this collage?")) return;

        await requestJSON({
            method: "DELETE",
            pathname: `/collage/${this.props.match.params.collage}`
        });
        this.setState({redirect: "/"});
    }

    async submitSettings(e) {
        e.preventDefault();

        const data = new FormIterator(e.target).toJSON();

        if(data.img_width !== this.state.collage.img_width.toString() || data.img_height !== this.state.collage.img_height.toString()) {
            data.resetImages = true;
            if(!confirm("This operation will remove all imported images.\nDo you wish to continue?")) return;
        }

        try {
            const result = await requestJSON({
                method: "POST",
                pathname: `/collage/${this.props.match.params.collage}/update`,
                data,
            });

            if (data.resetImages) {
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
                    images: this.state.images.map(image => result.movedImages.includes(image.id) ? {
                        ...image,
                        posx: null,
                        posy: null
                    } : image)
                });
            }
        } catch (e) {
            console.log(e);
            if(e.response && e.response.status === 400) {
                return this.setState({
                    error: e.response.data.error
                });
            } else {
                return this.setState({
                    error: e.message
                })
            }
        }
    }

    render() {
        const {activeIndex} = this.state;

        const settings = this.state.settings;
        const collage = this.state.collage || {};
        const images = this.state.images || [];

        const updateSettings = name => (e, {value}) => this.setState({settings: {...settings, [name]: value}});

        return (
            <div className="editorPage">
                {this.state.redirect ? <Redirect to={this.state.redirect} push /> : null}
                <Accordion className="content" fluid styled>
                    <Accordion.Title active={activeIndex === 0} index={0} onClick={this.openMenu}>
                        <Icon name='dropdown' /> Collage Settings
                    </Accordion.Title>
                    <Accordion.Content active={activeIndex === 0}>
                        <Form onSubmit={this.submitSettings}>
                            {this.state.error ? <Message negative onDismiss={()=>this.setState({error:null})}>{this.state.error}</Message> : null}
                            <Form.Group widths='equal'>
                                <Form.Input fluid label='Columns' type="number" name="columns" value={settings.columns} onChange={updateSettings("columns")} min="1"/>
                                <Form.Input fluid label='Rows' type="number" name="rows" value={settings.rows} onChange={updateSettings("rows")} min="1"/>
                                <Form.Field>
                                    <label>Cell Width</label>
                                    <Input fluid label="px" labelPosition="right" type="number" name="img_width" value={settings.img_width} onChange={updateSettings("img_width")} min="5"/>
                                </Form.Field>
                                <Form.Field>
                                    <label>Cell Height</label>
                                    <Input fluid label="px" labelPosition="right" type="number" name="img_height" value={settings.img_height} onChange={updateSettings("img_height")} min="5"/>
                                </Form.Field>
                            </Form.Group>
                            <Form.Group>
                                <Form.Field width={4}>
                                    <label>&nbsp;</label>
                                    <Button fluid secondary onClick={this.deleteCollage}>Delete Collage</Button>
                                </Form.Field>
                                <Form.Input width={8} label='Collage title' name="name" value={settings.name} onChange={updateSettings("name")}/>
                                <Form.Field width={4}>
                                    <label className="settingsWarn">Changing cell dimensions will remove all imported images*</label>
                                    <Button fluid type='submit' primary>Update</Button>
                                </Form.Field>
                            </Form.Group>
                        </Form>
                    </Accordion.Content>

                    <Collage collage={this.state.collage} images={images} moveImage={this.onMoveImage} removeImage={this.onRemoveImage} />

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
                                    <Button as="a" href={`/collage/${this.props.match.params.collage}/4chan`} target="_blank" fluid>4Chan Friendly</Button>
                                </Form.Field>
                                <Form.Field width={4}>
                                    <Button as="a" href={`/collage/${this.props.match.params.collage}/jpeg`} target="_blank" fluid>Full Jpeg</Button>
                                </Form.Field>
                                <Form.Field width={4}>
                                    <Button as="a" href={`/collage/${this.props.match.params.collage}/png`} target="_blank" fluid>Full Png</Button>
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

                <PasswordModal open={this.state.hasAccess === false} urlName={this.props.match.params.collage} onLogin={this.onLogin} />
            </div>
        )
    }
}
