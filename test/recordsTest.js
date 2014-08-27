define
(
    ["records"],
    function (r)
    {
        AsyncTestCase
        (
            "RecordsTest",
            {
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