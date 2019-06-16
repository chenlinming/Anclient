package io.odysz.jclient;

import static org.junit.Assert.fail;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.sql.SQLException;
import java.util.List;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import io.odysz.common.Utils;
import io.odysz.jsample.protocol.Samport;
import io.odysz.module.rs.SResultset;
import io.odysz.semantic.ext.DatasetReq;
import io.odysz.semantic.jprotocol.JBody;
import io.odysz.semantic.jprotocol.JHeader;
import io.odysz.semantic.jprotocol.JHelper;
import io.odysz.semantic.jprotocol.JMessage;
import io.odysz.semantic.jserv.R.QueryReq;
import io.odysz.semantics.SemanticObject;
import io.odysz.semantics.x.SemanticException;

/**
 * Unit test for simple App. 
 */
public class SemantiClientTest {
	private static String jserv = null;
	private static String pswd = null;
	
	private SessionClient client;

	@BeforeAll
	public static void init() {
		Utils.printCaller(false);
		jserv = System.getProperty("jserv");
		if (jserv == null)
			fail("\nTo test SemantiClient, you need start a jsample server and define @jserv like this to run test:\n" +
				"-Djserv=http://localhost:8080/doc-base\n" +
				"In Eclipse, it is defined in:\n" +
				"Run -> Debug Configurations ... -> Junit [your test case name] -> Arguments");
   		pswd = System.getProperty("pswd");
   		if (pswd == null)
			fail("\nTo test SemantiClient, you need configure a user and it's password at jsample server, then define @pswd like this to run test:\n" +
				"-Dpswd=*******");

    	Clients.init(jserv);
    }

    @Test
    public void SemanticQueryTest() throws IOException,
    		SemanticException, SQLException, GeneralSecurityException {
    	Utils.printCaller(false);
    	JHelper.printCaller(false);

    	client = Clients.login("admin", pswd);
    	JMessage<QueryReq> req = client.query("inet",
    			"a_user", "u", "test",
    			-1, -1); // don't paging

    	req.body(0)
    		.expr("userName", "uname")
    		.expr("userId", "uid")
    		.expr("r.roleId", "role")
    		.j("a_roles", "r", "u.roleId = r.roleId")
    		.where("=", "u.userId", "'admin'");

    	client.commit(req, (code, data) -> {
    		  	@SuppressWarnings("unchecked")
				List<SResultset> rses = (List<SResultset>) data.get("rs");
  				for (SResultset rs : rses) {
  					rs.printSomeData(true, 2, "uid", "uname", "role");
  					rs.beforeFirst();
  					while(rs.next()) {
  						String uid0 = rs.getString("uid");
  						assertEquals("admin", uid0);
  								
  						String roleId = rs.getString("role");
  						getMenu("admin", roleId);
  					}
  				}
    		}, (code, err) -> {
  				fail(err.getString("error"));
  				client.logout();
    	});
    }

	private void getMenu(String string, String roleId) throws SemanticException, IOException, SQLException {
		DatasetReq req = new DatasetReq(null, "jserv-sample");

		String t = "menu";
		// JHeader header = new JHeader("menu", ssInf.getString("uid"));
		JHeader header = client.header();
		String[] act = JHeader.usrAct("SemanticClientTest", "init", t,
				"test jclient.java loading menu from menu.sample");

		JMessage<? extends JBody> jmsg = client.userReq(t, Samport.menu, act, req);
		jmsg.header(header);

		client.console(jmsg);
		
    	client.commit(jmsg, (code, data) -> {
    		@SuppressWarnings("unchecked")
			List<SemanticObject> rses = (List<SemanticObject>) data.get("menu");
  			for (SemanticObject rs : rses) {
  				// rs.printSomeData(false, 1, "functId", "funcName");
  				rs.print(System.out);

  			}
    	});
	}
}
