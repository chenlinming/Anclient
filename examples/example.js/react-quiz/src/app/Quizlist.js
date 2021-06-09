import React from 'react';
import ReactDOM from 'react-dom';
import { makeStyles } from '@material-ui/core/styles';
import ListSubheader from '@material-ui/core/ListSubheader';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import Add from '@material-ui/icons/Add';
import DraftsIcon from '@material-ui/icons/Drafts';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import SendIcon from '@material-ui/icons/Send';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import StarBorder from '@material-ui/icons/StarBorder';
import Sms from '@material-ui/icons/Sms';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';

import {L} from './utils/langstr';
import {AnContext} from '../../../lib/an-react';
import {JQuiz} from '../../../lib/an-quiz';
import {Jvector} from '../../../lib/jvector';
import {Login} from './Login.cmp.js';
import {QuizForm} from './Quiz.form.js';

class Quizlist extends React.Component {
	static getQx() { return ++quid; }

	classes = makeStyles({
		root: {
			width: '100%',
			maxWidth: 360,
		},
		nested: {
			minWidth: 24,
			'background-color': 'azure'
		},
	});

    state = {
		userid: '',
		pswd: '',
		username: '',
        quizzes: [],      // id, questions, answers, type, correct index
        currentqx: -1,    // currently expaneded
		openx: -1,        // currently editing
		creating: false,  // creating a new quiz

		// see https://reactjs.org/docs/context.html#caveats
		// client: {
		// 	an: undefined,
		// 	ssInf: undefined
		// },
		anClient: undefined,
    };

	constructor(props = {}) {
		super(props);
		this.state.quizzes = props.quizzes || [];

		this.onSelect = this.onSelect.bind(this);
		this.onFind = this.onFind.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onLogout = this.onLogout.bind(this);
		this.onLogin = this.onLogin.bind(this);
		this.reload = this.reload.bind(this);
		// this.alert = this.alert.bind(this);

		this.onEdit = this.onEdit.bind(this);
		this.onFormOk = this.onFormOk.bind(this);
	}

	onSelect(e) {
		e.stopPropagation();
		let qx = e.currentTarget.getAttribute('qx');
		qx = parseInt(qx);
		this.setState({
			currentqx: qx,
			openx: undefined,
		 	});
	};

	onFind(e) {
		let quizzes = [{id: "todo 2"}];
		this.setState({quizzes});
	}

	onAdd(e) {
		e.stopPropagation();
		this.setState({
			currentqx: -1,
			openx: -1,
			creating: true,
		 	});
	}

	onEdit(e) {
		e.stopPropagation();
		let qx = e.currentTarget.getAttribute('qx');
		qx = parseInt(qx);
		this.setState({
			currentqx: qx,
			openx: qx,
			creating: false,
		 	});
	}

	onFormOk(arg) {
		console.log(arg);
		this.setState( { } );
	}

	onLogin(client) {
		// console.log('Quizlist: loading with client:', client);
		// this.state.ssClient = client;
		// this.state.ssInf = client.ssInf;
		// this.state.client.an = client.an;
		this.setState({anClient: client});
		this.reload(client); // will reload quiz form
	}

	// alert(resp) {
	// 	console.error(resp);
	// }

	reload (client) {
		let that = this;
		let jquizzes = new JQuiz(client);
		jquizzes.list({}, onQuery);

		/**bind simple bars
		 * @param {jprotocol.AnsonResp} resp
		 */
		function onQuery(resp) {
			console.log(resp);

			resp = {
				count: 1, owener: 'admin',
				"quizzes": [
					{ "qx": 0,
					  "qid": "--- ---",
					  "title": "Quiz A",
					  "createdate": "1776-07-04",
					  "questions": 12,
					  "remarks": "Unicorn"
					},
				]
			};
			that.setState({quizzes: resp.quizzes});
		}

		// function onError (code, resp) {
		// 	if (code === an.Protocol.MsgCode.exIo)
		// 		that.alert('Network Failed!');
		// 	else if (resp.body[0])
		// 		// most likely MsgCode.exSession for password error
		// 		that.alert(code + ': ' + resp.body[0].m);
		// 	else console.error(resp);
		// }
	}

	onLogout(e) { this.setState({userid: ''}); }

	items() {
		if (!this.state.quizzes)
			return;

		return this.state.quizzes.map( (q, x) => (
		  <div key={`${this.state.userid}.${this.state.quizzes[x]['qx']}`}>
			<ListItem button qx={x} onClick={this.onSelect} color='secondary'>
				<ListItemIcon><Sms /></ListItemIcon>
				<ListItemText primary={this.state.quizzes[x].title} />
				<ListItemText primary={this.state.quizzes[x].createdate}/>
				<ListItemIcon onClick={this.onEdit} qx={x}>
					<DraftsIcon />
					<ListItemText primary="Edit" />
				</ListItemIcon>
			</ListItem>
			<Collapse in={this.state.currentqx == x} timeout="auto" >
				<TextField id="qtitle" label="Remarks"
				  variant="outlined" color="primary"
				  multiline fullWidth={true} value={this.state.quizzes[x].remarks}
				 />
			</Collapse>
		  </div>)
		);
	}

	render() {
		let quizId = this.state.currentqx >= 0
			? this.state.quizzes[this.state.currentqx].qid : undefined;
		let creating = this.state.creating;
		this.state.creating = false;

		return (<AnContext.Provider value={{anClient: this.state.anClient, quizId}}>
		  <Login onLoginOk={this.onLogin}/>
		  <List component="nav"
			aria-labelledby="nested-list-subheader"
			subheader={
				<ListSubheader component="div" id="quizzes-subheader">
				  { `User: ${this.state.username}` }
				</ListSubheader>
			}
			className={ this.classes.root } >

			{this.items()}
		  </List>
		  <ListItemIcon onClick={this.onAdd} ><Add />
		  <ListItemText primary={L("Add")} /></ListItemIcon>
		  <QuizForm open={this.state.openx >= 0 || creating}
		  			creating={creating}
		  			onOk={this.onFormOk} />
		</AnContext.Provider>);
	}

	bindQuizzes(elem) {
	    ReactDOM.render(<Quizlist />, document.getElementById(elem));
	}
}

export {Quizlist};
