define
(
    {
        read_records: function (fn)
        {
            if (fn)
                $.couch.db ("things").view
                (
                    "things/OverView",
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
