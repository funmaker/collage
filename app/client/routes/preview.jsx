import React from 'react'
import {fetchInitialData, getInitialData} from "../helpers/initialData";
import {Segment} from "semantic-ui-react";
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
                <Collage collage={this.state.collage} />
            </div>
        )
    }
}
