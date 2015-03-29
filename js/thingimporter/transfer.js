define
(
    ["../login", "../home"],
    function (login, home)
    {
        var db = "pending_things";
        var view_name = "GeneralView";
        function init ()
        {
            home.build (db, view_name, "listing");
        }

        function transfer ()
        {
            var list = [];
            $ (".select_id").each (function (n, item) { if (item.checked) list.push (item.getAttribute ("data-id")) });
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

        return (
        {

            getStep : function ()
            {
                var setup_hooks =
                    [
                        { id: "transfer", event: "click", code: transfer, obj: this }
                    ];
               return (
                {
                    id : "transfer",
                    title : "Transfer Things",
                    template : "templates/thingimporter/transfer.mst",
                    hooks: setup_hooks,
                    transitions: { enter: init, obj: this }
                });
            }
        });
    }
);
