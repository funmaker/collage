import React from 'react'
import {fetchInitialData, getInitialData} from "../helpers/initialData";
import {Button, Form, Segment} from "semantic-ui-react";
import ThreadBrowser from "../components/threadBrowser";
import Collage from "../components/collage";

export default class Preview extends React.Component {
    constructor() {
        super();

        this.state = {
            ...getInitialData(),
        };
    }

    async componentDidMount() {
        this.setState({
            ...await fetchInitialData(),
            ...this.state,
        });
    }

    render() {
        return (
            <div className="previewPage">
                <Collage collage={this.state.collage} images={this.state.images} />
                <Segment className="buttons">
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
                                <Button as="a" href={`/collage/${this.props.match.params.collage}/edit`} target="_blank" fluid primary>Edit</Button>
                            </Form.Field>
                        </Form.Group>
                    </Form>
                </Segment>
            </div>
        )
    }
}
