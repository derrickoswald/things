define
(
    ["../login", "../home"],
    function (login, home)
    {
        var db = "pending_things";
        var view_name = "Things";

        function transfer (docs)
        {
            var list = [];
            docs.forEach (function (item) { list.push (item._id); });
            // ToDo: delete pending_things
            $.couch.replicate
            (
                "pending_things",
                "things",
                {
                    success: function (data) { console.log (data); },
                    error: function (status) { console.log (status); }
                },
                {
                    create_target: false,
                    doc_ids: list
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
