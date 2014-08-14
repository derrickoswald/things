
RecordsTest = TestCase("RecordsTest");

RecordsTest.prototype.testRecords = function ()
{
    assertEquals ("[\"greg\"]", read_records ());
};

