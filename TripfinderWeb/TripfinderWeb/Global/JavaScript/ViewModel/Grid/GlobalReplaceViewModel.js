(function()
{
	createNamespace("TF.Grid").GlobalReplaceViewModel = GlobalReplaceViewModel;

	GlobalReplaceViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	GlobalReplaceViewModel.prototype.constructor = GlobalReplaceViewModel;

	function GlobalReplaceViewModel(entityType, ids)
	{
		this.removeReplaceItemClick = this.removeReplaceItemClick.bind(this);
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		this._reInitialValidator = this._reInitialValidator.bind(this);
		this.addFieldClick = this.addFieldClick.bind(this);
		this._entityType = entityType;
		this._ids = ids;
		this.obReplaceItems = ko.observableArray([]);
		this.obReplaceItems.subscribe(this._reInitialValidator);
		this._addReplaceItem();
		this.obFields = ko.observableArray([]);
		this.obRemoveFieldButtonEnabled = ko.computed(this._removeFieldButtonEnabledComputer, this);
		this.loadEntityDefinition();
		this.loadEntityData();
	}

	GlobalReplaceViewModel.prototype.removeReplaceItemClick = function(obReplaceItem)
	{
		this.obReplaceItems.remove(obReplaceItem);
	};

	GlobalReplaceViewModel.prototype._removeFieldButtonEnabledComputer = function()
	{
		return !(this.obReplaceItems().length == 1);
	};

	GlobalReplaceViewModel.prototype.loadEntityDefinition = function()
	{
		var p1 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "globalreplacefielddefinition", this._entityType))
			.then(function(apiResponse)
			{
				this._globalreplacefielddefinition = apiResponse.Items[0].Fields;
			}.bind(this))
			.catch(function(apiResponse)
			{
				if (apiResponse.StatusCode !== 404)
				{
					console.log(apiResponse.Message);
				}
			})

		var userDefinedFieldUtil = new TF.UserDefinedFieldUtil(this._entityType);
		Promise.all([p1, userDefinedFieldUtil.loadUserDefinedLabel()]).
			then(function(userDefinedFieldUtil)
			{
				if (this._globalreplacefielddefinition !== undefined)
				{
					var fields = userDefinedFieldUtil.mergeUserDefinedLabel(this._globalreplacefielddefinition).sort(function(a, b) { return a.DisplayName.localeCompare(b.DisplayName); })
					fields.unshift({ DisplayName: " " })
					this.obFields(fields);
				}
			}.bind(this, userDefinedFieldUtil));
	};

	GlobalReplaceViewModel.prototype.loadEntityData = function()
	{
		if (this._entityType != 'student')
		{
			return;
		}
		tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), this._entityType, "ids"), { data: this._ids })
			.then(function(apiResponse)
			{
				var entityData = apiResponse.Items;
				var tripIds = { dlyPuTripId: undefined, dlyDoTripId: undefined, dlyPuTranTripId: undefined, dlyDoTranTripId: undefined };
				for (var i in entityData)
				{
					tripIds.dlyPuTripId = tripIds.dlyPuTripId == undefined ? entityData[i].DlyPuTripId : tripIds.dlyPuTripId == entityData[i].DlyPuTripId ? entityData[i].DlyPuTripId : "";
					tripIds.dlyDoTripId = tripIds.dlyDoTripId == undefined ? entityData[i].DlyDoTripId : tripIds.dlyDoTripId == entityData[i].DlyDoTripId ? entityData[i].DlyDoTripId : "";
					tripIds.dlyPuTranTripId = tripIds.dlyPuTranTripId == undefined ? entityData[i].DlyPuTranTripId : tripIds.dlyPuTranTripId == entityData[i].DlyPuTranTripId ? entityData[i].DlyPuTranTripId : "";
					tripIds.dlyDoTranTripId = tripIds.dlyDoTranTripId == undefined ? entityData[i].DlyDoTranTripId : tripIds.dlyDoTranTripId == entityData[i].DlyDoTranTripId ? entityData[i].DlyDoTranTripId : "";
				}
				this._tripIds = tripIds;
			}.bind(this))
	}

	GlobalReplaceViewModel.prototype.addFieldClick = function()
	{
		this._addReplaceItem();
	};

	GlobalReplaceViewModel.prototype._addReplaceItem = function()
	{
		var replaceItem = new ReplaceItem();
		replaceItem.typeCodeChange.subscribe(this._reInitialValidator);
		this.obReplaceItems.push(replaceItem);
	};

	GlobalReplaceViewModel.prototype.dispose = function()
	{
		this._destroyBootstrapValidator();
	};

	GlobalReplaceViewModel.prototype._reInitialValidator = function()
	{
		this._destroyBootstrapValidator();
		if (this.pageLevelViewModel)
		{
			this.pageLevelViewModel.obValidationErrors().length = 0;
		}
		if (this.validationMessage)
		{
			this.validationMessage.find(".edit-error").remove();
		}
		setTimeout(this._bindBootstrapValidator.bind(this), 0);
	};

	GlobalReplaceViewModel.prototype.verify = function()
	{
		if (this._entityType != 'student')
		{
			return Promise.resolve("");
		}

		var dlyPuTripId = this._tripIds.dlyPuTripId,
			dlyDoTripId = this._tripIds.dlyDoTripId,
			dlyPuTranTripId = this._tripIds.dlyPuTranTripId,
			dlyDoTranTripId = this._tripIds.dlyDoTranTripId,
			replaceItems = this.obReplaceItems();

		for (var i in replaceItems)
		{
			switch (replaceItems[i].replaceRequest.FieldName)
			{
				case "DlyPuTripId":
					dlyPuTripId = replaceItems[i].replaceRequest.UpdateValue;
					break;
				case "DlyDoTripId":
					dlyDoTripId = replaceItems[i].replaceRequest.UpdateValue;
					break;
				case "DlyPuTranTripId":
					dlyPuTranTripId = replaceItems[i].replaceRequest.UpdateValue;
					break;
				case "DlyDoTranTripId":
					dlyDoTranTripId = replaceItems[i].replaceRequest.UpdateValue;
					break;
			}
		}
		var promiseAll = [];
		for (var i in replaceItems)
		{
			var tripId = undefined, tripName = undefined;
			switch (replaceItems[i].replaceRequest.FieldName)
			{
				case "DlyPuTripStop":
					tripId = dlyPuTripId;
					break;
				case "DlyDoTripStop":
					tripId = dlyDoTripId;
					break;
				case "DlyPuTranTripStop":
					tripId = dlyPuTranTripId;
					break;
				case "DlyDoTranTripStop":
					tripId = dlyDoTranTripId;
					break;
				case "DlyPuTripId":
					if (dlyPuTripId != this._tripIds.dlyPuTripId)
						tripName = replaceItems[i].replaceRequest.FieldName;
					break;
				case "DlyDoTripId":
					if (dlyDoTripId != this._tripIds.dlyDoTripId)
						tripName = replaceItems[i].replaceRequest.FieldName;
					break;
				case "DlyPuTranTripId":
					if (dlyPuTranTripId != this._tripIds.dlyPuTranTripId)
						tripName = replaceItems[i].replaceRequest.FieldName;
					break;
				case "DlyDoTranTripId":
					if (dlyDoTranTripId != this._tripIds.dlyDoTranTripId)
						tripName = replaceItems[i].replaceRequest.FieldName;
					break;
			}
			if (tripId)
			{
				promiseAll.push(tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "tripstop", "trip", tripId))
					.then(function(apiResponse)
					{
						var tripStopEntity = $.grep(apiResponse.Items, function(d) { return d.Id == this.valueOf(); }.bind(this));
						return tripStopEntity.length == 0 ? "wrongTripStop" : "";
					}.bind(replaceItems[i].replaceRequest.UpdateValue)));
			}
			else if (tripName)
			{
				promiseAll.push(Promise.resolve("wrongTrip"));
			}
		}
		return Promise.all(promiseAll);
	}

	GlobalReplaceViewModel.prototype.sendRequest = function()
	{
		var self = this;

		var replaceRequests = [];
		var replaceItems = self.obReplaceItems();
		for (var i = 0; i < replaceItems.length; i++)
		{
			if (replaceItems[i].replaceRequest)
			{
				replaceRequests.push(replaceItems[i].replaceRequest);
			}
		}
		if (replaceRequests.length == 0)
		{
			return Promise.resolve(false);
		}

		var selectCount = i18n.t('grid.globalReplace.record', { count: self._ids.length });
		var globalReplaceInfo = i18n.t("grid.globalReplace.globalReplaceInfo", { selectCount: selectCount });
		return tf.promiseBootbox.yesNo(globalReplaceInfo, "Confirmation Message")
			.then(function(result)
			{
				if (result == true)
				{
					var request = {
						ReplaceRequests: replaceRequests,
						Ids: self._ids
					}

					return self.verify().then(function(result)
					{
						var wrongMessage = undefined;
						if (result.indexOf("wrongTripStop") != -1 && result.indexOf("wrongTrip") != -1)
						{
							wrongMessage = "The Trip you have selected does not have the TripStop you have selected.";
						}
						else if (result.indexOf("wrongTripStop") != -1)
						{
							wrongMessage = "The TripStop you have selected was not found in the Trip which the student(s) has been assigned.";
						}
						else if (result.indexOf("wrongTrip") != -1)
						{
							wrongMessage = "The Trip you have selected does not have the TripStop which the student(s) has been assigned.";
						}
						if (wrongMessage)
						{
							return tf.promiseBootbox.alert(wrongMessage, "Cannot Replace")
								.then(function()
								{
									return false;
								});
						}
						else
						{
							return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "globalreplace", self._entityType), {
								data: request
							})
								.then(function(apiResponse)
								{
									var affectRows = apiResponse.Items[0];
									var recordStr = "Record";
									var hasStr = "has";
									if (affectRows > 1)
									{
										recordStr = "Records";
										hasStr = "have"
									}
									tf.promiseBootbox.alert(affectRows + " " + recordStr.toLowerCase() + " " + hasStr + " successfully been updated.", recordStr + " Successfully Updated");
									return affectRows;
								})
								.catch(function()
								{
									throw false;
								})
						}
					});
				}
				else
				{
					return Promise.resolve(false);
				}
			})
	};

	GlobalReplaceViewModel.prototype.apply = function()
	{
		return this.pageLevelViewModel.saveValidate().then(function(data)
		{
			if (data)
			{
				this.sendRequest().then(function(affectRows)
				{
					return affectRows;
				});
			}
		}.bind(this));
	};

	GlobalReplaceViewModel.prototype._destroyBootstrapValidator = function()
	{
		this.pageLevelViewModel.dispose();
	};

	GlobalReplaceViewModel.prototype._bindBootstrapValidator = function()
	{
		var $continer = $('.tf-global-replace'), isValidating = false, self = this;
		$continer.bootstrapValidator({
			message: 'This value is not valid',
			fields: {
				String: {
					trigger: "blur change",
					validators: {
						notEmpty: {
							message: 'required'
						}
					}
				},
				Phone: {
					trigger: "blur change",
					validators: {
						notEmpty: {
							message: 'required'
						},
						phone: {
							message: 'The input is not a valid phone number',
							country: tfRegion
						}
					}
				},
				Email: {
					trigger: "blur change",
					validators: {
						notEmpty: {
							message: 'required'
						},
						emailAddress: {
							message: 'The input is not a valid email address'
						}
					}
				},
				ZipCode: {
					trigger: "blur change",
					validators: {
						notEmpty: {
							message: 'required'
						},
						zipCode: {
							message: 'The input is not a valid zip code ',
							country: tfRegion
						}
					}
				},
				Url: {
					trigger: "blur change",
					validators: {
						notEmpty: {
							message: 'required'
						},
						uri: {
							message: 'The input is not a valid url'
						}
					}
				},
				Date: {
					trigger: "blur change",
					validators: {
						notEmpty: {
							message: 'required'
						},
						date: {
							message: 'Invalid Date'
						}
					}
				}
			}
		}).on('success.field.bv', function(e, data)
		{
			if (!isValidating)
			{
				isValidating = true;
				self.pageLevelViewModel.saveValidate(data.element);
				isValidating = false;
			}
		});

		this.pageLevelViewModel.load($continer.data("bootstrapValidator"));
	};

	function ReplaceItem()
	{
		this.obValue = ko.observable("");
		this.obType = ko.observable("Disabled");
		this.obAttributes = ko.observable({ type: "Disabled", class: "form-control", dataList: undefined, fieldName: undefined });
		this.replaceChange = this.replaceChange.bind(this);
		this.valueChange = this.valueChange.bind(this);
		this.obSelectedField = ko.observable(null);
		this.obValue.subscribe(this.valueChange);

		this.typeCodeChange = new TF.Events.Event();

		this.replaceRequest = null;

		//drop down list
		this.obSelectedFieldText = ko.observable();
		this.obSelectedFieldText.subscribe(this.replaceChange, this);
	}

	ReplaceItem.prototype.replaceChange = function()
	{
		var field = this.obSelectedField();
		if (field && field.FieldName)
		{
			this.getDataList(field.FieldName)
				.then(function(datalist)
				{
					this.obType(field.TypeCode);
					this.typeCodeChange.notify();
					this.obAttributes({ name: field.TypeCode, type: field.TypeCode, class: "form-control", dataList: datalist, fieldName: field.FieldName });
					if (field.TypeCode == "String")
					{
						this.replaceRequest = new ReplaceRequest(field.FieldName, this.obValue());
					}
					else
					{
						if (this.obValue())
						{
							this.replaceRequest = new ReplaceRequest(field.FieldName, this.obValue());
						}
						else
						{
							this.replaceRequest = null;
						}
					}
				}.bind(this));
		}
		else
		{
			this.obAttributes({ type: "Disabled", class: "form-control", dataList: undefined, fieldName: undefined });
			this.replaceRequest = null;
		}
	};

	ReplaceItem.prototype.valueChange = function()
	{
		var field = this.obSelectedField();
		if (field)
		{
			if (field.TypeCode == "String")
			{
				this.replaceRequest = new ReplaceRequest(field.FieldName, this.obValue());
			}
			else
			{
				if (this.obValue())
				{
					this.replaceRequest = new ReplaceRequest(field.FieldName, this.obValue());
				}
				else
				{
					this.replaceRequest = null;
				}
			}
		}
		else
		{
			this.replaceRequest = null;
		}
	}

	ReplaceItem.prototype.getDataList = function(FieldName)
	{
		switch (FieldName)
		{
			case "District":
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "district"))
					.then(function(data)
					{
						return data.Items.map(function(d)
						{
							return { text: d.Name, value: d.IdString };
						});
					}.bind(this));
				break;
			case "SchoolCode":
			case "ResidSchool":
			case "Priorschool":
			case "DlyDoTschl":
			case "DlyPuTschl":
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "school"))
					.then(function(data)
					{
						var sortedList = data.Items.sort(function(a, b)
						{
							var nameA = a.Name.toLowerCase();
							var nameB = b.Name.toLowerCase();

							if (nameA > nameB) { return 1; }
							if (nameA < nameB) { return -1; }
							return 0;
						});

						return sortedList.map(function(d)
						{
							return { text: d.Name + " (" + d.SchoolCode + ")", value: d.SchoolCode };
						});
					}.bind(this));
				break;
			case "Sex":
				return Promise.resolve([{ text: 'Female', value: 'F' }, { text: 'Male', value: 'M' }]);
				break;
			case "DlyDoSite":
			case "DlyPuSite":
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "altsite/public"))
					.then(function(data)
					{
						var items = data.Items.map(function(d)
						{
							return { text: d.Name, value: d.Id };
						});
						return [{ value: 0, text: "Home" }, { value: -1, text: "None" }, { value: -2, text: "Parent Transport" }, { value: -3, text: "Walker" }].concat(items);
					}.bind(this));
				break;
			case "DlyPuTripId":
			case "DlyDoTripId":
			case "DlyPuTranTripId":
			case "DlyDoTranTripId":
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trip"))
					.then(function(data)
					{
						return data.Items.map(function(d)
						{
							return { text: d.Name, value: d.Id };
						});
					}.bind(this));
				break;
			case "DlyPuTripStop":
			case "DlyDoTripStop":
			case "DlyDoTranTripStop":
			case "DlyPuTranTripStop":
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "tripstop"))
					.then(function(data)
					{
						return data.Items.map(function(d)
						{
							return { text: d.Street, value: d.Id };
						});
					}.bind(this));
				break;
		}
		return Promise.resolve([]);
	}

	function ReplaceRequest(fieldName, updateValue)
	{
		this.FieldName = fieldName;
		this.UpdateValue = updateValue;
	}
})();
