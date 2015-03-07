
// list function to be used with the OverView view,
// see http://localhost:5984/things/_design/things/_list/thingtracker/OverView
function output (head, req)
{
    start({
        "headers": {
            "Content-Type": "application/json"
        }
    });
    send ("{\n    id: \"things\",\n    things: [\n");
    var records = 0;
    while (row = getRow ())
    {
        if (0 != records)
            send (",\n");
        var text = JSON.stringify (row.value, null, 4);
        var text = "        " + text.replace (/\n/g, "\n        ");
        send (text);
        records++;
    }
    send ("\n    ]\n}");
}