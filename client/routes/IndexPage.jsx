import React from 'react';
import { Button, Checkbox, Form, Grid, Header, Icon, Item, Message, Popup, Segment } from "semantic-ui-react";
import { Redirect } from "react-router";
import { Link } from "react-router-dom";
import requestJSON from "../helpers/requestJSON";
import { fetchInitialData, getInitialData } from "../helpers/initialData";
import FormIterator from "../helpers/FormIterator";

export default class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      error: null,
      redirect: null,
      recentlyAdded: [],
      ...getInitialData(),
    };
    
    this.submit = this.submit.bind(this);
  }
  
  async componentDidMount() {
    this.setState({
      ...await fetchInitialData(),
    });
  }
  
  async submit(ev) {
    ev.preventDefault();
    
    const data = new FormIterator(ev.target).serialize();
    
    let response;
    try {
      response = await requestJSON({
        method: "POST",
        pathname: "/collage",
        data,
      });
    } catch(e) {
      console.log(e);
      if(e.response && e.response.status === 400) {
        return this.setState({
          error: e.response.data.error,
        });
      } else {
        return this.setState({
          error: e.message,
        });
      }
    }
    
    this.setState({
      redirect: `/collage/${response.urlName}/editor`,
    });
  }
  
  render() {
    return (
      <div className="IndexPage">
        {this.state.redirect ? <Redirect push to={this.state.redirect} /> : null}
        <div className="mainColumn">
          <Header className="logo" as='h2' color='teal' textAlign='center'>
            <div>
							Waifu Collage Generator<sup>α</sup>
            </div>
          </Header>
          <Form className="loginForm" size='large' onSubmit={this.submit}>
            <Segment stacked textAlign="left">
              {this.state.error ? <Message negative onDismiss={() => this.setState({ error: null })}>{this.state.error}</Message> : null}
              <Form.Input fluid
                          icon='write'
                          iconPosition='left'
                          placeholder='Title'
                          name='title'
                          required />
              <Form.Input fluid
                          icon='user'
                          iconPosition='left'
                          placeholder='Your Name'
                          name='author'
                          required />
              <Form.Input fluid
                          icon='lock'
                          iconPosition='left'
                          placeholder='Editor Password'
                          type='password'
                          name='password'
                          required />
              <Form.Field>
                <Checkbox label='Unlisted' name='hidden' defaultChecked />
                <Popup trigger={<sup className="hint">?</sup>}
                       content="Hide on main page"
                       offset={15} />
              </Form.Field>
              
              <Button color='teal' fluid size='large'>Create New Collage</Button>
            </Segment>
          </Form>
          <Segment.Group className="recentlyAdded">
            <Segment inverted>
							Recently Added
            </Segment>
            <Segment className="content">
              <Item.Group divided>
                {this.state.recentlyAdded.map(collage => (
                  <Item as={Link}
                        to={`/collage/${collage.url_name}`}
                        key={collage.url_name}
                        header={collage.name} meta={`by: ${collage.author}`} />
								))}
              </Item.Group>
            </Segment>
          </Segment.Group>
        </div>
        <a href="https://github.com/funmaker/collage" className="githubIcon">
          <Icon name="github" />
					Found an issue?
        </a>
      </div>
    );
  }
}
