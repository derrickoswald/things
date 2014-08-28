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
                },

                testRecords: function (queue)
                {
                    queue.call
                    (
                        "read records",
                        function (callbacks)
                        {
                            var myCallback = callbacks.add (function (data) { assertEquals (["greg"], data); });
                            r.read_records (myCallback);
                        }
                    );
                }
            }
        );
    }
);