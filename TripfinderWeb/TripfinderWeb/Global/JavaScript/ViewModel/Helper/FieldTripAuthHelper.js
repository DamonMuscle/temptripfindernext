(function()
{
    var self = createNamespace("TF").FieldTripAuthHelper = {};

    var securedItemDefinition =
    {
        level1Requestor: "level1Requestor",
        level2Administrator: "level2Administrator",
        level3Administrator: "level3Administrator",
        level4Administrator: "level4Administrator",
        transportationAdministrator: "transportationAdministrator",
    },
        ajaxData =
        {
            "sortItems": [{ "Name": "PublicId" }, { "Name": "Id", "isAscending": "asc" }],
            "idFilter": { "IncludeOnly": null, "ExcludeAny": [] },
            "filterSet": null,
            "filterClause": "",
            "isQuickSearch": false,
            "fields": ["PublicId", "FieldTripStageName", "Name", "ReturnDate", "DepartDate", "DepartTime", "ReturnTime", "Id", "FieldTripStageId", "DepartDateTime"]
        },
        idName = "Id",
        mySubmittedIds,
        getMySubmittedIds = function()
        {
            if (mySubmittedIds) return mySubmittedIds;
            var url = pathCombine(tf.api.apiPrefix(), "search", "fieldtrip", "submitted", idName);
            var p = tf.promiseAjax.post(url,
                {
                    async: false,
                    paramData: { skip: 0, take: 100 },
                    data: ajaxData,
                    success: function(apiResponse)
                    {
                        mySubmittedIds = apiResponse.Items[0];
                    }
                });
            return mySubmittedIds;
        },
        checkIsMySubmitted = function(item)
        {
            if (!item) return false;
            var ids = getMySubmittedIds();
            return ids.indexOf(item[idName]) > -1;
        };

    // action can be "read", "edit", "add"
    self.checkFieldTripEditRight = function(item)
    {
        if (!item) return false;
        if (tf.authManager.authorizationInfo.isAdmin) return true;
        var stageId = item.FieldTripStageId, stageEnum = TF.FieldTripStageEnum;
        var isMySubmitted = checkIsMySubmitted(item) && stageId !== stageEnum.DeclinedByTransportation
            && stageId !== stageEnum.TransportationApproved
            && stageId !== stageEnum.RequestCanceled
            && stageId !== stageEnum.RequestCompleted;

        var rights = ["add", "edit", "save"],
            securedItems = [];
        if (isMySubmitted)
        {
            securedItems.push(securedItemDefinition.transportationAdministrator);
            securedItems.push(securedItemDefinition.level1Requestor);
            securedItems.push(securedItemDefinition.level2Administrator);
            securedItems.push(securedItemDefinition.level3Administrator);
            securedItems.push(securedItemDefinition.level4Administrator);
        }
        else
        {
            switch (stageId)
            {
                case stageEnum.Level1RequestSubmitted:
                    securedItems.push(securedItemDefinition.transportationAdministrator);
                    securedItems.push(securedItemDefinition.level1Requestor);
                    break;
                case stageEnum.level2ReqeustDeclined:
                case stageEnum.level2ReqeustApproved:
                    securedItems.push(securedItemDefinition.transportationAdministrator);
                    securedItems.push(securedItemDefinition.level2Administrator);
                    securedItems.push(securedItemDefinition.level3Administrator);
                    break;
                case stageEnum.level3ReqeustDeclined:
                case stageEnum.level3ReqeustApproved:
                    securedItems.push(securedItemDefinition.transportationAdministrator);
                    securedItems.push(securedItemDefinition.level3Administrator);
                    securedItems.push(securedItemDefinition.level4Administrator);
                    break;
                case stageEnum.level4ReqeustDeclined:
                case stageEnum.level4ReqeustApproved:
                    securedItems.push(securedItemDefinition.transportationAdministrator);
                    securedItems.push(securedItemDefinition.level4Administrator);
                    break;
                default:
                    securedItems.push(securedItemDefinition.transportationAdministrator);
                    break;
            };
        }

        return securedItems.some(function(item)
        {
            return rights.some(function(right)
            {
                return tf.authManager.authorizationInfo.isAuthorizedFor(item, right);
            });
        });
    };
})();