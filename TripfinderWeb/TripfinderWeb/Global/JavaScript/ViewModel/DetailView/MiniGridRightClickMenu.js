(function()
{
	createNamespace("TF.DetailView").MiniGridRightClickMenu = MiniGridRightClickMenu;

	function MiniGridRightClickMenu(gridBlock, miniGridType, $target)
	{
		//this.detailView = detailView;
		this.gridBlock = gridBlock;
		this.miniGridType = miniGridType;
		this.detailviewType = this.gridBlock.detailView.gridType;
		this.$target = $target;
		this.editClicked = this.editClicked.bind(this);
		this.viewClicked = this.viewClicked.bind(this);
		this.disassociateClicked = this.disassociateClicked.bind(this);
		this.setPrimaryContact = this.setPrimaryContact.bind(this);
		this.setStopfinderContact = this.setStopfinderContact.bind(this);
		this.setContactRelationship = this.setContactRelationship.bind(this);
		this.selectedRow = this.gridBlock.grid.dataItem($target.closest("tr"));
		this.IsPrimaryChecked = (this.selectedRow.IsPrimary != null && this.selectedRow.IsPrimary)
		this.IsStopfinderChecked = (this.selectedRow.IsStopfinder != null && this.selectedRow.IsStopfinder)


		if(miniGridType === "contact")
		{
			this.obContactTypes = ko.observable([]);
			
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), tf.dataTypeHelper.getEndpoint("contacttypes")))
			.then(function(response)
			{
				var result = [{ID : null, Type : '(None)'}].concat(Array.sortBy(response.Items,'Type',false))
				this.obContactTypes(result);
			}.bind(this));
		}

	}

	MiniGridRightClickMenu.prototype = Object.create(TF.ContextMenu.BaseGeneralMenuViewModel.prototype);

	MiniGridRightClickMenu.prototype.constructor = MiniGridRightClickMenu;

	MiniGridRightClickMenu.prototype.editClicked = function(viewModel, e)
	{
		this.gridBlock.editMiniGridRecord(this.miniGridType, null, this.$target);
	}

	MiniGridRightClickMenu.prototype.viewClicked = function(viewModel, e)
	{
		var $tr = this.$target.closest("tr"),
			$grid = $tr.closest(".kendo-grid"),
			kendoGrid = $grid.data("kendoGrid"),
			recordId = kendoGrid.dataItem($tr).Id,
			gridType = this.miniGridType;

		const dataType = tf.dataTypeHelper.getAvailableDataTypes().find(d => d.key === gridType);
		const pageType = dataType ? dataType.pageType : gridType;

		const filterName = `${tf.dataTypeHelper.getDisplayNameByDataType(gridType)} (Selected Records)`;

		sessionStorage.setItem("openRelated", JSON.stringify(
		{
			"gridType": gridType,
			"type": "detailview",
			"pageType": pageType,
			"filterName": filterName,
			"selectedIds": [recordId],
			"openDetailView": true
		}));

		const location = "#/?pagetype=" + pageType;
		const redirectWindow = window.open(location, "_blank");
		redirectWindow.name = "new-pageWindow_" + $.now();

		sessionStorage.removeItem("openRelated");
	}

	MiniGridRightClickMenu.prototype.disassociateClicked = function(viewModel, e)
	{
		this.gridBlock.kendoGridActions[this.miniGridType].delete(null, this.$target);
	}

	MiniGridRightClickMenu.prototype.setPrimaryContact = function(viewModel, e)
	{
		let self = this,
			contact = this.selectedRow;
		let originDataSource = self.gridBlock.grid.dataSource.data(),
			curPrimary = originDataSource.filter(r => r.IsPrimary && (r.Id !== contact.Id));
		tmpvalue = !contact.IsPrimary;
		let setPrimary = function()
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "recordcontacts"), {
				paramData: {
					"databaseID": contact.DBID,
					"@filter": `eq(ContactID,${contact.Id})&eq(DataTypeID,${tf.dataTypeHelper.getIdByName('student')})&eq(RecordID,${self.gridBlock.recordId})`,
					"@fields": "ID"
				}
			}).then(function(response)
			{
				if (response.FilteredRecordCount > 0)
				{
					let recordContactId = response.Items[0].ID;
					return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'recordcontacts'), {
						data: [{
							Id: recordContactId,
							Op: "replace",
							Path: "IsPrimary",
							Value: tmpvalue
						}]
					}).then(function(response)
					{
						var responsedata = response.Items[0]
						let curContactId = responsedata && responsedata.ContactID;
						if (!curContactId) return;
						originDataSource.forEach(element =>
						{
							if (element.Id === curContactId)
							{
								element.IsPrimary = tmpvalue;
							} else
							{
								element.IsPrimary = null;
							}
						});
						if (self.gridBlock.grid.dataSource.hasChanges())
						{
							self.gridBlock.grid.dataSource.data(originDataSource);
						}
						PubSub.publish("contactChange", {});
						self.gridBlock.detailView.pageLevelViewModel.popupSuccessMessage("The updates have been saved successfully.");
					})
				}
			});
		}

		if (curPrimary.length > 0)
		{
			return tf.promiseBootbox.yesNo("Primary Contact already exists. Do you want to continue?", "Confirmation Message").then(function(yesNo)
			{
				if (yesNo)
				{
					return setPrimary();
				}
			})
		}
		else
		{
			return setPrimary();
		}

	}


	MiniGridRightClickMenu.prototype.setStopfinderContact = function(viewModel, e)
	{
		let self = this,
			contact = this.selectedRow;
		tmpvalue = !contact.IsStopfinder;
		let originDataSource = self.gridBlock.grid.dataSource.data();
		let updateStopfinder = function()
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "recordcontacts"), {
				paramData: {
					"databaseID": contact.DBID,
					"@filter": `eq(ContactID,${contact.Id})&eq(DataTypeID,${tf.dataTypeHelper.getIdByName('student')})&eq(RecordID,${self.gridBlock.recordId})`,
					"@fields": "ID"
				}
			}).then(function(response)
			{
				if (response.FilteredRecordCount > 0)
				{
					let recordContactId = response.Items[0].ID;
					return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'recordcontacts'), {
						data: [{
							Id: recordContactId,
							Op: "replace",
							Path: "IsStopfinder",
							Value: tmpvalue
						}]
					}).then(function(response)
					{
						var responsedata = response.Items[0]
						let curContactId = responsedata && responsedata.ContactID;
						if (!curContactId) return;
						originDataSource.forEach(element =>
						{
							if (element.Id === curContactId)
							{
								element.IsStopfinder = tmpvalue;
							}
						});
						if (self.gridBlock.grid.dataSource.hasChanges())
						{
							self.gridBlock.grid.dataSource.data(originDataSource);
						}

						self.gridBlock.detailView.pageLevelViewModel.popupSuccessMessage("The updates have been saved successfully.");
					})
				}
			});
		}

		return updateStopfinder();

	}

	MiniGridRightClickMenu.prototype.setContactRelationship = function(data,event)
	{
		//console.log(data)
		let self = this,
		contact = this.selectedRow;
		tmpvalue = !contact.IsStopfinder;
		let originDataSource = self.gridBlock.grid.dataSource.data();
		let updateContactRelationship = function()
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "recordcontacts"), {
				paramData: {
					"databaseID": contact.DBID,
					"@filter": `eq(ContactID,${contact.Id})&eq(DataTypeID,${tf.dataTypeHelper.getId(self.detailviewType)})&eq(RecordID,${self.gridBlock.recordId})`,
					"@fields": "ID"
				}
			}).then(function(response)
			{
				if (response.FilteredRecordCount > 0)
				{
					let recordContactId = response.Items[0].ID;
					return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'recordcontacts'), {
						data: [{
							Id: recordContactId,
							Op: "replace",
							Path: "ContactTypeID",
							Value: data.ID
						}]
					}).then(function(response)
					{
						var responsedata = response.Items[0]
						let curContactId = responsedata && responsedata.ContactID;
						if (!curContactId) return;
						originDataSource.forEach(element =>
						{
							if (element.Id === curContactId)
							{
								element.ContactType = data.ID ? data.Type : '';
							}
						});
						if (self.gridBlock.grid.dataSource.hasChanges())
						{
							self.gridBlock.grid.dataSource.data(originDataSource);
						}

						self.gridBlock.detailView.pageLevelViewModel.popupSuccessMessage("The updates have been saved successfully.");
					})
				}
			});
		}

		return updateContactRelationship();
	}
})();