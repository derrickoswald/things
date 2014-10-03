define
(
    ["records"],
    function (r)
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
                                    name: "admin",
                                    password: "secret",
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

                str2ab: function (str)
                {
                    var len = str.length;
                    var ret = new ArrayBuffer (str.length);
                    var view = new Uint8Array (ret);
                    for (var i = 0; i < len; i++)
                        view[i] = (0xff & str.charCodeAt (i));

                    return (ret);
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

                    queue.call
                    (
                        "create doc attach",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                    assertTrue ("create document with attachment", data.ok);
                                }
                            );
                            var fail = callbacks.addErrback ("create document with attachment");
                            var file = new Blob ([filecontent], {type : 'text/html'}); // the blob
                            r.saveDocWithAttachments.call // $.couch.db (_Db)
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
                }
            }
        );
    }
);