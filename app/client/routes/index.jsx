import React from 'react'
import {Button, Checkbox, Form, Grid, Header, Message, Popup, Segment} from "semantic-ui-react";
import requestJSON from "../helpers/requestJSON";
import {Redirect} from "react-router";

export default class Index extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            error: null,
            redirect: null,
        };

        this.submit = this.submit.bind(this);
    }

    async submit(ev) {
        ev.preventDefault();

        let data = {};
        let formdata = new FormData(ev.target);
        for (let tuple of formdata.entries()) data[tuple[0]] = tuple[1];

        let response;
        try {
            response = await requestJSON({
                method: "POST",
                pathname: "/collage",
                data
            });
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

        this.setState({
            redirect: `/collage/${response.urlName}/editor`
        });
    }

    render() {
        return (
            <Grid
                textAlign='center'
                verticalAlign='middle'
                className="IndexPage"
            >
                {this.state.redirect ? <Redirect push to={this.state.redirect} /> : null}
                <Grid.Column style={{ maxWidth: 450 }}>
                    <Header as='h2' color='teal' textAlign='center'>
                        Waifu Collage Generator<sup>α</sup>
                    </Header>
                    <Form size='large' onSubmit={this.submit}>
                        <Segment stacked textAlign="left">
                            {this.state.error ? <Message negative onDismiss={()=>this.setState({error:null})}>{this.state.error}</Message> : null}
                            <Form.Input
                                fluid
                                icon='write'
                                iconPosition='left'
                                placeholder='Title'
                                name='title'
                                required
                            />
                            <Form.Input
                                fluid
                                icon='user'
                                iconPosition='left'
                                placeholder='Your Name'
                                name='author'
                                required
                            />
                            <Form.Input
                                fluid
                                icon='lock'
                                iconPosition='left'
                                placeholder='Editor Password'
                                type='password'
                                name='password'
                                required
                            />
                            <Form.Field>
                                <Checkbox label='Unlisted' name='hide' />
                                <Popup
                                    trigger={<sup className="hint">?</sup>}
                                    content="Hide on main page"
                                    offset={15}
                                />
                            </Form.Field>

                            <Button color='teal' fluid size='large'>Create New Collage</Button>
                        </Segment>
                    </Form>
                </Grid.Column>
            </Grid>
        )
    }
}
