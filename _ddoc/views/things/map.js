// view of only "things" (that have an info section) in the database
function map (doc)
{
    if (doc.info)
        emit (doc._id, doc);
}