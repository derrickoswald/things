function output (head, req)
{
    start
    (
        {
            'headers':
            {
                'Content-Type': 'text/html'
            }
        }
    );
    var vhosted = req.requested_path[0] == 'instances';
    var root = vhosted ? '/root/' : '/'
    send ('<!DOCTYPE html>\n<html lang=\'en\'>\n    <body>\n');
    send ('<br>info:' + toJSON (req.info));
    send ('<br>query:' + toJSON (req.query));
    send ('<br>path:' + toJSON (req.path));
    send ('<br>raw_path:' + toJSON (req.raw_path));
    send ('<br>requested_path:' + toJSON (req.requested_path));
    send ('<br>        <table>\n');
    send ('            <tr><th>Instance</th><th>Value</th></tr>\n');
    while (row = getRow ())
    {
        var name = row.value.instance_name;
        var uuid = row.value.instance_uuid;
        var db = row.value.public_database;
        send (''.concat(
            '            <tr>',
            '<td><a href=\'' + root + db + '/_design/' + db + '/_rewrite/root?instance_uuid=' + uuid + '&database=' + db + '\' target=_blank>' + name + ' ' + db + '</a></td>',
            '<td>' + toJSON (row.value) + '</td>',
            '</tr>\n'
        ));
        db = row.value.pending_database;
        send (''.concat(
            '            <tr>',
            '<td><a href=\'' + root + db + '/_design/' + db + '/_rewrite/root?instance_uuid=' + uuid + '&database=' + db + '\' target=_blank>' + name + ' ' + db + '</a></td>',
            '<td>' + toJSON (row.value) + '</td>',
            '</tr>\n'
        ));
        db = row.value.local_database;
        send (''.concat(
            '            <tr>',
            '<td><a href=\'' + root + db + '/_design/' + db + '/_rewrite/root?instance_uuid=' + uuid + '&database=' + db + '\' target=_blank>' + name + ' ' + db + '</a></td>',
            '<td>' + toJSON (row.value) + '</td>',
            '</tr>\n'
        ));
    }
    send ('        </table>\n    </body>\n</html>');
}
