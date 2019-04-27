/**Json protocol helper to support jclient.
 * All JBody and JHelper static helpers are here. */
class Protocol {
	/**Format login request message.
	 * @param {string} uid
	 * @param {string} tk64
	 * @param {string} iv64
	 * @return login request message
	 */
	static formatSessionLogin (uid, tk64, iv64) {
		var body = new SessionReq(uid, tk64, iv64);
		body.a = 'login';
		return new JMessage(Protocol.Port.session, null, body);
	}

	/**Format a query request object, including all information for construct a "select" statement.
	 * @param  {string} tabl  from table
	 * @param  {string} alias
	 * @return {object} fromatter to build request object
	static formatQueryReq (tbl, alias) {
		return new QueryReq(this, tbl, alias);
	}
	 */

	static formatHeader (ssInf) {
		return new JHeader(ssInf.ssid, ssInf.uid);
	}

	static rs2arr (rs) {
		var cols = [];
		var rows = [];
		rs.forEach((r, rx) => {
			if (rx === 0) {
				cols = r;
			}
			else {
				rw = {};
				r.forEach((c, cx) => {
					rw[cols[cx]] = c;
				})
				rows.push(rw);
			}
		});

		return rows;
	}

	static nv2arr (nv) {
		return [nv.name, nv.value];
	}

	static nvs2arr(nvs) {
		var arr = [];
		if(nvs) {
			for (var ix = 0; ix < nvs.length; ix++)
				// Ix.nvn = 0; Ix.nvv = 1
				arr.push([nvs[ix].name, nvs[ix].value]);
		}
		return arr;
	}
} ;

/**Static methods of Protocol */
{
	Protocol.CRUD = {c: 'I', r: 'R', u: 'U', d: 'D'};

	Protocol.Port = {	heartbeat: "ping.serv", echo: "echo.serv", session: "login.serv",
						query: "r.serv", update: "u.serv",
						insert: "c.serv", delete: "d.serv",
						dataset: "ds.serv", stree: "s-tree.serv" };

	Protocol.MsgCode = {ok: "ok", exSession: "exSession", exSemantic: "exSemantic",
						exIo: "exIo", exTransct: "exTransct", exDA: "exDA",
						exGeneral: "exGeneral"};

	Protocol.cfg  = {	ssInfo: "ss-k", };
}

class JMessage {
	constructor (port, header, body) {
		this.version = "1.0";
		this.seq = Math.round(Math.random() * 1000);

		/**Protocol.Port property name, use this name to get port url */
		this.port = port; // for robustness?
		var prts = Protocol.Port;
		var msg = this;
		Object.getOwnPropertyNames(prts).forEach(function(val, idx, array) {
			if (prts[val] === port) {
				// console.log(val + ' -> ' + obj[val]);
				msg.port = val;
				return false;
			}
		});

		if (header)
			this.header = header;
		else this.header = {};

		this.body = [];
		// this.body.push(body.parentMsg(this));
		this.body.push(body);
	}

	/** A short cut for body[0].post()
	 * @param {UpdateReq} pst post sql request
	 * @return {UpdateReq} the  first request body[0].post returned value.*/
	post(pst) {
		if (this.body !== undefined && this.body.length > 0)
			return this.body[0].post(pst);
	}
}

class JHeader {
	constructor (ssid, userId) {
		this.ssid = ssid;
		this.uid = userId;
	}

	/**Set user action (for DB log on DB transaction)
	 * @param {object} act {funcId, remarks, cate, cmd}
	 */
	userAct (act) {
		this.usrAct = [];
		this.usrAct.push(act.funcId);
		this.usrAct.push(act.cate);
		this.usrAct.push(act.cmd);
		this.usrAct.push(act.remarks);
	}
}

class SessionReq {
	constructor (uid, token, iv) {
		this.uid = uid;
		this.token = token;
		this.iv = iv;
	}
}

class QueryReq {
	constructor (conn, tabl, alias, pageInf) {
		this.conn = conn;
		// this.query = query;
		this.mtabl = tabl;
		this.mAlias = alias;
		this.exprs = [];
		this.joins = [];
		this.where = [];

		if (pageInf)
			this.page(pageInf.size, pageInf.page);
	}

	page (size, idx) {
		this.page = idx;
		this.pgSize = size;
		return this;
	}

	/**add joins to the query request object
	 * @param {string} jt join type, example: "j" for inner join, "l" for left outer join
	 * @param {string} t table, example: "a_roles"
	 * @param {string} a alias, example: "r"
	 * @param {string} on on conditions, example: "r.roleId = mtbl.roleId and mtbl.flag={@varName}"
	 * Variables are replaced at client side (by js)
	 * @return this query object
	 */
	join (jt, t, a, on) {
		// parse "j:tbl:alias [conds]"
		this.joins.push([jt, t, a, on]);
		return this;
	}

	j (tbl, alias, conds) {
		return this.join("j", tbl, alias, conds);
	}

	l (tbl, alias, conds) {
		return this.join("l", tabl, alias, conds);
	}

	r (tbl, alias, conds) {
		return this.join("r", tabl, alias, conds);
	}

	joinss (js) {
		if (js !== undefined && js.length !== undefined)
			for (var ix = 0; ix < js.length; ix++)
				this.join(js[ix].t, js[ix].tabl, js[ix].as, js[ix].on);
		return this;
	}

	expr (exp, as) {
		//this.exprs.push({expr: exp, as: as});
		this.exprs.push([exp, as]);
		return this;
	}

	exprss (exps) {
		if (exps !== undefined && exps.length !== undefined)
			for (var ix = 0; ix < exps.length; ix++)
				if (exps[ix].exp !== undefined)
					this.expr(exps[ix].exp, exps[ix].as);
				else if (exps[ix].length !== undefined)
					this.expr(exps[ix][0], exps[ix][1]);
				else {
					console.error('Can not parse expr:');
					console.error(exps[ix]);
					console.error('Correct Format:')
					console.error('[exp, as]');
				}
		return this;
	}

	whereCond (logic, loper, roper) {
		if (Array.isArray(logic))
			this.where = this.where.concat(logic);
		else if (logic !== undefined)
			this.where.push([logic, loper, roper]);
		return this;
	}

	/** @param {Array} conds [{op, l, r}] */
	// wheres (conds) {
	// 	if (conds !== undefined && conds !== null && conds.length !== undefined)
	// 		for (var ix = 0; ix < conds.length; ix++)
	// 			this.whereCond(conds[ix].op, conds[ix].l, conds[ix].r);
	// 	return this;
	// }

	orderby (col, asc) {
		if (this.orders === undefined)
			this.orders = [];
		this.orders.push(col, asc);
		return this;
	}

	orderbys (cols) {
		if (cols !== undefined && cols.length !== undefined)
			for (var ix = 0; ix < cols.length; ix++)
				this.expr(cols[ix].col, cols[ix].asc);
		return this;
	}

	groupby (col) {
		console.warn("groupby() is still to be implemented");
		return this;
	}

	groupbys (cols) {
		console.warn("groupby() is still to be implemented");
		return this;
	}

	commit () {
		var hd = this.formatHeader();
		// return { header: hd, tabls: froms, exprs: expr, conds: cond, orders: order, group: groupings};
		return {header: hd,
				body: [{a: "R",
						exprs: this.exprs,
						f: this.mtbl,
						j: this.joinings,
						conds: this.cond,
						orders: this.order,
						group: this.groupings}]};
	}
}

class UpdateReq {
	constructor (conn, tabl, pk) {
		this.conn = conn;
		this.mtabl = tabl;
		this.nvs = [];
		this.where = [];
		if (Array.isArray(pk))
			this.where.push(pk);
		else if (typeof pk === "object")
		 	if (pk.pk !== undefined)
				this.where.push([pk.pk, pk.v]);
			else console.error("UpdateReq: Can't understand pk: ", pk);
	}

	nv (n, v) {
		if (Array.isArray(n))
			this.nvs = this.nvs.concat(Protocol.nvs2arr(n));
		else
			this.nvs.push([n, v]);
		return this;
	}

	whereCond (logic, loper, roper) {
		if (Array.isArray(logic))
			this.where = this.where.concat(logic);
		else if (logic !== undefined)
			this.where.push([logic, loper, roper]);
		return this;
	}

	post (pst) {
		if (pst === undefined) {
			console.warn('You really wanna an undefined post operation?');
			return this;
		}
		if (this.postUpds === undefined)
			this.postUpds = [];
		if (Array.isArray(pst)) {
			this.postUpds = this.postUpds.concat(pst);
		}
		else this.postUpds.push(pst);
		return this;
	}
}

class DeleteReq extends UpdateReq {
	constructor (conn, tabl, pk) {
		super (conn, tabl, pk);
		this.a = Protocol.CRUD.d;
	}
}
///////////////// io.odysz.semantic.ext ////////////////////////////////////////
// define t that can be understood by server
const ds_t = {sqltree: 'sqltree', retree: 'retree', reforest: 'reforest'};

class DatasetCfg extends QueryReq {
	/**@param {string} conn JDBC connection id, configured at server/WEB-INF/connects.xml
	 * @param {string} sk semantic key configured in WEB-INF/dataset.xml
	 */
	constructor (conn, sk, t, args) {
		super(conn, sk);

		this.conn = conn;
		this.sk = sk;
		this.sqlArgs = args;

		this._t(t);
		this.checkt(t);
	}

	get geTreeSemtcs() { return this.trSmtcs; }

	/**Set tree semantics
	 * @param {TreeSemantics} semtcs */
	treeSemtcs(semtcs) {
		this.trSmtcs = semtcs;
		return this;
	}

	_t(ask) {
		if (typeof sk === 'string' && sk.length > 0 && ask !== ds_t.sqltree) {
			console.warn('DatasetReq.a is ignored for sk is defined.', sk);
			this.a = ds_t.sqltree;
		}
		else {
			this.a = ask;
			this.checkt(ask);
		}
	}

	args(args) {
		if (this.sqlArgs === undefined)
			this.sqlArgs = [];

		if (typeof args === 'string')
			this.sqlArgs = this.sqlArgs.concat([args]);
		else if (Array.isArray(args))
			this.sqlArgs = args;
		else console.error('sql args is not an arry: ', args);
			this.sqlArgs = this.sqlArgs.concat(args);
		return this;
	}

	/** Check is t can be undertood by s-tree.serv
	 * @param {string} t*/
	checkt(t) {
		if (t !== ds_t.sqltree && t !== ds_t.retree && t !== ds_t.reforest)
			console.warn("t won't be understood by server:", t, "Should be one of", ds_t);
	}
}

///////////////// END //////////////////////////////////////////////////////////
export {Protocol, JMessage, JHeader, SessionReq, QueryReq, UpdateReq, DeleteReq, DatasetCfg}
