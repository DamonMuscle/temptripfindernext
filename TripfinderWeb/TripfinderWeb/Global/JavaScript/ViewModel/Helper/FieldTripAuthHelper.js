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

(function()
{
	createNamespace("TF").FieldTripAuthHelper = FieldTripAuthHelper;

	var securedItemDefinition =
	{
		transportationAdministrator: "transportationAdministrator",
		level4Administrator: "level4Administrator",
		level3Administrator: "level3Administrator",
		level2Administrator: "level2Administrator",
		level1Requestor: "level1Requestor",
	},
		allSecuredItems =
			[
				securedItemDefinition.transportationAdministrator,
				securedItemDefinition.level4Administrator,
				securedItemDefinition.level3Administrator,
				securedItemDefinition.level2Administrator,
				securedItemDefinition.level1Requestor,
			],
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

	function FieldTripAuthHelper()
	{
	}

	FieldTripAuthHelper.prototype.allSecuredItems = ["level1Requestor", "level2Administrator", "level3Administrator", "level4Administrator", "transportationAdministrator"];

	FieldTripAuthHelper.prototype.isAuthorizedFor = function(right, stageId)
	{
		if (tf.authManager.authorizationInfo.isAdmin) return true;

		var securedItem = this.getHighestRightsSecuredItem([right]),
			permittedLevels = this._getPermittedLevels(securedItem);

		if (stageId != null)
		{
			stageId = parseInt(stageId);
			return permittedLevels.indexOf(stageId) >= 0;
		}

		return permittedLevels.length > 0;
	};

	FieldTripAuthHelper.prototype.isAuthorizedForDelete = function(stageId)
	{
		if (tf.authManager.authorizationInfo.isAdmin) return true;

		stageId = parseInt(stageId);
		var securedItem = this.getHighestRightsSecuredItem(['delete']),
			permittedLevels = this._getPermittedLevels(securedItem);

		return permittedLevels.indexOf(stageId) >= 0;
	};

	FieldTripAuthHelper.prototype.checkFieldTripEditable = function(item)
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

	FieldTripAuthHelper.prototype.checkFieldTripsEditable = function(items)
	{
		return items && items.length && items.every(this.checkFieldTripEditable);
	};

	FieldTripAuthHelper.prototype.getAccessableStageIds = function()
	{
		var stageEnum = TF.FieldTripStageEnum;
		if (!Object.values)
		{
			Object.values = function(obj)
			{
				return Object.keys(obj).map(function(e)
				{
					return obj[e];
				})
			};
		}

		if (tf.authManager.authorizationInfo.isAdmin)
		{
			return Object.values(stageEnum);
		}

		var securedItem = this.getHighestRightsSecuredItem();

		return this._getPermittedLevels(securedItem);
	};

	FieldTripAuthHelper.prototype.getHighestRightsSecuredItem = function(rights)
	{
		var highest, rights = rights || editableRights;
		allSecuredItems.some(function(item)
		{
			return rights.some(function(right)
			{
				if (tf.authManager.authorizationInfo.isAuthorizedFor(item, right))
				{
					highest = item;
					return true;
				}

				return false;
			});
		});

		return highest;
	};

	FieldTripAuthHelper.prototype.getHighestEditRightApprovalSecuredItemId = function()
	{
		var securedItem = this.getHighestRightsSecuredItem();
		switch (securedItem)
		{
			case securedItemDefinition.transportationAdministrator:
				return TF.FieldTripStageEnum.TransportationApproved;
			case securedItemDefinition.level4Administrator:
				return TF.FieldTripStageEnum.level4RequestApproved;
			case securedItemDefinition.level3Administrator:
				return TF.FieldTripStageEnum.level3RequestApproved;
			case securedItemDefinition.level2Administrator:
				return TF.FieldTripStageEnum.level2RequestApproved;
			case securedItemDefinition.level1Requestor:
				return TF.FieldTripStageEnum.level1RequestSubmitted;
		}
	};

	FieldTripAuthHelper.prototype.isFieldTripAdmin = function()
	{
		if (tf.authManager.authorizationInfo.isAdmin) return true;
		if (tf.authManager.authorizationInfo.authorizationTree.securedItems.transportationAdministrator) return true;

		return false;
	};

	FieldTripAuthHelper.prototype._getPermittedLevels = function(securedItem)
	{
		var stageEnum = TF.FieldTripStageEnum;
		switch (securedItem)
		{
			case securedItemDefinition.transportationAdministrator:
				return Object.values(stageEnum);
			case securedItemDefinition.level4Administrator:
				return [
					stageEnum.level1RequestSubmitted,
					stageEnum.level2RequestDeclined,
					stageEnum.level2RequestApproved,
					stageEnum.level3RequestDeclined,
					stageEnum.level3RequestApproved,
					stageEnum.level4RequestDeclined,
					stageEnum.level4RequestApproved,
					stageEnum.RequestCanceled
				];
			case securedItemDefinition.level3Administrator:
				return [
					stageEnum.level1RequestSubmitted,
					stageEnum.level2RequestDeclined,
					stageEnum.level2RequestApproved,
					stageEnum.level3RequestDeclined,
					stageEnum.level3RequestApproved,
					stageEnum.RequestCanceled
				];
			case securedItemDefinition.level2Administrator:
				return [
					stageEnum.level1RequestSubmitted,
					stageEnum.level2RequestDeclined,
					stageEnum.level2RequestApproved,
					stageEnum.RequestCanceled
				];
			case securedItemDefinition.level1Requestor:
				return [stageEnum.level1RequestSubmitted, stageEnum.RequestCanceled];
			default:
				return [];
		}
	};
})();
