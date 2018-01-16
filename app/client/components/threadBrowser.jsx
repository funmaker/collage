import React from 'react'
import {Button, Dimmer, Divider, Header, Icon, Image, Input, Item, Loader, Reveal, Segment} from "semantic-ui-react";
import filesize from 'filesize';
import requestJSON from "../helpers/requestJSON";

export const Post = ({post, board, thread}) => (
    <Item className={`Post ${location.hash === "#p"+post.no ? "selected" : ""}`}>
        <Item.Content id={"p"+post.no}>
            <Item.Header>
                <b>{post.name}</b> {post.now} <a href={"#p"+post.no}>No.</a><a href={`//boards.4chan.org/${board}/thread/${thread}#p${post.no}`} target="_blank">{post.no}</a>
            </Item.Header>
            {post.tim ?
                <React.Fragment>
                    <Item.Meta>
                        File: <a href={`//i.4cdn.org/${board}/${post.tim}${post.ext}`}>{post.filename}{post.ext}</a> ({filesize(post.fsize)} {post.w}x{post.h})
                    </Item.Meta>
                    <Item.Image>
                        <Image src={`//t.4cdn.org/${board}/${post.tim}s.jpg`}/>
                        <Dimmer active>
                            <Icon name='add' />
                            Add
                        </Dimmer>
                    </Item.Image>
                </React.Fragment>
            : null}
            <Item.Description dangerouslySetInnerHTML={{__html: post.com}} />
            {post.replies.length ? <Item.Extra> Replies: {post.replies.map(reply => <a href={"#p"+reply}>>>{reply}</a>)} </Item.Extra> : null}
        </Item.Content>
    </Item>
);

export default class ThreadBrowser extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            posts: [],
            board: null,
            thread: null,
            url: "https://boards.4chan.org/jp/thread/18205684",
            loading: false,
        };

        this.fetch = this.fetch.bind(this);
    }

    async fetch() {
        const parsed = this.state.url.match(/^.*boards\.4chan\.org\/([a-z0-9A-Z]*)\/thread\/([0-9]*).*$/);

        if(!parsed) {
            alert("Cannot parse thread url.")
            return
        }

        const href = `//a.4cdn.org/${parsed[1]}/thread/${parsed[2]}.json`;

        this.setState({
            loading: true,
        });

        const resposne = await requestJSON({
            pathname: "/4chan",
            search: {board: parsed[1], thread: parsed[2]}
        });

        const posts = resposne.posts;
        const replies = {};

        for(let post of posts) {
            const re = /class="quotelink">&gt;&gt;([0-9]*)/g;
            let match;
            while ((match = re.exec(post.com)) !== null) {
                if(!replies[match[1]]) replies[match[1]] = [];
                replies[match[1]].push(post.no);
            }
        }

        for(let post of posts) {
            post.replies = (replies[post.no] || []);
        }

        console.log(posts, replies);

        this.setState({
            posts,
            board: parsed[1],
            thread: parsed[2],
            loading: false,
        })
    }

    render() {
        const posts = this.state.posts.map(post => <Post post={post} key={post.no} board={this.state.board} thread={this.state.thread} />);

        return (
            <Segment className="ThreadBrowser">
                <div className="header">
                    <Button floated="right" onClick={this.fetch}>Fetch Thread</Button>
                    <Input fluid
                           placeholder="http://boards.4chan.org/a/thread/..."
                           onChange={(ev, {value}) => this.setState({url: value})}
                    />
                    <Divider />
                </div>
                <div className="thread">
                    <Item.Group divided>
                        {posts}
                    </Item.Group>
                    <Dimmer active={this.state.loading} inverted>
                        <Loader size="massive" />
                    </Dimmer>
                </div>
            </Segment>
        );
    }
}

