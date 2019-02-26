import $ from 'jquery';
import AES from './aes.js';
import {Protocol, JMessage, JHeader, SessionReq, QueryReq} from './protocol.js';

/**Jclient.js API
 * Java equivalent of
 * io.odysz.jclient.Clients;
 * io.odysz.jclient.SessionClient;
 */
class J {
	/**@param {string} serv serv path root, e.g. 'http://localhost/semantic-jserv'
	 */
	constructor (urlRoot) {
	 	this.cfg = {
			connId: null,
			verbose: true,
			defaultServ: urlRoot,
		}
	}

	servUrl (port) {
		return this.cfg.defaultServ + '/'
			+ Protocol.Port[port] + '?conn=' + this.cfg.connId;
	}

	init (connId, urlRoot) {
		this.cfg[connId] = urlRoot;

		if (this.cfg.defaultServ === null)
			this.cfg.defaultServ = urlRoot;
	}

	login (usrId, pswd, onLogin, onError) {
		// byte[] iv =   AESHelper.getRandom();
		// String iv64 = AESHelper.encode64(iv);
		// String tk64 = AESHelper.encrypt(uid, pswdPlain, iv);

		var aes = new AES();
		var iv = aes.getIv128();
		var c = aes.encrypt(usrId, pswd, iv);
		// var qobj = formatLogin(logId, c, bytesToB64(iv));
		var req = Protocol.formatSessionLogin(usrId, c, aes.bytesToB64(iv));

		this.post(req, function(resp) {
							var sessionClient = new SessionClient(resp.msg);
							if (typeof onLogin === "function")
								onLogin(sessionClient);
							else console.log(sessionClient);
						}, onError);
	}

	static checkResponse(resp) {
		if (typeof resp === "undefined" || resp === null || resp.length < 2)
			return "err_NA";
		else return false;
	}

	post (jreq, onOk, onErr) {
		var url = this.servUrl(jreq.port);

		$.ajax({type: 'POST',
				// url: this.cfg.defaultServ + "/query.serv?page=" + pgIx + "&size=" + pgSize,
				url: url,
				contentType: "application/json; charset=utf-8",
				crossDomain: true,
				//xhrFields: { withCredentials: true },
				data: JSON.stringify(jreq),
				success: function (resp) {
					// response Content-Type = application/json;charset=UTF-8
					// code != ok
					if (resp.code !== Protocol.MsgCode.ok)
						if (typeof onErr === "function")
							onErr(Protocol.MsgCode.exIo, resp);
						else console.error(resp);
					// code == ok
					else {
						if (typeof onOk === "function")
							onOk(resp);
						else console.log(resp);
					}
				},
				error: function (resp) {
					if (typeof onErr === "function")
						onErr(Protocol.MsgCode.exIo, resp);
					else {
						console.error("Accessing server failed.");
						console.error("Url: " + url);
						console.error("respons:");
						console.error(resp);
					}
				}
			});
	}
}

/**Client with session logged in.*/
class SessionClient {
	constructor (ssInf) {
		this.ssInf = ssInf;
	}

	query (t, alias, funcId, pageInf) {
		var qryItem = new QueryReq(t, alias, pageInf);
		var header = Protocol.formatHeader(this.ssInf);
		header.userAct({func: 'func01',
						cmd: 'select',
						cate: 'test',
						remarks: 'test query.serv'});
		var jreq = new JMessage(Protocol.Port.query, header, qryItem);
		return jreq;
	}

	/**load semantabl with records paged at server side.
	 * @param {object} query query object
	 * Use JProtocol to generate query object:<pre>
	var qobj = Protocol.query(tabl)
					.j()
					.expr()
					.where()
					.groupby()
					.orderby()
					.commit();</pre>
	 * @param {int} pgSize page size, -1 for no paging at server side.
	 * @param {int} pgIx page index, starting from 0. -1 for no paging at server side.
	 * @param {function} onSuccess on ajax success function: f(respons-data) {...}
	 * This function been called when http response is ok, can be called even when jserv throw an exception.
	 * Use JProtocol to parse the respons data.
	 * @param {function} onError on ajax error function: f(respons-data) {...}
	 * @param
	 */
	loadPage (query, pgSize, pgIx, onSuccess, onError) {
		if (typeof pgSize === "undefined")
			pgSize = -1;
		if (typeof pgIx === "undefined")
			pgIx = -1;

		$.ajax({type: "POST",
			//url: servUrl + "?t=" + t + "&page=" + (pageNumb - 1) + "&size=" + pageSize,
			url: this.cfg.defaultServ + "/query.serv?page=" + pgIx + "&size=" + pgSize,
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify(query),
			success: function (data) {
				if (checkResponse(data)) {
					console.error("checking respons failed. response:")
					console.error(data);
				}
				if (typeof onSuccess === "function")
					onSuccess(data);
			},
			error: function (data) {
				if (typeof onError === "function")
					onError(data);
				else console.error(data);
			}
		});
	}
}

/**Client without session information.
 * This is needed for some senarios like rigerstering new account.*/
class Inseclient {

}

export {J, SessionClient, Inseclient};
