
var URL = "/keybase/_/api/1.0/"; // corresponds to https://keybase.io/_/api/1.0/ as proxied by couchdb
// i.e. add this line under the [httpd_global_handlers] section:
// keybase = {couch_httpd_proxy, handle_proxy_req, <<"https://keybase.io/">>}

// absolute minimum functionality
function getsalt (name)
{
    var url;
    var xmlhttp;
    var ret = null;

    url = URL + "getsalt.json" + "?email_or_username=" + name;
    xmlhttp = new XMLHttpRequest ();
    xmlhttp.open ("GET", url, false);
    xmlhttp.onreadystatechange = function ()
    {
        if ((4 == xmlhttp.readyState) && (200 == xmlhttp.status))
        {
            ret = JSON.parse (xmlhttp.responseText);
        }
    };
    xmlhttp.send ();
    
    return (ret);
}
