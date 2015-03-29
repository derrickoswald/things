// Mapping function to return only <em>thing</em> documents.
function map (doc)
{
    if (doc.info)
        emit (doc._id, doc);
}