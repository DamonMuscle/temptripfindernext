(function()
{
    createNamespace("TF").FieldTripStageEnum =
        {
            level1RequestSubmitted: 1,
            level2ReqeustDeclined: 2,
            level2ReqeustApproved: 3,
            level3ReqeustDeclined: 4,
            level3ReqeustApproved: 5,
            level4ReqeustDeclined: 6,
            level4ReqeustApproved: 7,
            DeclinedByTransportation: 98,
            TransportationApproved: 99,
            RequestCanceled: 100,
            RequestCompleted: 101,
        };
})();