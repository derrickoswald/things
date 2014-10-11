define
(
    ["mustache", "../records"],
    function (mustache, records)
    {
        function upload (event, data)
        {
            if (data.filelist)
            {
                records.login ();
                records.insert_record
                (
                    data.database,
                    data.filelist[0],
                    function (rec)
                    {
                        document.getElementById ("torrent_content").innerHTML = JSON.stringify (rec);
                    }
                );
                alert (JSON.stringify (data.filelist));
            }
        };

        return (
            {
                getStep: function ()
                {
                    var upload_hooks =
                        [
                            { id: "upload_button", event: "click", code: upload, obj: this }
                        ];
                    return ({ id: "upload", title: "Upload the thing", template: "templates/upload.mst", hooks: upload_hooks });
                }
            }
        );
    }
)