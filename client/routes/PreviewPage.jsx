import React from 'react';
import { Button, Form, Header, Segment } from "semantic-ui-react";
import { Link } from "react-router-dom";
import isNode from 'detect-node';
import { fetchInitialData, getInitialData } from "../helpers/initialData";
import Collage from "../components/Collage";

export default class PreviewPage extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      ...getInitialData(),
    };
  }
  
  async componentDidMount() {
    this.setState({
      ...await fetchInitialData(),
    });
    
    if(!isNode) {
      this.ws = new WebSocket(`ws://${location.host}/collage/${this.props.match.params.collage}/live`);
      this.ws.addEventListener('message', msg => this.handleMessage(JSON.parse(msg.data)));
    }
  }
  
  handleMessage({ collage, resetImages, movedImages, newImage, updateImage, removeImage }) {
    const newState = {};
    
    if(collage) newState.collage = collage;
    if(resetImages) newState.images = [];
    if(movedImages) newState.images = this.state.images.map(image => movedImages.includes(image.id) ? { ...image, posx: null, posy: null } : image);
    if(newImage) newState.images = [...this.state.images, newImage];
    if(updateImage) newState.images = this.state.images.map(image => image.id === updateImage.id ? updateImage : image);
    if(removeImage) newState.images = this.state.images.filter(image => image.id !== removeImage);
    
    this.setState(newState);
  }
  
  render() {
    return (
      <div className="previewPage">
        <Collage collage={this.state.collage} images={this.state.images} readOnly />
        <Segment className="title">
          <h1>{this.state.collage && this.state.collage.name}</h1>
        </Segment>
        
        <Segment className="buttons">
          <Form>
            <Form.Group>
              <Form.Field width={3}>
                <Button as={Link} to="/" fluid secondary>Main Page</Button>
              </Form.Field>
              <Form.Field width={4}>
                <Button as="a" href={`/collage/${this.props.match.params.collage}/4chan`} target="_blank" fluid>4Chan Size</Button>
              </Form.Field>
              <Form.Field width={4}>
                <Button as="a" href={`/collage/${this.props.match.params.collage}/jpeg`} target="_blank" fluid>Full Jpeg</Button>
              </Form.Field>
              <Form.Field width={4}>
                <Button as="a" href={`/collage/${this.props.match.params.collage}/png`} target="_blank" fluid>Full Png</Button>
              </Form.Field>
              <Form.Field width={3}>
                <Button as={Link} to={`/collage/${this.props.match.params.collage}/editor`} fluid primary>Edit</Button>
              </Form.Field>
            </Form.Group>
          </Form>
        </Segment>
      </div>
    );
  }
}
