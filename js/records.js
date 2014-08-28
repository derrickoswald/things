define
(
    {
        read_records: function (db, fn)
        {
            $.couch.db (db).view
            (
                db + "/OverView",
                {
                    success: function (data)
                    {
                        fn (data.rows.map (function (element) { return (element.value); }));
                    },
                    error: function (status)
                    {
                        console.log (status);
                    },
                    reduce: false
                }
            );
        }
    }
);
