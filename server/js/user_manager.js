
/**
 * Node based user manager for CouchDB.
 * External Node.js program using nano (https://github.com/dscape/nano) accessed
 * as described in externals (docs/externals.html) to add users to things instance.
 */

var http = require ("http");
var https = require ("https");
var sys = require ("sys");
var url = require ("url");
var nano = require ("nano")({ url: "http://localhost:5984" });

/**
 * Send a log message to be included in CouchDB's log files.
 */
var log = function (mesg)
{
    console.log (JSON.stringify (["log", mesg]));
};

function keybase_test (req, resp)
{
    var username = "joe";
    var keybase = "keybase.io";
    var keybase_lookup = "/_/api/1.0/user/lookup.json?usernames=" + username;
    var options =
    {
        hostname: keybase,
        port: 443,
        path: keybase_lookup,
        method: "GET"
    };

    var request = https.request
    (
        options,
        function (response)
        {
            response.on
            (
                "data",
                function (data)
                {
                    resp.writeHead (200, {"Content-Type": "text/plain"});
                    resp.end (data + "\n");
                }
            );
        }
    );
    request.end ();
    
    request.on (
        "error",
            function(e)
            {
                log (e);
            }
        );
};

function dblist_test (req, resp)
{
    nano.db.list
    (
        function (err, body, header)
        {
            var dbs = "";
            body.forEach
            (
                function (db)
                {
                    if ("" != dbs)
                        dbs += ", ";
                    dbs += db;
                }
            );
            resp.writeHead (200, {"Content-Type": "text/plain"});
            resp.end (dbs + "\n");
        }
    );
};

function login (callback)
{
    var username = "admin";
    var userpass = "secret";

    nano.session
    (
        function (err, body, headers)
        {
            if (err)
                log ("get session failed");
            else
                if (!body.userCtx.name) // not logged in
                    nano.auth
                    (
                        username,
                        userpass,
                        function (err, body, headers)
                        {
                            if (err)
                                log ("login as " + username + " failed: " + err);
                            else
                            {
                                log ("login as " + username + " was successful");
                                if (headers && headers["set-cookie"])
                                    nano = require ("nano")
                                    (
                                        {
                                            url : "http://localhost:5984",
                                            cookie: headers["set-cookie"]
                                        }
                                    );
                                callback ();
                            }
                        }
                    );
                else
                    callback ();
        }
    );
}

function createuser (options)
{
    var data =
    {
        type: "user",
        name: options.username,
        roles: ["user"],
        password: options.password
    };
    nano.request
    (
        {
            db: "_users",
            path: "org.couchdb.user:" + options.username,
            method: "put",
            body: data
        },
        function (err, body, headers)
        {
            if (err)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (err, null, 4) + "\n");
            }
            else
            {
                // change the cookie if couchdb tells us to
                if (headers && headers["set-cookie"])
                    nano = require ("nano")
                    (
                        {
                            url : "http://localhost:5984",
                            cookie: headers["set-cookie"]
                        }
                    );
                options.response.writeHead (200, {"Content-Type": "text/plain"});
                options.response.end ("User org.couchdb.user:" + options.username + " created.\n");
            }
        }
    );

}

function makeuser (options)
{
    log ("makeuser ('" + options.username + "', '" + options.password + "')\n");
    // get the current list of users
    nano.request
    (
        {
            db: "_users",
            doc: "_all_docs",
            method: "get"
        },
        function (err, body, headers)
        {
            var exists;
            if (err)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (err, null, 4) + "\n");
            }
            else
            {
                // change the cookie if couchdb tells us to
                if (headers && headers["set-cookie"])
                    nano = require ("nano")
                    (
                        {
                            url : "http://localhost:5984",
                            cookie: headers["set-cookie"]
                        }
                    );
                exists = false;
                for (var i = 0; i < body.rows.length; i++)
                {
                    if ("org.couchdb.user:" + options.username == body.rows[i].id)
                        exists = true;
                }
                if (exists)
                {
                    options.response.writeHead (409, {"Content-Type": "text/plain"});
                    options.response.end ("User org.couchdb.user:" + options.username + " already exists.\n");
                }
                else
                    createuser (options);
                {
                    options.response.writeHead (200, {"Content-Type": "text/plain"});
                    options.response.end ("User org.couchdb.user:" + options.username + " created.\n");
                }
            }
        }
    );
}

/**
 * The HTTP server.
 */
var server = http.createServer
(
    function (req, resp)
    {
        log (req.method + " " + req.url);
        var query = url.parse (req.url, true).query;
        log (JSON.stringify (query, null, 4) + "\n");
        if (query.username && query.password)
        {
            try
            {
                login
                (
                    makeuser.bind
                    (
                        this,
                        {
                            request: req,
                            response: resp,
                            username: query.username,
                            password: query.password
                        }
                    )
                );
            }
            catch (exception)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (exception, null, 4) + "\n");
            }
        }
        else
        {
            resp.writeHead (400, {"Content-Type": "text/plain"});
            resp.end ("Expected username and password.\n");
        }
    }
);

/**
 * Listen on standard input.
 */
var stdin = process.openStdin ();

stdin.on
(
    "data",
    function (data)
    {
        var port = parseInt (JSON.parse (data));
        log ("listening on port " + port + "\n");
        server.listen (port);
    }
);

stdin.on
(
    "end",
    function ()
    {
        process.exit (0);
    }
);

// send the request for the port to listen on
console.log (JSON.stringify (["get", "user_manager", "port"]));
