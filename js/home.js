define
(
    ["records", "keybase", "deluge"],
    function (records, keybase, deluge)
    {
        return (
            {
                initialize: function ()
                {

//                    <div class="row" id="main_area">
//                        <div class="col-md-8">
//                            <div id="keybase"></div>
//                            <div id="records"></div>
//                            <div id="info"></div>
//                            <div id="dbs"></div>
//                            <div id="other"></div>
//                        </div>
//                        <div class="col-md-4" id="sidebar">
//                            <div id="deluge"></div>
//                        </div>
//                    </div>
                    var row = document.createElement ("div");
                    row.id = "main_area";
                    row.className = "row";
                    var left = document.createElement ("div");
                    row.appendChild (left);
                    left.className = "col-md-8";
                    var item = document.createElement ("div");
                    left.appendChild (item);
                    item.id = "keybase";
                    item = document.createElement ("div");
                    left.appendChild (item);
                    item.id = "records";
                    item = document.createElement ("div");
                    left.appendChild (item);
                    item.id = "info";
                    item = document.createElement ("div");
                    left.appendChild (item);
                    item.id = "dbs";
                    item = document.createElement ("div");
                    left.appendChild (item);
                    item.id = "other";
                    var right = document.createElement ("div");
                    row.appendChild (right);
                    right.className = "col-md-4";
                    right.id = "sidebar";
                    item = document.createElement ("div");
                    right.appendChild (item);
                    item.id = "deluge";
                    var main = document.getElementById ("main");
                    while (main.firstChild)
                        main.removeChild (main.firstChild);
                    main.appendChild (row);

                    records.read_records
                    (
                        "things",
                        function (data)
                        {
                            document.getElementById ("records").innerHTML = JSON.stringify (data);
                        }
                    );
                    document.getElementById ("keybase").innerHTML = JSON.stringify (keybase.getsalt ("chris"));
                    if (deluge.login (deluge.Password))
                        document.getElementById ("deluge").innerHTML = JSON.stringify (deluge.getTorrentInfo ("ad2516c50852db638bdcd5d129547585786f639b"));

                    $.couch.info({
                        success: function(data) {
                            document.getElementById ("info").innerHTML = JSON.stringify (data);
                        }
                    });
                    $.couch.allDbs({
                        success: function(data) {
                            document.getElementById ("dbs").innerHTML = JSON.stringify (data);
                        }
                    });

                }
            }
        );
    }
);
