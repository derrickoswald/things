define
(
    ["records"],
    function (r)
    {
        AsyncTestCase
        (
            "RecordsTest",
            {
                testCouch: function (queue)
                {
                    var db = "testdb";
                    var del = null;
                    var view =
                    {
                        "_id":"_design/" + db,
                        "language": "javascript",
                        "views":
                        {
                            "OverView":
                            {
                                "map": "function(doc) { emit (doc._id, doc.name); }"
                            }
                        }
                    };
                    var doc =
                    {
                        "name": "greg"
                    };

                    queue.call
                    (
                        "check",
                        function (callbacks)
                        {


                            [
                                "_replicator",
                                "_users"
                            ]
                            
                            var list = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                    del = -1 != data.indexOf (db);
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
                                $.couch.db (db).drop
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
                                    assertTrue ("create", data.ok);
                                }
                            );
                            var fail = callbacks.addErrback ('Failed to create database');
                            $.couch.db (db).create
                            (
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );
                    
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
                            var fail = callbacks.addErrback ('Failed to create view');
                            $.couch.db (db).saveDoc
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
                            var fail = callbacks.addErrback ('Failed to create document');
                            $.couch.db (db).saveDoc
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
                                    assertEquals (["greg"], data);
                                }
                            );
                            r.read_records (db, result);
                        }
                    );

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
                                    assertTrue ("drop", data.ok);
                                }
                            );
                            var fail = callbacks.addErrback ('Failed to drop database');
                            $.couch.db (db).drop
                            (
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );
                }
            }
        );
    }
);