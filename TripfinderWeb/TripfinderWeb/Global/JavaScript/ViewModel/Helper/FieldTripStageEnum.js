(function()
{
    createNamespace("TF").FieldTripStageEnum =
        {
            level1RequestSubmitted: 1,
            level2RequestDeclined: 2,
            level2RequestApproved: 3,
            level3RequestDeclined: 4,
            level3RequestApproved: 5,
            level4RequestDeclined: 6,
            level4RequestApproved: 7,
            DeclinedByTransportation: 98,
            TransportationApproved: 99,
            RequestCanceled: 100,
            RequestCompleted: 101,
        };
})();