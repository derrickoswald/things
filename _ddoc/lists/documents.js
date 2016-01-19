function output (head, req)
{
    var mustache = require ("modules/mustache");
    start
    (
        {
            'headers':
            {
                'Content-Type': 'text/html'
            }
        }
    );
    var vhosted = (req.requested_path[0] == 'instances') || (req.requested_path[0] == 'root');
    var root = vhosted ? '/instance/' : '/things/_design/things/_rewrite/instance/';

    // URL: http://localhost:5984/public_things/_design/things/_list/documents/things
    var body = mustache.render (this.templates["document"]);
    send (body);
//    send ('<!DOCTYPE html>\n<html lang=\'en\'>\n    <body>\n');
//    send ('<br>info: ' + toJSON (req.info));
//    send ('<br>query: ' + toJSON (req.query));
//    send ('<br>path: ' + toJSON (req.path));
//    send ('<br>raw_path: ' + toJSON (req.raw_path));
//    send ('<br>requested_path: ' + toJSON (req.requested_path));
//    send ('<br>mustache: ' + toJSON (mustache));
//    send ('<br>render: ' + mustache.render ("<h1>hello world</h1>"));
//    send ('<br>this: ' + toJSON ());
//    send ('<br>        <table>\n');
//    send ('            <tr><th>Documents</th><th>Created By:</th><th>Creation Date:</th><th>Info</th></tr>\n');
//    while (row = getRow ())
//    {
//        var uuid = row.id;
//        var author = row.value["created by"];
//        var date = row.value["creation date"];
//        send (''.concat(
//            '            <tr>',
//            '<td><a href=\'/' + uuid + '\' target=_blank>' + uuid + '</a></td>',
//            '<td>' + author + '</td>',
//            '<td>' + date + '</td>',
//            '<td>' + toJSON (row.value.info) + '</td>',
//            '</tr>\n'
//        ));
//    }
//    send ('        </table>\n    </body>\n</html>');
}
