define
(
    ["records"],
    function (r)
    {
        TestCase
        (
            "RecordsTest",
            {
                testRecords: function ()
                {
                    assertEquals (["greg"], r.read_records ());
                }
            }
        );
    }
);