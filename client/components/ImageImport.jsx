import React, { Component } from 'react';
import { Button, Form, Input } from "semantic-ui-react";
import isNode from 'detect-node';


export default class ImageImport extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      url: "",
      file: isNode ? {} : document.createElement('input'),
    };
    
    this.state.file.type = "file";
    this.state.file.onchange = this.onFile.bind(this);
    
    this.fromUrl = this.fromUrl.bind(this);
    this.fromDisk = this.fromDisk.bind(this);
  }
  
  fromUrl() {
    this.props.onImageImport(`/4chan/customImage?url=${encodeURIComponent(this.state.url)}`);
  }
  
  fromDisk() {
    this.state.file.click();
  }
  
  onFile(ev) {
    const tgt = ev.target,
          files = tgt.files;
    
    if(files.length) {
      const fr = new FileReader();
      fr.onload = () => {
        this.props.onImageImport(fr.result);
      };
      fr.readAsDataURL(files[0]);
    }
  }
  
  render() {
    return (
      <Form>
        <Form.Group>
          <Form.Field width={8}>
            <Input fluid placeholder="Image Url" defaultValue={this.state.url} onChange={e => this.setState({ url: e.target.value })} />
          </Form.Field>
          <Form.Field width={4}>
            <Button fluid primary onClick={this.fromUrl}>From Url</Button>
          </Form.Field>
          <Form.Field width={4}>
            <Button fluid onClick={this.fromDisk}>From Disk</Button>
          </Form.Field>
        </Form.Group>
      </Form>
    );
  }
}
