//requirejs.config
//(
//    {
//        //By default load any module IDs from js/lib
//        baseUrl: 'js/lib',
//        //except, if the module ID starts with "app",
//        //load it from the js/app directory. paths
//        //config is relative to the baseUrl, and
//        //never includes a ".js" extension since
//        //the paths config could be for a directory.
//        paths:
//        {
//            app: '../app'
//        }
//    }
//);

requirejs
(
    ["records", "keybase", "deluge"], // , "btsync"
    function (records, keybase, deluge) // , btsync
    {
        records.read_records (function (data) { document.getElementById ("records").innerHTML = JSON.stringify (data); });
        document.getElementById ("keybase").innerHTML = JSON.stringify (keybase.getsalt ("chris"));
        if (deluge.login (deluge.Password))
            document.getElementById ("deluge").innerHTML = JSON.stringify (deluge.getTorrentInfo ("ad2516c50852db638bdcd5d129547585786f639b"));
        //document.getElementById ("btsync").innerHTML = JSON.stringify (btsync.getFolders ());
        
        //$.couch.urlPrefix = "http://localhost:5984";
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
);

