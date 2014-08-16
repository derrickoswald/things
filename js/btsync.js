
var xURL = "/btsync/"; // corresponds to http://localhost:8888/ as proxied by couchdb
// i.e. add this line under the [httpd_global_handlers] section:
// btsync = {couch_httpd_proxy, handle_proxy_req, <<"http://localhost:8888/">>}

// You will also need to disable the default authentication module for couchdb by changing the line in default.ini from:
// authentication_handlers = {couch_httpd_oauth, oauth_authentication_handler}, {couch_httpd_auth, cookie_authentication_handler}, {couch_httpd_auth, default_authentication_handler}
// to
// authentication_handlers = {couch_httpd_oauth, oauth_authentication_handler}, {couch_httpd_auth, cookie_authentication_handler}
// otherwise it will consume the
// Authorization:Basic YWRtaW46bmV4c3lz
// HTTP header

// basic API, see http://www.bittorrent.com/sync/developers/api
// GET http://localhost:8888/api/method=get_folders
// [{"dir":"/home/derrick/mobile","error":0,"files":3,"indexing":0,"secret":"ADECGT633MSHQGVTPMY7A36WZHONCS6AV","size":41348373,"type":"read_write"}]

function getFolders ()
{
    var url;
    var xmlhttp;
    var ret = null;

    url = xURL + "api?method=get_folders";
    xmlhttp = new XMLHttpRequest ();
    xmlhttp.open ("GET", url, false, "admin", "password");
    xmlhttp.onreadystatechange = function ()
    {
        if ((4 == xmlhttp.readyState) && (200 == xmlhttp.status))
            ret = JSON.parse (xmlhttp.responseText);
    };
    xmlhttp.send ();
    
    return (ret);
}