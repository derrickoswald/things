// view of configurations
function map (doc)
{
    if (doc.instance_uuid)
        emit (doc.instance_uuid, doc);
}