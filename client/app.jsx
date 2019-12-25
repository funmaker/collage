import React from 'react';
import { Route, Switch, withRouter } from "react-router";
import isNode from 'detect-node';
import { hot } from 'react-hot-loader';
import IndexPage from "client/routes/IndexPage";
import { setInitialData } from "./helpers/initialData";
import PreviewPage from "./routes/PreviewPage";
import EditorPage from "./routes/EditorPage";

class App extends React.Component {
  constructor({ initialData }) {
    super();
    
    if(isNode) {
      setInitialData(initialData);
    } else {
      setInitialData(JSON.parse(document.getElementById('initialData').textContent));
    }
  }
  
  componentDidMount() {
    this.unlisten = this.props.history.listen(() => {
      setInitialData(null);
    });
  }
  
  componentWillUnmount() {
    this.unlisten();
  }
  
  render() {
    return (
      <Switch>
        <Route path="/" exact component={IndexPage} />
        <Route path="/collage/:collage" exact component={PreviewPage} />
        <Route path="/collage/:collage/editor" exact component={EditorPage} />
      </Switch>
    );
  }
}

export default hot(module)(withRouter(App));
