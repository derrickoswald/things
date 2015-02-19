// ToDo:
// set timeout for couchdb calls to 0.5 seconds jquery.extend .ajaxSettings also ajaxExtend
// find out a way to only run online tests when really online
// find out a way to supply credentials to test systems without hard coding it
// determine architecture to allow couchdb replication without passwords (keybase.io public keys?)


// add timeout maybe:
//        // default timeout value is 0.5 second
//        _Timeout: 500,
//
//        setTimeOut: function (milliseconds)
//        {
//            var n = Number (milliseconds);
//            if (0 < n) // ToDo: check if zero is a valid timeout value
//                this._Timeout = n;
//        },
//
//        getTimeOut: function ()
//        {
//            return (this._Timeout);
//        },
// and then add this to the options of each call
//                    timeout: this.getTimeOut ()
// but not sure if it works or not

define
(
    ["records", "login_credentials"],
    function (r, l)
    {
        AsyncTestCase
        (
            "RecordsTest",
            {
                _Db: null, // 'global' variable with the name of the database under test

                // executed before each test - login, clean up messes, and create a new test database
                setUp : function (queue)
                {
                    _Db = "testdb" + "_" + Math.floor ((Math.random () * 1000) + 1);
                    var del = null;
                    queue.call
                    (
                        "login",
                        function (callbacks)
                        {
                            var list = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                }
                            );
                            $.couch.login
                            (
                                {
                                    name: l.get ("username"), // "admin"
                                    password: l.get ("password"), // "secret"
                                    success: list
                                }
                            );
                        }
                    );

                    queue.call
                    (
                        "check",
                        function (callbacks)
                        {
                            var list = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                    del = -1 != data.indexOf (_Db);
                                }
                            );
                            $.couch.allDbs
                            (
                                {
                                    success: list
                                }
                            );
                        }
                    );

                    queue.call
                    (
                        "cleanup",
                        function (callbacks)
                        {
                            if (del)
                                $.couch.db (_Db).drop
                                (
                                    {
                                        success: callbacks.noop ()
                                    }
                                );
                        }
                    );

                    queue.call
                    (
                        "create database",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                    jstestdriver.console.log ("setUp " + _Db);
                                    assertTrue ("create", data.ok);
                                }
                            );
                            var fail = callbacks.addErrback ("create database");
                            $.couch.db (_Db).create
                            (
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );
                    

                },

                tearDown : function (queue)
                {
                    queue.call
                    (
                        "drop database",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                    jstestdriver.console.log ("tearDown " + _Db);
                                    assertTrue ("drop", data.ok);
                                }
                            );
                            var fail = callbacks.addErrback ("drop database");
                            $.couch.db (_Db).drop
                            (
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );
                },

                testBasic: function (queue)
                {
                    var view =
                    {
                        "_id":"_design/" + _Db,
                        "language": "javascript",
                        "views":
                        {
                            "OverView":
                            {
                                "map": "function(doc) { emit (doc._id, doc.name); }"
                            }
                        }
                    };
                    var payload = "data" + "_" + Math.floor ((Math.random () * 1000) + 1);
                    var doc =
                    {
                        "name": payload
                    };

                    queue.call
                    (
                        "create view",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                    assertTrue ("create view", data.ok);
                                }
                            );
                            var fail = callbacks.addErrback ("create view");
                            $.couch.db (_Db).saveDoc
                            (
                                view,
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );

                    queue.call
                    (
                        "create document",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                    assertTrue ("create document", data.ok);
                                }
                            );
                            var fail = callbacks.addErrback ("create document");
                            $.couch.db (_Db).saveDoc
                            (
                                doc,
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );

                    queue.call
                    (
                        "read records",
                        function (callbacks)
                        {
                            var result = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                    assertEquals ([payload], data);
                                }
                            );
                            r.read_records (_Db, result);
                        }
                    );
                },

                testAttachment: function (queue)
                {
                    var payload = "data" + "_" + Math.floor ((Math.random () * 1000) + 1);
                    var doc =
                    {
                        "_id": "ad2516c50852db638bdcd5d129547585786f639b",
                        "name": payload
                    };
                    var filecontent = "file" + "_" + Math.floor ((Math.random () * 1000) + 1);
                    var filename = "foo.txt";
                    var id = null;

                    queue.call
                    (
                        "create document with attachment",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    console.log ("create document with attachment");
                                    console.log (data);
                                    assertTrue ("create document with attachment", data.ok);
                                    id = data.id;
                                }
                            );
                            var fail = callbacks.addErrback ("create document with attachment");
                            var file = new Blob ([filecontent], { type: "text/html"}); // the blob
                            file.name = filename; // add a name - as if it were a File object
                            r.saveDocWithAttachments.call
                            (
                                r, // this variable
                                _Db,
                                doc,
                                {
                                    success: ok,
                                    error: fail
                                },
                                [file]
                            );
                        }
                    );

//                    queue.call
//                    (
//                        "read attachment",
//                        function (callbacks)
//                        {
//                            var result = callbacks.add
//                            (
//                                function (data)
//                                {
//                                    console.log ("read attachment");
//                                    console.log (data);
//                                    assertEquals (filecontent, data);
//                                }
//                            );
//                            r.read_attachment (_Db, id, filename, result);
//                        }
//                    );
                }
            }
        );
    }
);