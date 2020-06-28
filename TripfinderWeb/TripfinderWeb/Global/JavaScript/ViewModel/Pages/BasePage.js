(function()
{
	createNamespace("TF.Page").BasePage = BasePage;

	function BasePage()
	{
		var self = this;
		self.obShowDetailPanel = ko.observable(false);
		self.obShowFieldTripDEPanel = ko.observable(false);
		self.detailView = null;
		self.fieldTripDataEntry = null;

		self.massUpdateButton = false;
		self.changeStatusButton = false;
		self.cancelButton = false;
		self.copyButton = false;

		self.isAdmin = tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isAuthorizedFor("transportationAdministrator", "edit");
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		self.openSelectedClick = self.openSelectedClick.bind(self);
	}

	BasePage.prototype.constructor = BasePage;

	BasePage.prototype.init = function(model, element)
	{
	};

	BasePage.prototype.onCtrlSPress = function(e, keyCombination)
	{
		e.preventDefault();
		this.hideBlukMenu();
		if (this.disableShortCutKey == true)
		{
			return;
		}
		this.saveAsClick();
	};

	BasePage.prototype.onCtrlCPress = function(e, keyCombination)
	{
		e.preventDefault();
		this.hideBlukMenu();
		if (this.disableShortCutKey == true)
		{
			return;
		}
		this.copyToClipboardClick();
	};

	/**
	 * Hide bluk menu when the hot key was triggered.
	 * @returns {void} 
	 */
	BasePage.prototype.hideBlukMenu = function()
	{
		if (this.bulkMenu && !this.bulkMenu.disposed)
		{
			this.bulkMenu.$container.trigger("contextMenuClose");
		}
	}

	BasePage.prototype.clearRelatedRightPage = function(type)
	{
		var self = this;

		switch (type)
		{
			case "detailview":
				self.detailView = null;
				self.obShowDetailPanel(false);
				break;
			case "fieldtripde":
				self.fieldTripDataEntry = null;
				self.obShowFieldTripDEPanel(false);
				break;
			default:
				self.detailView = null;
				self.fieldTripDataEntry = null;
				self.obShowFieldTripDEPanel(false);
				self.obShowDetailPanel(false);
				break;
		}
	};

	BasePage.prototype.showDetails = function()
	{
		this.showDetailsClick();
	};

	BasePage.prototype.showDetailsClick = function(rowSelectedId)
	{
		var self = this, selectedId;
		if (rowSelectedId)
		{
			selectedId = rowSelectedId;
		}
		else
		{
			var selectedIds = self.searchGrid.getSelectedIds();
			if (!selectedIds || selectedIds.length <= 0)
			{
				return;
			}
			selectedId = selectedIds[0];
		}
		if (self.detailView && self.detailView.isReadMode() && self.obShowDetailPanel())
		{
			self.detailView.showDetailViewById(selectedId);
		}
		else
		{
			ga('send', 'event', 'Area', 'Details');
			//self.detailView = new TF.DetailView.DetailViewViewModel(selectedId);
			//self.detailView = new TF.DetailView.DetailViewViewModel(self.options.ids, self.type, self.routeState, self.pageLevelViewModel, true, null);
			self.detailView = new TF.DetailView.DetailViewViewModel(selectedId, self.pageLevelViewModel, false, {});
			self.detailView.onCloseDetailEvent.subscribe(
				self.closeDetailClick.bind(self)
			);
			if (TF.isMobileDevice)
			{
				tf.pageManager.resizablePage.setLeftPage("workspace/detailview/detailview", self.detailView);
			}
			else
			{
				tf.pageManager.resizablePage.setRightPage("workspace/detailview/detailview", self.detailView);
			}

		}
		self.obShowDetailPanel(true);
	};

	BasePage.prototype.closeDetailClick = function(filter)
	{
		var self = this;
		if (filter === true || !TF.isMobileDevice)
		{
			tf.pageManager.resizablePage.closeRightPage();
		}
		else
		{
			self.obShowDetailPanel(false);
			tf.pageManager.resizablePage.clearLeftOtherContent();
			self.detailView.dispose();
			self.detailView = null;
			if ($(".kendoscheduler").length > 0)
			{
				$(".kendoscheduler").getKendoScheduler().refresh();
			}
		}
	};

	BasePage.prototype.editClick = function(viewModel, e)
	{
		var self = this, view, selectedIds, gridVM = viewModel ? viewModel.gridViewModel : self;
		if (gridVM.isGridPage)
		{
			selectedIds = self.searchGrid.getSelectedIds();
		} else
		{
			selectedIds = gridVM.fieldTripId;
		}

		if (selectedIds.length === 0)
		{
			return;
		}

		view = {
			id: selectedIds[0],
			documentType: "DataEntry",
			type: "fieldtrip",
		};
		self.fieldTripDataEntry = new TF.DataEntry.FieldTripDataEntryViewModel(selectedIds, view);
		tf.pageManager.resizablePage.setRightPage("workspace/dataentry/base", self.fieldTripDataEntry);
		tf.pageManager.obFieldTripEditPage(self.fieldTripDataEntry);
		self.obShowFieldTripDEPanel(true);
	};

	BasePage.prototype.getStatusChangedMessage = function(selectedRecords)
	{
		var msg = "",
			stageId = selectedRecords[0].FieldTripStageId;
		switch (stageId)
		{
			case TF.FieldTripStageEnum.level1RequestSubmitted:
				msg += "Submitted ";
				break;
			case TF.FieldTripStageEnum.level2RequestDeclined:
			case TF.FieldTripStageEnum.level3RequestDeclined:
			case TF.FieldTripStageEnum.level4RequestDeclined:
			case TF.FieldTripStageEnum.DeclinedByTransportation:
				msg += "Declined ";
				break;
			case TF.FieldTripStageEnum.level2RequestApproved:
			case TF.FieldTripStageEnum.level3RequestApproved:
			case TF.FieldTripStageEnum.level4RequestApproved:
			case TF.FieldTripStageEnum.TransportationApproved:
				msg += "Approved ";
				break;
			case TF.FieldTripStageEnum.RequestCanceled:
				msg += "Canceled ";
				break;
			case TF.FieldTripStageEnum.RequestCompleted:
				msg += "Completed ";
				break;
		}
		msg += selectedRecords.length > 1 ? (selectedRecords.length + " " + tf.applicationTerm.getApplicationTermPluralByName("Trips")) : selectedRecords[0].Name;

		return msg;
	};

	BasePage.prototype.showHideColumns = function(viewModel, e)
	{
		var self = this;
		self.searchGrid.addRemoveColumnClick(viewModel, e);
	};

	BasePage.prototype._copySelectedRecords = function(e, selectedIds)
	{
		var self = this;
		var kendoGrid = self.searchGrid;
		return kendoGrid.getIdsWithCurrentFiltering(true)
			.then(function(ids)
			{
				var gridLayoutExtendedEntity = kendoGrid._obCurrentGridLayoutExtendedDataModel().toData();
				gridLayoutExtendedEntity.LayoutColumns = kendoGrid._obSelectedColumns();

				var url = pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint(kendoGrid.options.gridType));

				var options = JSON.parse(JSON.stringify(kendoGrid.searchOption));
				options.data.idFilter.IncludeOnly = selectedIds;
				if (kendoGrid.options.gridType === "busfinderhistorical")
					self.setRequestOption(options);

				var queryPromise = tf.promiseAjax["post"](url, options);
				return queryPromise
					.then(function(data)
					{
						var strRecords = getStringOfRecords(data.Items, gridLayoutExtendedEntity.LayoutColumns);

						tf.modalManager.showModal(
							new TF.Modal.CopyDataModalViewModel(strRecords, function()
							{
								$(".tfmodal-container").css('visibility', 'visible');
								tf.loadingIndicator.tryHide();
								$("#loadingindicator .subtitle-text").text('Loading');
							})
						)
							.then(function()
							{

							}.bind(this));

						$(".tfmodal-container").css('visibility', 'hidden');
						return Promise.resolve(true);
					}, function(data)
					{
						tf.loadingIndicator.tryHide();
						if (self.copyRetryCount >= 3)
						{
							tf.promiseBootbox.alert("Data cannot be copied.", "Alert")
								.then(function(result)
								{

								});
							return;
						}
						tf.promiseBootbox.yesNo("Data cannot be retrieved. Would you like to retry?", "Confirmation Message")
							.then(function(result)
							{
								if (result)
								{
									self.copyRetryCount = self.copyRetryCount + 1;
									self._copySelectedRecords(e, selectedIds);
								}
							});
					});
			});
	};

	BasePage.prototype.copyToClipboardClick = function(viewModel, e)
	{
		var self = this;
		self.copyRetryCount = 0;
		var selectedIds = self.searchGrid.getSelectedIds();
		if (selectedIds.length > 2000)
		{
			return self.showConfirmMessage(e, selectedIds);
		}
		else if (selectedIds.length === 0)
		{
			self.searchGrid.getIdsWithCurrentFiltering().then(function(ids)
			{
				if (ids.length > 2000)
				{
					return self.showConfirmMessage(e, selectedIds);
				}
				else if (ids.length > 0)
				{
					self._copySelectedRecords(e, selectedIds);
				}
			});
		}
		else
		{
			self._copySelectedRecords(e, selectedIds);
		}
	};

	function getStringOfRecords(records, columns)
	{
		var strRecords = "";
		for (var i = 0; i < records.length; i++)
		{
			var strRecord = "", theRecord = records[i];
			for (var j = 0; j < columns.length; j++)
			{
				var columnValue = theRecord[columns[j].FieldName]
				strRecord += (columnValue == null ? "" : columnValue) + "\t";
			}
			strRecords += strRecord + "\n";
		}
		return strRecords;
	}

	BasePage.prototype.showConfirmMessage = function(e, selectedIds)
	{
		var self = this;
		return tf.promiseBootbox.yesNo(
			{
				message: "You have requested to Copy " + ((self.searchGrid.allIds.length === selectedIds.length || selectedIds.length === 0) ? "All" : selectedIds.length) + " records. This may take a long time to complete. To reduce the amount of time this takes, we recommend reducing the number of grid columns that you have displayed and/or the number of records that you have selected.\n\nAre you sure you would like to copy these records?",
				backdrop: true,
				title: "Confirmation Message",
				closeButton: true
			})
			.then(function(result)
			{
				if (result == true)
				{
					self._copySelectedRecords(e, selectedIds);
				}
			});
	};

	BasePage.prototype.massUpdateClick = function()
	{
		var self = this, selectedIds = self.searchGrid.getSelectedIds(), gridType = self.searchGrid._gridType;
		return tf.modalManager.showModal(new TF.Modal.Grid.GlobalReplaceSettingsModalViewModel(selectedIds.length, gridType)).then(function(result)
		{
			if (!result)
			{
				return;
			}

			var recordIds = [], field, newValue, relationshipKey;
			if (result.specifyRecords == "selected")
			{
				recordIds = selectedIds;
			}
			else
			{
				recordIds = self.searchGrid.obAllIds();
			}

			field = result.field;
			newValue = result.newValue;
			relationshipKey = result.relationshipKey;
			if (result.replaceType == "Standard")
			{
				return self._globalReplaceConfirm(recordIds).then(function(yesOrNo)
				{
					if (yesOrNo)
					{
						self._globalReplace(recordIds, field, newValue, relationshipKey);
					}
				});
			}

			if (result.extended == 0 || result.extended == 1)
			{
				return tf.promiseBootbox.yesNo("This change may remove selected students from all their Trips. Do you wish to continue?", "Confirmation Message").then(function(yesOrNo)
				{
					if (yesOrNo)
					{
						var promise = null;
						if (result.extended == 0)
						{
							// Remove all additional requirements
							promise = tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "StudentRequirements"), {
								paramData: {
									"@filter": "in(StudentId," + recordIds.join(",") + ")&eq(Type,1)",
									dbid: tf.datasourceManager.databaseId
								}
							});
						}

						if (promise)
						{
							promise.then(function()
							{
								self.searchGrid.refresh();
								tf.promiseBootbox.alert("Global Replace success");
							});
						}
					}
				});
			}
		});
	};

	BasePage.prototype._globalReplaceConfirm = function(recordIds)
	{
		return tf.promiseBootbox.yesNo(String.format('Are you sure you want to global replace {0} {1}? These changes are permanent.', recordIds.length, recordIds.length === 1 ? 'record' : 'records'), "Confirmation Message");
	};

	BasePage.prototype.dateCheck = function(fieldtrips, field, newValue)
	{
		var result = $.grep(fieldtrips, function(trip)
		{
			if ("DepartDateTime" === field)
			{
				if (!trip.EstimatedReturnDateTime)
				{
					return true;
				}
				return moment(newValue) <= moment(trip.EstimatedReturnDateTime);
			}
			else if ("EstimatedReturnDateTime" === field)
			{
				if (!trip.DepartDateTime)
				{
					return true;
				}
				return moment(newValue) >= moment(trip.DepartDateTime);
			}
			else
			{
				return true;
			}
		});
		return result.map(function(item) { return item.Id });
	};

	BasePage.prototype._globalReplace = function(recordIds, field, newValue, relationshipKey)
	{
		var self = this, data = [], paramData = {
			"@updateResult": true
		}, fields = ["Id", "FieldTripStageId"];

		if ("DepartDateTime" === field)
		{
			fields.push("EstimatedReturnDateTime");
		}
		else if ("EstimatedReturnDateTime" === field)
		{
			fields.push("DepartDateTime");
		}

		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search/fieldtrips"), {
			paramData: { take: 100000, skip: 0 },
			data: {
				fields: fields,
				filterClause: "",
				filterSet: null,
				idFilter: { IncludeOnly: recordIds, ExcludeAny: [] },
				sortItems: [{ Name: "Id", isAscending: "asc", Direction: "Ascending" }]
			}
		}).then(function(result)
		{
			var editableFieldtrips = tf.helpers.fieldTripAuthHelper.getEditableFieldTrips(result.Items);

			var ids = editableFieldtrips.map(function(item) { return item.Id });
			var failedIds = $.grep(recordIds, function(id) { return ids.indexOf(id) < 0 });

			var validDateIds = self.dateCheck(editableFieldtrips, field, newValue);
			var invalidDateIds = $.grep(ids, function(id) { return validDateIds.indexOf(id) < 0 });

			validDateIds.forEach(function(id)
			{
				if (relationshipKey)
				{
					data.push({ "Id": id, "op": "relationship", "path": "/" + field, "value": typeof newValue == "string" ? newValue : JSON.stringify(newValue) });
				}
				else
				{
					data.push({ "Id": id, "op": "replace", "path": "/" + field, "value": newValue.toString() });
				}
			});
			if (relationshipKey)
			{
				paramData["@relationships"] = relationshipKey;
			}
			return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(), "fieldtrips"), {
				paramData: paramData,
				data: data,
			}).then(function(result)
			{
				if (result && result.Items && result.Items[0])
				{
					self.searchGrid.refresh();
					result.Items[0].FailedIds = result.Items[0].FailedIds.concat(failedIds);
					result.Items[0].InvalidDateIds = invalidDateIds;
					tf.modalManager.showModal(new TF.Modal.Grid.GlobalReplaceResultsModalViewModel(result.Items[0], self.searchGrid._gridType));
				}
			});
		});
	};

	BasePage.prototype.saveAsClick = function()
	{
		var self = this, selectedIds = self.searchGrid.getSelectedIds();

		if (selectedIds.length === 0 && this.searchGrid.kendoGrid.dataSource._total > 0)
		{
			TF.Grid.LightKendoGrid.prototype.getIdsWithCurrentFiltering.call(this.searchGrid).then(function(data)
			{
				selectedIds = data;
				self.searchGrid.exportCurrentGrid(selectedIds);
			});
		}
		else
		{
			self.searchGrid.exportCurrentGrid(selectedIds);
		}
	};

	BasePage.prototype.openSelectedClick = function(viewModel, e)
	{
		var redirectWindow = window.open('', '_blank');
		redirectWindow.blur();
		this._openSelected(this.pageType, e, redirectWindow);
	};

	BasePage.prototype._openSelected = function(gridType, e, redirectWindow)
	{
		var selectedIds = this.searchGrid.getSelectedIds();
		//the filter will sticky once open a new grid, so save the sticky information in DB
		var storageFilterDataKey = "grid.currentfilter." + gridType + ".id";
		var filterName = $(e.currentTarget).find(".menu-label").text().trim() + ' (Selected Records)';
		if (selectedIds.length > 0)
		{
			// TODO-temp
			Promise.all([
				TF.Grid.FilterHelper.clearQuickFilter(gridType),
				tf.storageManager.save("grid.currentlayout." + gridType + ".id", ''),
				tf.storageManager.save(storageFilterDataKey,
					{
						"filteredIds": selectedIds,
						"filterName": filterName
					})
			]).then(function()
			{
				redirectWindow.location = "#/?pagetype=" + this.pageType, redirectWindow.name = "new-pageWindow_" + $.now();

			}.bind(this));
		}
		else
		{
			this.searchGrid.gridAlert.show(
				{
					message: "no data selected!"
				});
		}
	};

	BasePage.prototype.dispose = function()
	{
		var self = this;

		self.pageLevelViewModel.dispose();
	};
})();
