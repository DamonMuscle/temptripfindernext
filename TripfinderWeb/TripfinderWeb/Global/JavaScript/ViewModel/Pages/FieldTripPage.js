(function()
{
	createNamespace("TF.Page").FieldTripPage = FieldTripPage;

	function FieldTripPage()
	{
		var self = this, isLevel1User, authInfo = tf.authManager.authorizationInfo;
		self.type = "fieldtrip";
		self.pageType = "fieldtrips";
		TF.Page.BaseGridPage.apply(self, arguments);

		isLevel1User = !self.isAdmin && !authInfo.isAuthorizedFor("level4Administrator", "edit") && !authInfo.isAuthorizedFor("level3Administrator", "edit")
			&& !authInfo.isAuthorizedFor("level2Administrator", "edit") && authInfo.isAuthorizedFor("level1Requestor", "edit");
		if (!isLevel1User)
		{
			self.approveButton = true;
			self.declineButton = true;
		}
	}

	FieldTripPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	FieldTripPage.prototype.constructor = FieldTripPage;

	FieldTripPage.prototype.updateOptions = function()
	{
		var self = this;
		self.options.gridDefinition = tf.fieldTripGridDefinition.gridDefinition();
		self.options.showOmittedCount = false;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", "fieldtrip", "permission");
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
			if (selectGridFilterEntityId === -1 || selectGridFilterEntityId === -2)
			{
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "statistics", "fieldtripdepartingtrips")).then(function(response)
				{
					return response.Items[0];
				});
			}
			if (selectGridFilterEntityId === -3 || selectGridFilterEntityId === -4 ||
				selectGridFilterEntityId === -5 || selectGridFilterEntityId === -6)
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

	FieldTripPage.prototype.editFieldTripStatus = function(isApprove)
	{
		var self = this, selectedIds = self.searchGrid.getSelectedIds(), selectedRecords = self.searchGrid.getSelectedRecords(), showEditModal = function(name)
		{
			tf.modalManager.showModal(new TF.Modal.EditFieldTripStatusModalViewModel(selectedRecords, isApprove, name))
				.then(function(data)
				{
					if (data)
					{
						self.searchGrid.refreshClick();
						self.pageLevelViewModel.popupSuccessMessage((isApprove ? "Approved " : "Declined ") + (selectedRecords.length > 1 ? selectedRecords.length : "")
							+ " Trip" + (selectedRecords.length > 1 ? "s" : "") + (selectedRecords.length === 1 ? " [" + name + "]" : ""));
					}
				});
		};

		if (selectedIds.length === 0)
		{
			return;
		}

		if (selectedIds.length === 1)
		{
			tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "fieldtrip", "getEntityNames"), { data: selectedIds })
				.then(function(response)
				{
					showEditModal(response.Items[0]);
				});
		}
		else
		{
			showEditModal();
		}
	};

	FieldTripPage.prototype.approveClick = function(viewModel, e)
	{
		this.editFieldTripStatus(true);
	};

	FieldTripPage.prototype.declineClick = function(viewModel, e)
	{
		this.editFieldTripStatus(false);
	};

	FieldTripPage.prototype.dispose = function()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.dispose.call(self);
	};
})();