import React from 'react'
import {Redirect, Route, Switch, withRouter} from "react-router";
import {setInitialData} from "./helpers/initialData";
import isNode from 'detect-node';
import Index from "./routes/index";
import Editor from "./routes/editor";
import Preview from "./routes/preview";
import ErrorPage from "./routes/error";

class App extends React.Component {
	constructor({initialData}) {
		super();

		if(isNode){
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

		if(this.props.initialData._error) {
			return <ErrorPage error={this.props.initialData._error} />;
		}

		return (
			<Switch>
                <Route path="/" exact component={Index}/>
                <Route path="/collage/:collage" exact component={Preview}/>
                <Route path="/collage/:collage/editor" exact component={Editor}/>
			</Switch>
		)
	}
}

export default withRouter(App);
