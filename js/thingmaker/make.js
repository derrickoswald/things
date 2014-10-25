define
(
    ["mustache", "../records"],
    function (mustache, records)
    {
        function make (event, data)
        {
            var payload = "data" + "_" + Math.floor ((Math.random () * 1000) + 1);
            var doc =
            {
                "_id": "ad2516c50852db638bdcd5d129547585786f639b",
                "name": payload
            };
            var filecontent = "file" + "_" + Math.floor ((Math.random () * 1000) + 1);

            function ok (data)
            {
                console.log (data);
                alert ("make succeeded");
            };
            function fail (data)
            {
                console.log (data);
                alert ("make failed");
            };
            var file = new Blob ([filecontent], {type: 'text/html'}); // the blob
            file.name = "foo.txt";
            records.login ();
            records.saveDocWithAttachments.call // $.couch.db (_Db)
            (
                records,
                data.database,
                doc,
                {
                    success: ok,
                    error: fail
                },
                [file]
            );
        };

        return (
            {
                getStep: function ()
                {
                    var make_hooks =
                        [
                            { id: "make_thing_button", event: "click", code: make, obj: this }
                        ];
                    return ({ id: "enter_metadata", title: "Enter metadata", template: "templates/metadata.mst", hooks: make_hooks });
                }
            }
        );
    }
)
