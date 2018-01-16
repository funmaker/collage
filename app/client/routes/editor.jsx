import React from 'react'
import {fetchInitialData, getInitialData} from "../helpers/initialData";
import {Accordion, Button, Form, Icon, Input, Segment} from "semantic-ui-react";
import ThreadBrowser from "../components/threadBrowser";
import Collage from "../components/collage";

export default class Editor extends React.Component {
    constructor() {
        super();

        this.state = {
            activeIndex: 0,
            ...getInitialData(),
        };

        this.handleClick = this.handleClick.bind(this);
    }

    async componentDidMount() {
        this.setState({
            ...await fetchInitialData(),
            ...this.state,
        });
    }

    handleClick(e, titleProps) {
        const { index } = titleProps;
        const { activeIndex } = this.state;
        const newIndex = activeIndex === index ? -1 : index;

        this.setState({ activeIndex: newIndex });
    }



    render() {
        const {activeIndex} = this.state;

        return (
            <div className="editorPage">
                <Accordion className="content" fluid styled>
                    <Accordion.Title active={activeIndex === 0} index={0} onClick={this.handleClick}>
                        <Icon name='dropdown' /> Collage Settings
                    </Accordion.Title>
                    <Accordion.Content active={activeIndex === 0}>
                        {this.state.collage ?
                            <Form onSubmit={this.submitSettings}>
                                <Form.Group widths='equal'>
                                    <Form.Input fluid label='Rows' type="number" name="rows" defaultValue={this.state.collage.rows}/>
                                    <Form.Input fluid label='Columns' type="number" name="columns" defaultValue={this.state.collage.columns}/>
                                    <Form.Field>
                                        <label>Cell Width</label>
                                        <Input fluid label="px" labelPosition="right" type="number" name="img_width" defaultValue={this.state.collage.img_width}/>
                                    </Form.Field>
                                    <Form.Field>
                                        <label>Cell Height</label>
                                        <Input fluid label="px" labelPosition="right" type="number" name="img_height" defaultValue={this.state.collage.img_height}/>
                                    </Form.Field>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Input width={12} label='Collage title' name="title" defaultValue={this.state.collage.name}/>
                                    <Form.Field width={4}>
                                        <label className="settingsWarn">Changing cell dimensions will remove all images*</label>
                                        <Button fluid type='submit'>Update</Button>
                                    </Form.Field>
                                </Form.Group>
                            </Form>
                        : null}
                    </Accordion.Content>

                    <Collage collage={this.state.collage} />

                    <Accordion.Title active={activeIndex === 1} index={1} onClick={this.handleClick}>
                        <Icon name='dropdown' /> Upload Static Image
                    </Accordion.Title>
                    <Accordion.Content active={activeIndex === 1}>

                    </Accordion.Content>

                    <Accordion.Title active={activeIndex === 2} index={2} onClick={this.handleClick}>
                        <Icon name='dropdown' /> Share
                    </Accordion.Title>
                    <Accordion.Content active={activeIndex === 2}>

                    </Accordion.Content>
                </Accordion>
                <ThreadBrowser />
            </div>
        )
    }
}
