define
(
    {
        login: function ()
        {
            $.couch.login
            (
                {
                    name: "admin",
                    password: "secret",
                    success: function (data)
                    {
                        console.log (data);
                    },
                    error: function (status)
                    {
                        console.log (status);
                    }
                }
            );
        },

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
        },
        
        insert_record: function (db, doc, fn)
        {
            $.couch.db (db).saveDoc
            (
                doc,
                {
                    success: function (data)
                    {
                        fn (data);
                    },
                    error: function(status)
                    {
                        console.log (status); 
                    }
                }
            );
        }
    }
);
