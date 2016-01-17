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
    send ('<!DOCTYPE html>\n<html lang=\'en\'>\n    <body>\n');
    send (toJSON (req.query));
    send ('        <table>\n');
    send ('            <tr><th>Instance</th><th>Value</th></tr>\n');
    while (row = getRow ())
    {
        var name = row.value.instance_name;
        var uuid = row.value.instance_uuid;
        var db = row.value.public_database;
        send (''.concat(
            '            <tr>',
            '<td><a href=\'/' + db + '/_design/' + db + '/_rewrite/root?instance_uuid=' + uuid + '&database=' + db + '\' target=_blank>' + name + ' ' + db + '</a></td>',
            '<td>' + toJSON (row.value) + '</td>',
            '</tr>\n'
        ));
        db = row.value.pending_database;
        send (''.concat(
            '            <tr>',
            '<td><a href=\'/' + db + '/_design/' + db + '/_rewrite/root?instance_uuid=' + uuid + '&database=' + db + '\' target=_blank>' + name + ' ' + db + '</a></td>',
            '<td>' + toJSON (row.value) + '</td>',
            '</tr>\n'
        ));
        db = row.value.local_database;
        send (''.concat(
            '            <tr>',
            '<td><a href=\'/' + db + '/_design/' + db + '/_rewrite/root?instance_uuid=' + uuid + '&database=' + db + '\' target=_blank>' + name + ' ' + db + '</a></td>',
            '<td>' + toJSON (row.value) + '</td>',
            '</tr>\n'
        ));
    }
    send ('        </table>\n    </body>\n</html>');
}
