(function()
{
	createNamespace("TF.DetailView.FieldEditor").LocationFieldEditorHelper = LocationFieldEditorHelper;

	const GeoAssocaitedFields = ["GeoStreet", "GeoCity", "GeoCounty", "GeoZip"];
	const GeoWarningMessage = "With this change, this location will be ungeocoded.";

	function LocationFieldEditorHelper(detailView)
	{
		var self = this;
		TF.DetailView.FieldEditor.FieldEditorHelper.call(self, detailView);
	}

	LocationFieldEditorHelper.prototype = Object.create(TF.DetailView.FieldEditor.FieldEditorHelper.prototype);
	LocationFieldEditorHelper.prototype.constructor = LocationFieldEditorHelper;

	LocationFieldEditorHelper.prototype.showConfirmationMessages = function()
	{
		var self = this, count = 0,
			blackList = tf.dataTypeHelper.getEntityUpdateConfirmBlackList(self.dataType),
			modifiedFields = {},
			isGeocoded = self._detailView.recordEntity.Geocoded;

		if (!isGeocoded || self.isUpdatedByManualPin(self.editFieldList))
		{
			return Promise.resolve(true);
		}

		for (let key in self.editFieldList)
		{
			if (!blackList.includes(key))
			{
				modifiedFields[key] = self.editFieldList[key].value;
				count++;
			}
		}

		const msgStack = Object.keys(modifiedFields).reduce(function(acc, key)
		{
			if (!!modifiedFields[key] && GeoAssocaitedFields.includes(key))
			{
				return acc.concat({
					field: key,
					name: self.editFieldList[key].blockName,
					title: self.editFieldList[key].title,
					message: GeoWarningMessage
				});
			}

			return acc;
		},[]);

		return msgStack.length === 0 ? Promise.resolve(true) : tf.modalManager.showModal(
			new TF.DetailView.DataEditorSaveConfirmationModalViewModel({
				includeAll: msgStack.length >= count,
				messages: msgStack,
				revertFunc: self.revertChange.bind(self)
			})
		);
	};

	LocationFieldEditorHelper.prototype.createEntity = function(uniqueObjects)
	{
		var self = this;
		return TF.DetailView.FieldEditor.FieldEditorHelper.prototype.createEntity.call(self, uniqueObjects)
			.then(result =>
			{
				return self._messageExtend(result, true);
			});
	};

	LocationFieldEditorHelper.prototype.saveEntity = function(uniqueObjects)
	{
		var self = this;
		return TF.DetailView.FieldEditor.FieldEditorHelper.prototype.saveEntity.call(self, uniqueObjects)
			.then(result =>
			{
				return self._messageExtend(result, false);
			});
	};

	LocationFieldEditorHelper.prototype._messageExtend = function(result, isNew)
	{
		var self = this;

		// deal with cancelling the editing and trigger refresh call.
		// when school info confirmation cancelled or student disability option revert confirmation cancelled.
		if (!result || (result.entity === null && result.messages?.length === 0 && !result.success))
		{
			TF.DetailView.FieldEditor.FieldEditorHelper.prototype.refresh.call(this);
			let saveResponse = TF.DetailView.FieldEditor.FieldEditorHelper.prototype.generateTemplateResponse();
			let recordEntity = $.extend(true, {}, self._detailView.recordEntity);
			saveResponse.entity = Object.assign({}, recordEntity);
			saveResponse.cancel = true;
			return saveResponse;
		}

		if (isNew || !self._detailView.recordEntity.Xcoord || (result.entity && (self._detailView.recordEntity.GeoStreet != result.entity.GeoStreet || self._detailView.recordEntity.GeoZip != result.entity.GeoZip)))
		{
			return TF.AutomationHelper.getSetting().then(setting => 
			{
				if (setting.geocodeStudent && result.success)
				{
					if (result.entity.Xcoord != 0 && result.entity.Ycoord != 0)
					{
						result.successMessages = ["Student was successfully geocoded."];
					}
					else
					{
						result.warningMessages = ["Student failed to geocode."];
					}
				}

				return result;
			});
		}

		return result;
	};

	LocationFieldEditorHelper.prototype.isUpdatedByManualPin = function(editFieldList)
	{
		const manualPinAssocaitedFields = ["GeoConfidence", "XCoord", "YCoord"];
		let matchCount = 0;

		// increase counter if key matches in manualPinAssocaitedFields
		manualPinAssocaitedFields.forEach((key) => {
			if(!!editFieldList[key] && editFieldList[key].value)
				matchCount += 1;
		});

		// return true if editFieldList contains all manualPinAssocaitedFields fields
		return matchCount == manualPinAssocaitedFields.length;
	}
})();