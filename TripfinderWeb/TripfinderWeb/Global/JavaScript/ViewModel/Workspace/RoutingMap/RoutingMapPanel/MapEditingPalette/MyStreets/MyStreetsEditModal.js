(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MyStreetsEditModal = MyStreetsEditModal;

	function MyStreetsEditModal(viewModel)
	{
		var self = this;
		TF.RoutingMap.BaseEditModal.call(this, {
			routingMapDocumentViewModel: viewModel.viewModel._viewModal,
			template: "workspace/Routing Map/RoutingMapPanel/MapEditingPalette/EditMyStreets"
		});
		this.onEditModalDataChangeEvent = new TF.Events.Event();
		this.viewModel = viewModel;
		this.dataModel = viewModel.dataModel;
		this.obDataModel = this.getDataModel();
		this.obSpeedLeftDisable = ko.observable(false);
		this.obSpeedRightDisable = ko.observable(false);
		this.obMultipleChange = ko.observable(false);
		this.isReadOnly = ko.observable(false);
		this.leftSpeedDiabled = ko.computed(function()
		{
			return self.obSpeedLeftDisable() || self.isReadOnly();
		});
		this.rightSpeedDiabled = ko.computed(function()
		{
			return self.obSpeedRightDisable() || self.isReadOnly();
		});
		this.dataModel.highlightChangedEvent.subscribe(this.onHighLightChangedEvent.bind(this));
		this.isTravelScenarioShowMode = ko.observable(false);

		this.classificationList = [
			{ value: 1, name: "1 - Local" },
			{ value: 2, name: "2 - Highway" },
			{ value: 3, name: "3 - Ramp" },
			{ value: 4, name: "4 - Ferry" },
			{ value: 5, name: "5 - Roundabouts" },
			{ value: 6, name: "6 - Major" }];
		this.obSelectedClassification = ko.observable(this.classificationList[0]);
		this.obSelectedClassification.subscribe(function()
		{
			var data = self.data[self.obCurrentPage()];
			var rc = self.obSelectedClassification().value;
			data["RoadClass"] = rc;
			self.obDataModel.RC(rc);
		});
		this.obSelectedClassificationText = ko.computed(function()
		{
			return self.obSelectedClassification().name;
		});

		this.inputDisabled = ko.computed(function()
		{
			return self.isReadOnly() || self.obMultipleChange();
		});
	}

	MyStreetsEditModal.prototype = Object.create(TF.RoutingMap.BaseEditModal.prototype);
	MyStreetsEditModal.prototype.constructor = MyStreetsEditModal;

	MyStreetsEditModal.prototype.init = function()
	{
		var self = this;
		this.obCurrentPage(0);
		this.obRecordsCount(this.data.length);
		this.obMultipleChange(false);

		this.isTravelScenarioShowMode(this.viewModel.showMode().travelScenario);
		this.isReadOnly(!tf.authManager.isAuthorizedFor("mapEdit", ["edit", "add"]) || !this.viewModel.showMode().mapEditing);

		this.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });
		for (var key in this.obDataModel)
		{
			if (ko.isObservable(this.obDataModel[key]))
			{
				this.obDataModel[key]("");
			}
		}
		setTimeout(function()
		{
			self.element.find(":text").off("keypress").on("keypress", function(e)
			{
				if (e.keyCode == 13 && self.obDataModel.Street().length > 0)
				{
					setTimeout(function()
					{
						self.applyClick();
					});
				}
			});
			self.streetInputCheck();
		}, 10);

		return Promise.resolve();
	};

	/**
	* user can only tap letter, number and space, because some special char like [] will cause error in transfer team
	*/
	MyStreetsEditModal.prototype.streetInputCheck = function()
	{
		this.element.find("[name=name]").on("keypress", function(event)
		{
			var inp = String.fromCharCode(event.keyCode);
			if (!(/[a-zA-Z0-9-_ ']/.test(inp)))
			{
				event.preventDefault();
				event.stopPropagation();
			}
		});
	};

	MyStreetsEditModal.prototype.initValidation = function()
	{
		var self = this;
		setTimeout(function()
		{
			self.$form = $(self.element);
			var validatorFields = {},
				isValidating = false;

			validatorFields.name = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					}
				}
			};

			validatorFields.speedLeft = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					}
				}
			};

			validatorFields.speedRight = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					}
				}
			};

			if (self.$form.data("bootstrapValidator"))
			{
				self.$form.data("bootstrapValidator").destroy();
			}
			self.$form.bootstrapValidator({
				excluded: [],
				live: "enabled",
				message: "This value is not valid",
				fields: validatorFields
			}).on("success.field.bv", function(e, data)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element);
					isValidating = false;
				}
			});
			self.pageLevelViewModel.load(self.$form.data("bootstrapValidator"));
		});
	};

	MyStreetsEditModal.prototype.addLinkStreetData = function(data)
	{
		var self = this;
		if (self.viewModel.viewModel._viewModal.routingSnapManager.isEnableSnapping == true)
		{
			// use setTimeout since find connected street is too slow
			setTimeout(function()
			{
				var intersectStreets = self.dataModel.findConnectedStreet(data);
				if (intersectStreets.length == 1)
				{
					for (var key in intersectStreets[0].street)
					{
						if (key != "id" &&
							key != "geometry" &&
							key != "OBJECTID" &&
							key != "Toright" &&
							key != "Toleft" &&
							key != "Fromleft" &&
							key != "Fromright")
						{
							data[key] = intersectStreets[0].street[key];
						}
					}
				}
			});
		}
	};

	MyStreetsEditModal.prototype.create = function(data)
	{
		var self = this;
		var createFromData = data;
		if (createFromData.paths)
		{
			createFromData = { geometry: data };
			self.addLinkStreetData(createFromData);
		}
		return self.beforeChangeData().then(function()
		{
			self.initing = true;
			var street = $.extend(self.dataModel.getDataModel(), createFromData);
			street.OBJECTID = 0;
			street.id = TF.createId();
			self.obOverlayVisible(false);
			self.normalizeData(street);
			self.init().then(function()
			{
				self.initTitle(true);
				self.showCurrentData();
				self.initing = false;
				self.show();
				setTimeout(function()
				{
					self.initValidation();
				}, 50);
			});
			return self.promise;
		});
	};

	/**
	* this is the enter to open edit boundary modal
	*/
	MyStreetsEditModal.prototype.showEditModal = function(editData)
	{
		var self = this;
		return self.beforeChangeData().then(function()
		{
			self.obOverlayVisible(false);
			var dataPromise;
			if (editData)
			{
				dataPromise = Promise.resolve(editData);
			} else
			{
				dataPromise = self.getAllHighlight();
			}
			dataPromise.then(function(data)
			{
				if (!data || data.length === 0)
				{
					return Promise.resolve();
				}
				self.initing = true;
				self.normalizeData(data);
				self.init().then(function()
				{
					self.initTitle(false);
					self.show();
					self.showCurrentData();
					self.initing = false;
					self.dataModel.setHighlighted(data.map(item => item.id > 0 ? item.id : item.ObJECTID));
				});
			});
		});
	};

	MyStreetsEditModal.prototype.closeEditModal = function()
	{
		var self = this;
		self.hide();
		self.resolve();
	};

	MyStreetsEditModal.prototype.getAllHighlight = function()
	{
		var highlighted = this.dataModel.getHighlighted();
		return this.dataModel.streetsLockData.filterUnLockItems(highlighted).then(function(data)
		{
			if (highlighted.length > 0 && data.length == 0)
			{
				tf.promiseBootbox.alert("Street Segment is locked for Editing");
			}
			return data;
		});
	};

	MyStreetsEditModal.prototype.showCurrentData = function()
	{
		var self = this;
		self.showing = true;
		var data = this.data[this.obCurrentPage()];
		for (let key in self.obDataModel)
		{
			if (ko.isObservable(self.obDataModel[key]))
			{
				self.obDataModel[key](data[key]);
				if (speedFields.indexOf(key) >= 0)
				{
					self.obDataModel["edit" + key](this.convertSpeed(data[key]));
					var subscribeKey = "edit" + key + "subscribe";
					if (self[subscribeKey])
					{
						self[subscribeKey].dispose();
					}
					self[subscribeKey] = self.obDataModel["edit" + key].subscribe((value) =>
					{
						self.obDataModel[key](this.convertSpeedBack(value));
					});
				}
			}
		}

		self.obDataModel.locked(data["Lock"] == "T");
		self.obDataModel.RC(data.RoadClass || 1);
		self.obSelectedClassification(self.classificationList.filter(function(v) { return v.value == self.obDataModel.RC(); })[0]);
		self.obDataModel.TraversableByVehicle(data["TraversableByVehicle"] == "T");
		self.obDataModel.TraversableByWalkers(data["TraversableByWalkers"] == "T");
		self.obShowPaging(self.data.length > 1);
		if (self.viewModel.showMode().travelScenario)
		{
			self.viewModel.calculator.calculate(data);
		}
		this.obSpeedLeftDisable(data.TraversableByVehicle == "F");
		this.obSpeedRightDisable(data.TraversableByVehicle == "F");
		self.showing = false;
		setTimeout(function()
		{
			self.initValidation();
		}, 50);
	};

	// MyStreetsEditModal.prototype.convertStreetTypeToRC = function(streetType)
	// {
	// 	var RC = 1;
	// 	if (streetType == "A10" || streetType == "A11" || streetType == "A12" || streetType == "A13" || streetType == "A14" || streetType == "A15"
	// 		|| streetType == "A16" || streetType == "A17" || streetType == "A18" || streetType == "A19")
	// 	{
	// 		RC = 2
	// 	}
	// 	else if (streetType == "A60" || streetType == "A63")
	// 	{
	// 		RC = 3
	// 	}
	// 	else if (streetType == "A65" || streetType == "A66" || streetType == "A67" || streetType == "A68")
	// 	{
	// 		RC = 4
	// 	}
	// 	else if (streetType == "A62")
	// 	{
	// 		RC = 5
	// 	}
	// 	else if (streetType == "A99")//test only
	// 	{
	// 		RC = 6//test only
	// 	}
	// 	else
	// 	{
	// 		RC = 1
	// 	}
	// 	return RC;
	// }

	// MyStreetsEditModal.prototype.convertRCToStreetType = function(RC)
	// {
	// 	var streetType = "A20";
	// 	switch (RC)
	// 	{
	// 		case 2:
	// 			streetType = "A10"
	// 			break;
	// 		case 3:
	// 			streetType = "A60"
	// 			break;
	// 		case 4:
	// 			streetType = "A65"
	// 			break;
	// 		case 5:
	// 			streetType = "A62"
	// 			break;
	// 		case 6:
	// 			streetType = "A99"//test only
	// 			break;
	// 		default:
	// 			streetType = "A20"
	// 			break;
	// 	}
	// 	return streetType;
	// }

	MyStreetsEditModal.prototype.show = function()
	{
		this.obVisible(true);
		this.element.find("[name=name]").focus();
		this.element.find("div.body").scrollTop(0);
	};

	MyStreetsEditModal.prototype.hide = function()
	{
		this.obVisible(false);
		this.obOverlayVisible(false);
		if (this.$form && this.$form.data("bootstrapValidator"))
		{
			this.$form.data("bootstrapValidator").destroy();
		}

		this.viewModel.calculator && this.viewModel.calculator.calculate(null);
		this.onCloseEditModalEvent.notify();
		this.viewModel.viewModel._viewModal.onStopEditingEvent.notify();
	};

	MyStreetsEditModal.prototype.initTitle = function(isNew)
	{
		var mode = isNew ? "New" : "Edit";
		this.mode(mode.toLowerCase());
		if (this.data.length > 1)
		{
			this.obTitle(mode + " Segment (" + this.data.length + ")");
		} else
		{
			this.obTitle(mode + " Segment");

		}
		this.element.find(".boundaryEditModal .head").css({ "cursor": isNew ? "default" : "pointer" });
	};

	MyStreetsEditModal.prototype.normalizeData = function(data)
	{
		if (!data)
		{
			data = {};
		}
		this.data = data;
		if (!$.isArray(data))
		{
			this.data = [data];
		}
		var original = [];
		this.data = this.data.map(function(item)
		{
			item.RoadClass = item.RoadClass || 1;
			original.push($.extend({}, item));
			return $.extend({}, item);
		});
		this.original = original;
		this.obRecordsCount(this.data.length);
	};

	MyStreetsEditModal.prototype.convertSpeed = function(value)
	{
		return tf.measurementUnitConverter.convert({
			value: value,
			originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
			targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
			precision: 2
		});
	};

	MyStreetsEditModal.prototype.convertSpeedBack = function(value)
	{
		return tf.measurementUnitConverter.convert({
			value: value,
			originalUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
			targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
			precision: 2
		});
	};

	var speedFields = ["Speedleft", "Speedright", "PostedLeft", "PostedRight"];

	MyStreetsEditModal.prototype.getDataModel = function()
	{
		var data = {};
		var self = this;
		var dataModel = this.dataModel.getDataModel();
		dataModel.locked = false;
		for (let key in dataModel)
		{
			if (key == "geometry")
			{
				continue;
			}
			if (speedFields.indexOf(key) >= 0)
			{
				data["edit" + key] = ko.observable();
			}
			data[key] = ko.observable();
			data[key].subscribe(self.subscribeDataChange(key));
		}
		return data;
	};

	MyStreetsEditModal.prototype.subscribeDataChange = function(key)
	{
		var self = this;
		return function(value)
		{
			if (self.initing || self.showing)
			{
				return;
			}
			var data = self.data[self.obCurrentPage()];
			if (key == "TraversableByVehicle" || key == "TraversableByWalkers")
			{
				data[key] = value ? "T" : "F";
			}
			else
			{
				data[key] = value;
			}

			if (key == "locked")
			{
				data["Lock"] = value ? "T" : "F";
			}

			if (key == "ProhibitCrosser")
			{
				data[key] = value ? 1 : 0;
			}

			if (key == "Speedleft")
			{
				data["leftTime"] = (data["distance"] / data[key]) * 60;
			}
			else if (key == "Speedright")
			{
				data["rightTime"] = (data["distance"] / data[key]) * 60;
			}
			if (key == "TraversableByVehicle")
			{
				self.vehiTravChange();
			}
			if (key == "Speedleft" || key == "Speedright")
			{
				self.speedChange();
			}
			self.onEditModalDataChangeEvent.notify(data);
		};
	};

	MyStreetsEditModal.prototype.vehiTravChange = function()
	{
		var vehicleTraversable = !(this.obDataModel.TraversableByVehicle() == false || this.obDataModel.TraversableByVehicle() == "F");
		this.obSpeedLeftDisable(!vehicleTraversable);
		this.obSpeedRightDisable(!vehicleTraversable);
		if (!vehicleTraversable)
		{
			this.obDataModel.Speedleft(0);
			this.obDataModel.Speedright(0);
		} else
		{
			this.obDataModel.Speedleft(this.obDataModel.Speedleft() || 25);
			this.obDataModel.Speedright(this.obDataModel.Speedright() || 25);
		}
	};

	MyStreetsEditModal.prototype.speedChange = function()
	{
		if (!this.obDataModel.TraversableByVehicle()) return;
		var speedleft = this.obDataModel.Speedleft();
		var speedright = this.obDataModel.Speedright();
		this.obDataModel.TraversableByVehicle(speedleft == 0 && speedright == 0 ? false : true);
	};

	MyStreetsEditModal.prototype.applyClick = function()
	{
		var self = this;
		self.save().then(function(result)
		{
			if (result)
			{
				self.hide();
				self.dataModel.setHighlighted([]);
			}
		});
	};

	MyStreetsEditModal.prototype.editLineStyle = function()
	{
		var self = this;
		if (this.isReadOnly())
		{
			return;
		}
		// line style can not update for arcgis V4.10 because feature layer does not support
		tf.modalManager.showModal(new TF.RoutingMap.LineStyleSelectorModalViewModel(self.obDataModel))
			.then(function(jsonData)
			{
				if (jsonData)
				{
					self.obDataModel.width(jsonData.lineWidth);
					self.obDataModel.pattern(jsonData.pattern);
					self.obDataModel.opacity(jsonData.opacity);
					self.obDataModel.color(jsonData.color);
					var linStyle = self.dataModel.newLineStyleJson();
					linStyle[0].Pen.Width = jsonData.lineWidth + "";
					linStyle[0].Pen.Pattern = jsonData.pattern;
					linStyle[0].Pen.Color = TF.Color.toLongColorFromHTMLColor(jsonData.color);
					linStyle[0].Pen.Opacity = jsonData.opacity + "";
					self.obDataModel.Style(JSON.stringify(linStyle));
				}
			});
	};

	MyStreetsEditModal.prototype.getCurrentDashValue = function(pattern)
	{
		return TF.Map.MapLineStyle.getDashArray(pattern, this.obDataModel.width());
	};

	MyStreetsEditModal.prototype.saveValidate = function()
	{
		var self = this;
		return self.pageLevelViewModel.saveValidate().then(function(result)
		{
			var vehicleTraversableVerify = true;
			for (var i = 0; i < self.data.length; i++)
			{
				var d = self.data[i];
				if (d.TraversableByVehicle == "T" && d.Speedleft <= 0 && d.Speedright <= 0)
				{
					vehicleTraversableVerify = false;
					break;
				}
			}
			if (!vehicleTraversableVerify)
			{
				self.pageLevelViewModel.obValidationErrorsSpecifed([{ message: "Please set routing left and routing right speed limits" }]);
				self.pageLevelViewModel.obErrorMessageDivIsShow(true);
			}
			return result && vehicleTraversableVerify;
		});
	};

	MyStreetsEditModal.prototype.save = function()
	{
		var self = this;
		return self.saveValidate().then(function(result)
		{
			if (result)
			{
				if (self.mode() == "new")
				{
					self.dataModel.create(self.data[0]);
					self.resolve(null);
				}
				else
				{
					var allDataTemplate = null;
					if (self.obMultipleChange())
					{
						allDataTemplate = self.data[self.obCurrentPage()];
					}
					self.data.forEach(function(item)
					{
						if (allDataTemplate)
						{
							item.color = allDataTemplate.color;
							item.pattern = allDataTemplate.pattern;
							item.opacity = allDataTemplate.opacity;
							item.width = allDataTemplate.width;
							item.Style = allDataTemplate.Style;
							item.ProhibitCrosser = allDataTemplate.ProhibitCrosser;
							item.Speedleft = allDataTemplate.Speedleft;
							item.Speedright = allDataTemplate.Speedright;
							item.PostedLeft = allDataTemplate.PostedLeft;
							item.PostedRight = allDataTemplate.PostedRight;
							item.FromElevation = allDataTemplate.FromElevation;
							item.ToElevation = allDataTemplate.ToElevation;
							item.WeightLimit = allDataTemplate.WeightLimit;
							item.HeightClearance = allDataTemplate.HeightClearance;
						}
					});
					self.dataModel.update(self.data);
					self.resolve(self.data);
				}
				self.pageLevelViewModel.clearError();
			}
			return result;
		});
	};

	MyStreetsEditModal.prototype.cancelClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var data = this.data;
		var confirmPromise = Promise.resolve(true);
		var dataSame = self._compareArrayObject(this.original, data);
		if (!dataSame)
		{
			confirmPromise = tf.promiseBootbox.yesNo("There are unsaved changes.  Are you sure you want to cancel?", "Unsaved Changes");
		}
		confirmPromise.then(function(result)
		{
			if (result === true)
			{
				self.hide();
				self.dataModel.setHighlighted([]);
				self.pageLevelViewModel.clearError();
				self.resolve();
			}
		});
	};

	MyStreetsEditModal.prototype._compareArrayObject = function(a, b)
	{
		for (var i = 0; i < a.length; i++)
		{
			var dataA = a[i], dataB = b[i];
			for (var key in dataA)
			{
				if (key != "geometry" && key != "leftTime" && key != "StreetType" && key != "rightTime" && dataA[key] != dataB[key])
				{
					return false;
				}
			}
		}
		return true;
	};

	MyStreetsEditModal.prototype.focusGeometry = function()
	{
		this.viewModel.drawTool.glowAndVisibleGeometries([this.data[this.obCurrentPage()].geometry]);
	};

})();