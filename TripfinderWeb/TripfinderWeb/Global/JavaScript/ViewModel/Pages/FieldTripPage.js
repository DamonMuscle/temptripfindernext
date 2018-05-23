(function()
{
	createNamespace("TF.Page").FieldTripPage = FieldTripPage;

	function FieldTripPage()
	{
		var self = this;
		self.type = "fieldtrip";
		self.pageType = "fieldtrip";
		TF.Page.BaseGridPage.apply(self, arguments);
	}

	FieldTripPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	FieldTripPage.prototype.constructor = FieldTripPage;

	FieldTripPage.prototype.updateOptions = function()
	{
		var self = this;
		self.options.gridDefinition = tf.fieldTripGridDefinition.gridDefinition();
		self.options.showOmittedCount = false;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", "fieldtrip");
		self.options.extraFields = ["FieldTripStageId"];
		self.options.gridDefinition = tf.fieldTripGridDefinition.gridDefinition();
		self.options.storageKey = "grid.currentlayout." + self.type;
		self.options.loadUserDefined = false;

		self.options.summaryFilters = [{
			Id: -1,
			Name: "Today",
			IsValid: true
		},
		{
			Id: -2,
			Name: "Vehicle Scheduled",
			IsValid: true
		},
		{
			Id: -3,
			Name: "Pending Approval",
			IsValid: true,
			WhereClause: " FieldTripStageId = 1 or FieldTripStageId = 3 or FieldTripStageId = 5 or FieldTripStageId = 7",
			GridType: self.type
		},
		{
			Id: -4,
			Name: "Declined",
			IsValid: true,
			WhereClause: "FieldTripStageId = 2 or FieldTripStageId = 4 or FieldTripStageId = 6 or FieldTripStageId = 98",
			GridType: self.type
		},
		{
			Id: -5,
			Name: "Total",
			IsValid: true,
			WhereClause: "FieldTripStageId != 100",
			GridType: self.type
		},
		{
			Id: -6,
			Name: "Transportation Approved",
			IsValid: true,
			WhereClause: "FieldTripStageId = 99",
			GridType: self.type
		}
		];
		self.options.summaryFilterFunction = function(selectGridFilterEntityId)
		{
			if (selectGridFilterEntityId == -1 || selectGridFilterEntityId == -2)
			{
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "statistics", "fieldtripdepartingtrips")).then(function(response)
				{
					return response.Items[0];
				});
			}
			if (selectGridFilterEntityId == -3 || selectGridFilterEntityId == -4 ||
				selectGridFilterEntityId == -5 || selectGridFilterEntityId == -6)
			{
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "statistics", "fieldtrip")).then(function(response)
				{
					switch (selectGridFilterEntityId)
					{
						case -3:
							return response.AwaitingApprovalList;
						case -4:
							return response.RejectedList;
						case -5:
							return response.TotalList;
						case -6:
							return response.TransportationApprovedList;
						default:
							return null;
					}
				});
			}
			return Promise.resolve(null);
		};
	};

	FieldTripPage.prototype.openNavigationClick = function()
	{
		var self = this, navigationData,
			$content, $navigationContent = $(".navigation-container").addClass("mobile");
		$content = $("<!-- ko template:{ name:'workspace/navigation/menu',data:$data }--><!-- /ko -->");
		$navigationContent.append($content);

		navigationData = new TF.NavigationMenu();

		ko.applyBindings(ko.observable(navigationData), $content[0]);

	};

	FieldTripPage.prototype.dispose = function()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.dispose.call(self);
	};
})();