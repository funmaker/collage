import React, {Component} from 'react';
import {Button, Form, Input, Modal} from "semantic-ui-react";
import {Redirect, withRouter} from "react-router";
import requestJSON from "../helpers/requestJSON";

class PasswordModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            password: "",
            error: null,
        };

        this.onSubmit = this.onSubmit.bind(this);
    }

    async onSubmit(ev) {
        ev.preventDefault();

        try {
            await requestJSON({
                method: "POST",
                pathname: `/collage/${this.props.urlName}/login`,
                data: {
                    password: this.state.password,
                }
            });
        } catch (e) {
            if(e.response && e.response.status === 401) {
                return this.setState({
                    error: "Wrong Password.",
                    password: "",
                });
            } else {
                return this.setState({
                    error: e.message
                })
            }
        }

        this.props.onLogin();
    }

    render() {

        return (
            <Modal as={Form}
                   size="tiny"
                   open={this.props.open}
                   onSubmit={this.onSubmit}
                   className="PasswordModal" >
                <Modal.Header>
                    Enter Password
                </Modal.Header>
                <Modal.Content>
                    <span className="error" >{this.state.error}</span>
                    <Input fluid value={this.state.password} onChange={(e, {value}) => this.setState({password: value})} placeholder="Password" type="password" />
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={ev => ev.preventDefault() + this.props.history.go(-1)}>Back</Button>
                    <Button primary>Login</Button>
                </Modal.Actions>
            </Modal>
        );
    }
}

export default withRouter(PasswordModal);
