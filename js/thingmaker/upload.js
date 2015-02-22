define
(
    ["mustache", "../records", "../login"],
    function (mustache, records, login)
    {
        function upload (event, data)
        {
            if (data.filelist)
            {
                if (login.isLoggedIn ())
                {
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
                else
                    alert ("You must be logged in to upload files");
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