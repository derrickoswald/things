/**
 * This function as it is only allows logged in users, or admins to
 * create,update or delete documents
 *
 * @param newDoc the document to be created or used for update
 * @param oldDoc the current document if document id was specified in the HTTP request
 * @param userCtx user context object, which contains three properties:
 * <ul>
 * <li>db name of database (String)
 * <li>name user name (String)
 * <li>roles roles to which user belongs (Array of String). Currently only _admin role is supported.
 * <ul>
 * @param secObj the security object of the database
 */
function validate (newDoc, oldDoc, userCtx, secObj)
{
    secObj.admins = secObj.admins || {};
    secObj.admins.names = secObj.admins.names || [];
    secObj.admins.roles = secObj.admins.roles || [];

    var IS_DB_ADMIN = false;
    if (~userCtx.roles.indexOf ('_admin'))
        IS_DB_ADMIN = true;
    if (~secObj.admins.names.indexOf (userCtx.name))
        IS_DB_ADMIN = true;
    for (var i = 0; i < userCtx.roles; i++)
        if (~secObj.admins.roles.indexOf (userCtx.roles[i]))
            IS_DB_ADMIN = true;

    var IS_LOGGED_IN_USER = false;
    if (null != userCtx.name)
        IS_LOGGED_IN_USER = true;

    if (IS_DB_ADMIN || IS_LOGGED_IN_USER)
        log ('User : ' + userCtx.name + ' changing document: ' + newDoc._id);
    else
        throw { 'forbidden': 'Only admins and users can alter documents' };
}