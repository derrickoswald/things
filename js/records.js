

function read_records ()
{
    var url;
    var xmlhttp;
    var ret = "";

    url = "/things/_design/things/_view/OverView";
    xmlhttp = new XMLHttpRequest ();
    xmlhttp.open ("GET", url, false);
    xmlhttp.onreadystatechange = function ()
    {
        if ((4 == xmlhttp.readyState) && (200 == xmlhttp.status))
        {
            var result = JSON.parse (xmlhttp.responseText);
            ret = JSON.stringify (result.rows.map (function (element) { return (element.value); }));
        }
    };
    xmlhttp.send ();
    
    return (ret);
}