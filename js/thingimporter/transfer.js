define
(
    ["../login", "../home", "../configuration"],
    function (login, home, configuration)
    {
        var db = configuration.getConfigurationItem ("pending_database");
        var view_name = "Things";

        function transfer (docs)
        {
            var list = [];
            docs.forEach (function (item) { list.push (item._id); });
            login.isLoggedIn
            (
                {
                    success: function (userCtx)
                    {
                        // ToDo: delete  from pending database
                        $.couch.replicate
                        (
                            db,
                            configuration.getConfigurationItem ("local_database"),
                            {
                                success: function (data) { console.log (data); },
                                error: function (status) { console.log (status); }
                            },
                            {
                                create_target: false,
                                doc_ids: list
                            }
                        );
                    },
                    error: function (userCtx)
                    {
                        alert ("You must be logged in to transfer a thing");
                    }
                }
            );
        }

        function init ()
        {
            home.build (db, view_name, "listing", { transfer: transfer });
        }

        return (
        {

            getStep : function ()
            {
               return (
                {
                    id : "transfer",
                    title : "Transfer Things",
                    template : "templates/thingimporter/transfer.mst",
                    transitions: { enter: init, obj: this }
                });
            }
        });
    }
);
