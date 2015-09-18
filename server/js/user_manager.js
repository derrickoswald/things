
/**
 * Node based user manager for CouchDB.
 * External Node.js program using nano (https://github.com/dscape/nano) accessed
 * as described in externals (docs/externals.html) to add users to things instance.
 */

var http = require ("http");
var https = require ("https");
var sys = require ("sys");
var url = require ("url");

/**
 * Command line arguments.
 * <em>not used yet</em>
 */
var args = process.argv.slice (2);

/**
 * The port that this server should listen on.
 */
var listen_port = 8000;

/**
 * The URL for the CouchDB server.
 * Value read from user_manager/couchdb configuration.
 * Theoretically this could be constructed from daemons/httpsd, httpd/bind_address, httpd/port
 * except the bind address is usually 0.0.0.0 - which means 'any' and hence is not really available.
 */
var couchdb = "http://localhost:5984";

/**
 * The user (administrator) to connect as.
 * Value read from user_manager/username configuration.
 */
var username = "admin";

/**
 * The user's password.
 * Value read from user_manager/couchdb configuration.
 * NOTE: This should only be specified when *not* using proxy authentication.
 * NOTE: Using password authentication is not recommended because the
 * password is in plain text in the configuration file.
 */
var userpass = null;

/**
 * The user's role (or roles).
 * Value read from user_manager/userrole configuration.
 * Only used with proxy authentication.
 */
var userrole = "_admin";

/**
 * The shared secret (32 character hexadecimal value).
 * Value read from couch_httpd_auth/secret configuration.
 * Only used with proxy authentication.
 * @see http://docs.couchdb.org/en/latest/api/server/authn.html#proxy-authentication
 */
var secret = null;

/**
 * Connection to CouchDB using nano.
 * @see https://github.com/dscape/nano
 */
var nano = null;

/// Begin sha1.js
/// I'm too lazy to figure out what is absolutely required - so this is the whole file.

/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = "="; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}
function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}
function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}
function hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}
function b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}
function str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test()
{
  return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1(key, data)
{
  var bkey = str2binb(key);
  if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
  return core_sha1(opad.concat(hash), 512 + 160);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words
 * In 8-bit function, characters >255 have their hi-byte silently ignored.
 */
function str2binb(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
  return bin;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
  return str;
}

/*
 * Convert an array of big-endian words to a hex string.
 */
function binb2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
  }
  return str;
}

/*
 * Convert an array of big-endian words to a base-64 string
 */
function binb2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3)
  {
    var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}

/// End sha1.js

/**
 * Initialize nano.
 */
function need_nano (cookie)
{
    var options =
    {
        url: couchdb,
        parseUrl: false,
        log: function (id, message)
        {
            var prefix;
            var suffix;

            if (id)
                prefix = JSON.stringify (id) + ": ";
            else
                prefix = "";
            if (message)
                suffix = JSON.stringify (message);
            else
                suffix = "";
            console.log (JSON.stringify (["log", prefix + suffix]));
        },
    };
    if (secret)
        options.requestDefaults =
        {
            headers:
            {
                "X-Auth-CouchDB-UserName": username,
                "X-Auth-CouchDB-Roles": userrole,
                "X-Auth-CouchDB-Token": binb2hex (core_hmac_sha1 (secret, username))
            }
        };

    if (cookie)
        options.cookie = cookie;
    return (require ("nano")(options));
}

/**
 * Send a log message to be included in CouchDB's log files.
 */
var log = function (mesg)
{
    console.log (JSON.stringify (["log", mesg]));
};

/// The following are duplicated from the database.js file:

// expected views in a things database
var standard_views =
    {
        // view of only "things" (that have an info section) in the database
        things:
        {
            map: "function(doc) { if (doc.info) emit (doc._id, doc); }"
        }
    };

// validation function limiting create, update and delete to logged in users
var standard_validation =
    "function (newDoc, oldDoc, userCtx, secObj)" +
    "{" +
        "secObj.admins = secObj.admins || {};" +
        "secObj.admins.names = secObj.admins.names || [];" +
        "secObj.admins.roles = secObj.admins.roles || [];" +

        "var IS_DB_ADMIN = false;" +
        "if (~userCtx.roles.indexOf ('_admin'))" +
            "IS_DB_ADMIN = true;" +
        "if (~secObj.admins.names.indexOf (userCtx.name))" +
            "IS_DB_ADMIN = true;" +
        "for (var i = 0; i < userCtx.roles; i++)" +
            "if (~secObj.admins.roles.indexOf (userCtx.roles[i]))" +
                "IS_DB_ADMIN = true;" +

        "var IS_LOGGED_IN_USER = false;" +
        "if (null != userCtx.name)" +
            "IS_LOGGED_IN_USER = true;" +

        "if (IS_DB_ADMIN || IS_LOGGED_IN_USER)" +
            "log ('User : ' + userCtx.name + ' changing document: ' + newDoc._id);" +
        "else " +
            "throw { 'forbidden': 'Only admins and users can alter documents' };" +
    "}";

// standard full text search evaluation function
var standard_search =
{
    // all text content in default field, and everything in individual fields too
    search:
    {
        index:
            "function (doc)" +
            "{" +
                "var ret;" +

                "ret = new Document ();" +

                "if (doc['created by'])" +
                "{" +
                    "ret.add (doc['created by']);" +
                    "ret.add (doc['created by'], { field: 'created_by' });" +
                "}" +
                "if (doc['creation date'])" +
                    "ret.add (new Date (doc['creation date']), { type: 'date', field: 'creation_date' });" +

                "if (doc.info)" +
                "{" +
                    "if (doc.info.files)" +
                        "for (var f = 0; f < doc.info.files.length; f++)" +
                        "{" +
                            "ret.add (doc.info.files[f].path[0]);" +
                            "ret.add (doc.info.files[f].path[0], { field: 'file_name' });" +
                            "ret.add (doc.info.files[f].length, { type: 'long', field: 'file_size' });" +
                        "}" +
                    "if (doc.info.name)" +
                    "{" +
                        "ret.add (doc.info.name);" +
                        "ret.add (doc.info.name, { field: 'name' });" +
                    "}" +
                    "if (doc.info.thing)" +
                    "{" +
                        "if (doc.info.thing.title)" +
                        "{" +
                            "ret.add (doc.info.thing.title);" +
                            "ret.add (doc.info.thing.title, { field: 'title' });" +
                        "}" +
                        "if (doc.info.thing.url)" +
                        "{" +
                            "ret.add (doc.info.thing.url);" +
                            "ret.add (doc.info.thing.url, { field: 'url' });" +
                        "}" +
                        "if (doc.info.thing.authors)" +
                            "for (var a = 0; a < doc.info.thing.authors.length; a++)" +
                            "{" +
                                "ret.add (doc.info.thing.authors[a]);" +
                                "ret.add (doc.info.thing.authors[a], { field: 'authors' });" +
                            "}" +
                        "if (doc.info.thing.licenses)" +
                            "for (var l = 0; l < doc.info.thing.licenses.length; l++)" +
                            "{" +
                                "ret.add (doc.info.thing.licenses[l]);" +
                                "ret.add (doc.info.thing.licenses[l], { field: 'licenses' });" +
                            "}" +
                        "if (doc.info.thing.tags)" +
                            "for (var t = 0; t < doc.info.thing.tags.length; t++)" +
                            "{" +
                                "ret.add (doc.info.thing.tags[t]);" +
                                "ret.add (doc.info.thing.tags[t], { field: 'tags', analyzer: 'keyword' });" +
                            "}" +
                        "if (doc.info.thing.description)" +
                        "{" +
                            "ret.add (doc.info.thing.description);" +
                            "ret.add (doc.info.thing.description, { field: 'description' });" +
                        "}" +
                    "}" +
                "}" +

                "if (doc._attachments)" +
                    "for (var attachment in doc._attachments)" +
                    "{" +
                        "ret.attachment ('default', attachment);" +
                        "ret.attachment ('attachments', attachment);" +
                    "}" +

                "return (ret);" +
            "}"
    }
};

// security document limiting CRUD to the owning user
var standard_security =
{
    _id: "_security",
    admins:
    {
        names:
        [
            "admin"
        ],
        roles:
        [
            "_admin"
        ]
    },
    members:
    {
        names: [ ], // TBD
        roles: [ ]
    }
};

function eat_cookie (headers)
{
    // change the cookie if couchdb tells us to
    if (headers && headers["set-cookie"])
        nano = need_nano (headers["set-cookie"]);
}

function login (callback)
{
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
                                eat_cookie (headers);
                                callback ();
                            }
                        }
                    );
                else
                    callback ();
        }
    );
}

function get_uuid (options)
{
    // get a uuid for the new instance
    nano.request
    (
        {
            db: "_uuids",
            method: "get",
            params: { count: 1 }
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
                options.document.instance_uuid = body.uuids[0];
                var configuration = nano.use ("configuration");
                configuration.insert
                (
                    options.document,
                    function (err, body, headers)
                    {
                        if (err)
                        {
                            options.response.writeHead (500, {"Content-Type": "text/plain"});
                            options.response.end (JSON.stringify (err, null, 4) + "\n");
                        }
                        else
                        {
                            eat_cookie (headers);
                            options.response.writeHead (200, {"Content-Type": "text/plain"});
                            options.response.end ("User org.couchdb.user:" + options.username + " created.\n");
                        }
                    }
                );
            }
        }
    );
}

function make_configuration (options)
{
    var configuration = nano.use ("configuration");
    configuration.get
    (
        "default_configuration",
        {},
        function (err, body, headers)
        {
            if (err)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (err, null, 4) + "\n");
            }
            else
            {
                eat_cookie (headers);
                body._id = options.configuration;
                delete body._rev;
                body.instance_name = options.username;
                body.keybase_username = null;
                body.local_database = options.local_database;
                body.public_database = options.public_database;
                body.pending_database = options.pending_database;
                body.torrent_directory = null;
                options.document = body;
                get_uuid (options);
            }
        }
    );
}

function make_pending (options)
{
    options.pending_database = options.username + "_pending";
    nano.request
    (
        {
            db: options.pending_database,
            method: "put"
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
                eat_cookie (headers);
                var doc =
                {
                    _id: "_design/" + options.pending_database,
                    views: standard_views,
                    fulltext: standard_search
                };
                nano.request
                (
                    {
                        db: options.pending_database,
                        path: doc._id,
                        method: "put",
                        body: doc
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
                            eat_cookie (headers);
                            make_configuration (options);
                        }
                    }
                );
            }
        }
    );
}

function make_public (options)
{
    options.public_database = options.username + "_public";
    nano.request
    (
        {
            db: options.public_database,
            method: "put"
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
                eat_cookie (headers);
                var doc =
                {
                    _id: "_design/" + options.public_database,
                    views: standard_views,
                    validate_doc_update: standard_validation,
                    fulltext: standard_search
                };
                nano.request
                (
                    {
                        db: options.public_database,
                        path: doc._id,
                        method: "put",
                        body: doc
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
                            eat_cookie (headers);
                            make_pending (options);
                        }
                    }
                );
            }
        }
    );
}

function make_local (options)
{
    options.local_database = options.username + "_local";
    nano.request
    (
        {
            db: options.local_database,
            method: "put"
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
                eat_cookie (headers);
                var doc =
                {
                    _id: "_design/" + options.local_database,
                    views: standard_views,
                    validate_doc_update: standard_validation,
                    fulltext: standard_search
                };
                nano.request
                (
                    {
                        db: options.local_database,
                        path: doc._id,
                        method: "put",
                        body: doc
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
                            eat_cookie (headers);
                            var security = JSON.parse (JSON.stringify (standard_security));
                            security.members.names.push (options.username);
                            nano.request
                            (
                                {
                                    db: options.local_database,
                                    path: security._id,
                                    method: "put",
                                    body: security
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
                                        eat_cookie (headers);
                                        make_public (options);
                                    }
                                }
                            );
                        }
                    }
                );
            }
        }
    );
}

function create_user (options)
{
    options.configuration = options.username + "_configuration";
    var data =
    {
        type: "user",
        name: options.username,
        roles: ["user"],
        password: options.password,
        configuration: options.configuration 
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
                eat_cookie (headers);
                make_local (options); // which chains to make_public and make_pending
            }
        }
    );
}

function valid_name (name)
{
    // Only lowercase characters (a-z), digits (0-9), and any of the characters _, $, (, ), +, -, and / are allowed.
    // Must begin with a letter.
    var regex = /^[a-z](?:[a-z]|[0-9]|\_|\$|\(|\)|\+|\-|\/|)*$/;
    return (regex.test (name));  
}

function make_user (options)
{
    log ("make_user ('" + options.username + "', '" + options.password + "')\n");
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
                eat_cookie (headers);
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
                    create_user (options);
            }
        }
    );
}

/**
 * The HTTP server.
 */
var server = http.createServer
(
    // only one operation define so far: make a new user
    // needs two parameters: username and password
    function (req, resp)
    {
        log (req.method + " " + req.url);
        var query = url.parse (req.url, true).query;
        log (JSON.stringify (query, null, 4) + "\n");
        if (query.username && query.password)
        {
            if (valid_name (query.username))
                try
                {
                    // there are two ways to authenticate, 1) username and password or 2) proxy authentication
                    if (userpass) // userpass specified means 1)
                        login
                        (
                            make_user.bind
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
                    else // no userpass specified means 2)
                        make_user
                        (
                            {
                                request: req,
                                response: resp,
                                username: query.username,
                                password: query.password
                            }
                        );
                }
                catch (exception)
                {
                    options.response.writeHead (500, {"Content-Type": "text/plain"});
                    options.response.end (JSON.stringify (exception, null, 4) + "\n");
                }
            else
            {
                resp.writeHead (400, {"Content-Type": "text/plain"});
                resp.end ("Invalid name. User names must adhere to the CouchDB format for database names.\n");
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
        var section;
        var reconnect = false;
        var relisten = false;

        section = JSON.parse (data);
        if (section.listen_port)
        {
            listen_port = parseInt (section.listen_port);
            relisten = true;
        }
        if (section.username)
        {
            username = section.username;
            reconnect = true;
        }
        if (section.password)
        {
            userpass = section.password;
            reconnect = true;
        }
        if (section.userrole)
        {
            userrole = section.userrole;
            reconnect = true;
        }
        if (section.couchdb)
        {
            couchdb = section.couchdb;
            reconnect = true;
        }
        if (section.secret)
        {
            secret = section.secret;
            reconnect = true;
        }

        if (reconnect)
        {
            nano = need_nano ();
            log ("using " + couchdb + " as user " + username + (secret ? "[" + userrole + "]" : "") + (userpass ? "/" + userpass.replace (/./g, "*") : "") + "\n");
        }
        if (relisten)
        {
            server.listen (listen_port);
            log ("listening on port " + listen_port + "\n");
        }
        if ((null == secret) && (null == userpass))
            // ask for the secret
            console.log (JSON.stringify (["get", "couch_httpd_auth"]));
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

// send the request for the port to listen on and credentials
console.log (JSON.stringify (["get", "user_manager"]));

