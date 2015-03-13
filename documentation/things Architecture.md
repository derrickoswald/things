***things* Architecture**

Overview
========

The *things* application is a client-server system intended to create, manage and share *thing* objects. *Things* are torrent files with additional metadata as specified by the Thing Tracker Network{link} as well as the files that are identified by the torrent's file list and normally distributed using bittorrent technology. A simplified view of a sample *thing* is shown in Figure 1.

[Figure 1 – Simplified view of a sample thing]

The three main components of the system are the [couchdb database](http://couchdb.org/){check capitalization and official names}, the [Deluge bittorent client](http://deluge.org/), and an HTML5 compatible browser such as Chrome or Firefox. A simplified view of the application is shown in Figure 2.

[Figure 2 – Simplified diagram of the *things* application]

Client
======

{link to another page with a short description of Javascript: ECMA, relation to java, interactive, weakly typed, etc. }

In addition to the RESTful API, the couchdb web server is used to serve static content, including a number of javascript files which comprise the bulk of the application logic, i.e. most application functionality is executing on the client side. In addition to the application specific Javascript files, the third party components that are used on the client side of the application are:

-   jquery {version} (supercedes the jquery {version} that comes bundled with couchdb) is used to provide additional functionality to, and homogenization of, the javascript engines used by the supported browsers

-   require {version} framework to structure the application code into modules and to handle dependencies when loading javascript files

-   moustache {version} templating engine to provide HTML template processing that eases the repetitive and error-prone task of programatically generating HTML content from Javascript array of objects

-   bootstrap {version} cascading style sheet (CSS) files and a corresponding javascript file that is used to provide industry standard styling and on-screen widgets and functionality

Normally the jquery and bootstrap components are served by content distribution networks to ease bandwidth requirements of hostings systems, but a static version of the start page can be used when off-line to accomplish basic workflows. A simplified view of the client side application is shown in Figure 3.

[Figure 3 – Simplified diagram of client side components]

Server
======

{link to another page with a short description of couchdb: nosql, JSON documents, erlang, design documents, views, lists, versioning, replication, etc.}

The databases hosted by the couchdb server are:

-   things, the local database of user generated *things*

-   public\_things, the replicated database of community published *things*

-   pending\_things, the inbox for imported *things*

These databases have design documents that provide data validation and views that are specific to the application. To avoid cross-site scripting{link}, the proxy capability of couchdb is used to federate services under one url for consumption by the client. These services are:

-   Deluge web api which provides RESTful services to add, query and delete torrent files

-   Keybase {link to keybase.io} which provides a RESTful api to retrieve security credentials

The (lucene or solr) text search engine is running on the same node as the database to provide full text indexing. TBD

Multiple installations of the *thing* application are joined together by replication of the public\_things database using the replication functionality of couchdb, such that eventually all connected systems will have a consistent view of all published *things*. A simplified view of the server side application is shown in Figure 4.

[Figure 4 – Simplified diagram of server side components]

User Scripts
============

A few ancillary components provide additional functionality to aid in importing *things*. Greasemonkey scripts for Firefox and user scripts {check name} for Chrome intercede on the users behalf to allow seamless export from existing sites such as Thingiverse and Youmagine and import to the *things* system. The couchdb CORS {link} functionality is used to allow POST operations to couchdb while visiting the existing site. The imported things are held in the pending\_things database until reviewed and posted to the public\_things database. A simplified view of these user scripts is shown in Figure 5.

[Figure 5 – Simplified view of user script components]

Operation
=========

The following scenario describes a typical use-case where a designer wants to share her designs on the Thing Tracker Network. It is just an example for illustrative purposes and elides much detail in favor of simplicity. Technical users should refer to the appropriate module for additional details.

The designer has a design that has met some milestone and she would like to share it with colleagues in the community. She browses to a *things* system running on her local machine.

Using the Thing Wizard, she specifies the files to be included in the *thing* and the metadata to associate with it and uploads the new *thing* to her local things database. She could optionally use an existing *thing* as a template to create a new version and/or she could optionally sign the *thing* with her private key to prove to others that she made this *thing* and/or verify that the new *thing* is a verified new version of the original.

She then publishes the *thing* to the public\_things database which also places the torrent file and the associated files into Deluge. Deluge begins to seed the thing as with any other torrent.

When the public\_things database is replicated to other systems, her new *thing* is dispersed to these other systems as a document with an attached torrent file.

Her new *thing* is visible now when someone in the community browses or searches their own copy of the public\_thing database. Should they request the *thing* be copied locally, their own *things* system places the torrent file into Deluge. Deluge then begins the torrent download and when it is finished, her design files are now available local use.


