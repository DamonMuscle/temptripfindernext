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
		allSecuredItems =
			[
				securedItemDefinition.level1Requestor,
				securedItemDefinition.level2Administrator,
				securedItemDefinition.level3Administrator,
				securedItemDefinition.level4Administrator,
				securedItemDefinition.transportationAdministrator,
			],
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
			tf.promiseAjax.post(url,
				{
					async: false,
					paramData: { skip: 0, take: 100 },
					data: ajaxData,
					success: function(apiResponse)
					{
						mySubmittedIds = (apiResponse && apiResponse.Items && apiResponse.Items.length) ? apiResponse.Items[0] : [];
					}
				});
			return mySubmittedIds;
		},
		checkIsMySubmitted = function(item)
		{
			if (!item) return false;
			var ids = getMySubmittedIds();
			return ids.indexOf(item[idName]) > -1;
		},
		editableRights = ["add", "edit", "batch", "delete"],
		stageSecuredItemsMap = {};

	stageSecuredItemsMap[TF.FieldTripStageEnum.level1RequestSubmitted] =
		[
			securedItemDefinition.level1Requestor,
			securedItemDefinition.level2Administrator,
			securedItemDefinition.level3Administrator,
			securedItemDefinition.level4Administrator,
			securedItemDefinition.transportationAdministrator
		];
	stageSecuredItemsMap[TF.FieldTripStageEnum.level2RequestDeclined] = stageSecuredItemsMap[TF.FieldTripStageEnum.level2RequestApproved] =
		[
			securedItemDefinition.level2Administrator,
			securedItemDefinition.level3Administrator,
			securedItemDefinition.level4Administrator,
			securedItemDefinition.transportationAdministrator
		];
	stageSecuredItemsMap[TF.FieldTripStageEnum.level3RequestDeclined] = stageSecuredItemsMap[TF.FieldTripStageEnum.level3RequestApproved] =
		[
			securedItemDefinition.level3Administrator,
			securedItemDefinition.level4Administrator,
			securedItemDefinition.transportationAdministrator
		];
	stageSecuredItemsMap[TF.FieldTripStageEnum.level4RequestDeclined] = stageSecuredItemsMap[TF.FieldTripStageEnum.level4RequestApproved] =
		[
			securedItemDefinition.level4Administrator,
			securedItemDefinition.transportationAdministrator
		];
	stageSecuredItemsMap[TF.FieldTripStageEnum.DeclinedByTransportation]
		= stageSecuredItemsMap[TF.FieldTripStageEnum.TransportationApproved]
		= stageSecuredItemsMap[TF.FieldTripStageEnum.RequestCanceled]
		= stageSecuredItemsMap[TF.FieldTripStageEnum.RequestCompleted]
		= [
			securedItemDefinition.transportationAdministrator
		];

	self.checkFieldTripEditable = function(item)
	{
		if (!item || item.FieldTripStageId == null) return false;
		if (tf.authManager.authorizationInfo.isAdmin) return true;
		var securedItems = stageSecuredItemsMap[item.FieldTripStageId] || [];
		return securedItems.some(function(item)
		{
			return editableRights.some(function(right)
			{
				return tf.authManager.authorizationInfo.isAuthorizedFor(item, right);
			});
		});
	};

	self.checkFieldTripsEditable = function(items)
	{
		return items && items.length && items.every(self.checkFieldTripEditable);
	};
})();