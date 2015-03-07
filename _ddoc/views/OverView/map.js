function map (doc)
{
    // need a copy because doc is read-only
    var thing = JSON.parse (JSON.stringify (doc.info.thing));
    thing.id = doc._id;
    emit (doc._id, thing);
}