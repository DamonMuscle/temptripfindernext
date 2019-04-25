(function()
{
	createNamespace('TF.Control').GenerateReportViewModel = GenerateReportViewModel;

	function GenerateReportViewModel(udReport, output, options)
	{
		this.options = options;
		this.specificRecordFormatter = this.specificRecordFormatter.bind(this);
		this.obReportDataSourceModels = ko.observableArray();

		this.obErrorMessageDivIsShow = ko.observable(false);
		this.obValidationErrors = ko.observableArray([]);

		this.obPageDescription = ko.observable('Specify the report variables (i.e. Title, Subtitle, Preparer, and Description) and the records that you would like to include in the report. ');
		this.obShowGPSEvents = ko.observable(true);
		this.firstLoad = true;

		this.obActiveDataSources = ko.observableArray();

		this.obSpecifyRecords = ko.observableArray([
			{
				id: 1,
				name: "All Records"
			},
			{
				id: 2,
				name: "Filter"
			},
			{
				id: 3,
				name: "Specific Records"
			}]);

		this.obOutputTos = ko.observableArray([
			{
				id: 0,
				name: "View"
			},
			{
				id: 1,
				name: "Export to File"
			},
			{
				id: 2,
				name: "Email"
			}]);
		this.obOutputTo = ko.observable();
		switch (output)
		{
			case 'view':
				this.obOutputTo(this.obOutputTos()[0]);
				break;
			case 'saveas':
				this.obOutputTo(this.obOutputTos()[1]);
				break;
			case 'email':
				this.obOutputTo(this.obOutputTos()[2]);
				break;
		}
		this.obOutputToText = ko.computed(function()
		{
			return this.obOutputTo() ? this.obOutputTo().name : " "
		}, this);
		this.obSelectedSpecificRecord = ko.observableArray();
		this.obFilterDataModels = ko.observableArray();
		this.obEntityDataModel = ko.observable(new TF.DataModel.GenerateReportDataModal());
		this.obReport = ko.observable();

		this.obFilter = ko.observable();
		this.obSpecifyRecordOption = ko.observable();
		this.IsNotUpgradedDataSource = ko.observable(false);
		this.reportUser = null;
		this.obEntityDataModel().dataSourceId(tf.storageManager.get("datasourceId"));
		this.IsFirstLoading = true;

		//drop down menu
		this.obReportText = ko.computed(function()
		{
			return this.obReport() ? this.obReport().Name : " "
		}, this);
		this.obReportTextAndType = ko.computed(function()
		{
			return this.obReport() ? this.obReport().Name + "(" + this.obReport().type + ")" : " "
		}, this);
		this.obReportTextAndType.subscribe(this.reportNameChange, this);
		this.obSpecifyRecordOptionText = ko.computed(function()
		{
			return this.obSpecifyRecordOption() ? this.obSpecifyRecordOption().name : " "
		}, this);
		this.obSpecifyRecordOptionText.subscribe(this.specificRecordSelectChange, this);
		this.obFilterText = ko.computed(function()
		{
			return this.obFilter() ? this.obFilter().name() : " "
		}, this)

		this.obShowIncludeInActiveRecords = ko.computed(function()
		{
			return this.obEntityDataModel().selectedRecordType() == "student";
		}.bind(this));
		this.obDisabledFilteRecords = ko.computed(function()
		{
			var type = this.obEntityDataModel().selectedRecordType();
			return type == "other";
		}.bind(this));
		this.obDisabledSpecifyRecords = ko.computed(function()
		{
			return this.IsNotUpgradedDataSource() || this.obDisabledFilteRecords();
		}.bind(this));
		this.obDisabledFilteName = ko.computed(function()
		{
			return this.obEntityDataModel().selectedRecordType() == "other" ||
				this.obEntityDataModel().specifyRecordOption() != 2 || this.IsNotUpgradedDataSource() || this.obDisabledFilteRecords();
		}.bind(this));
		this.obDisabledSpecificRecord = ko.computed(function()
		{
			return this.obEntityDataModel().selectedRecordType() == "other" ||
				this.obEntityDataModel().specifyRecordOption() != 3 || this.IsNotUpgradedDataSource();
		}.bind(this));
		this.obSpecificRecordStringForValidation = ko.computed(function()
		{
			if (!this.firstLoad)
			{
				setTimeout(function()
				{
					$("input[name=specificRecords]").change();
				});
			}
			if (this.obDisabledFilteRecords() || this.obDisabledSpecificRecord() || this.obSelectedSpecificRecord().length > 0)
			{
				return "1";
			}
			else
			{
				return "";
			}
		}.bind(this));
		this.obFilterNameStringForValidation = ko.computed(function()
		{
			if (!this.firstLoad)
			{
				setTimeout(function()
				{
					$("input[name=filterName]").change();
				});
			}
			if (this.obDisabledFilteRecords() || this.obDisabledFilteName())
			{
				return "1";
			}
			else
			{
				return this.obEntityDataModel().filterName();
			}
		}.bind(this));

		ko.computed(this.reportNameComputed, this);
		ko.computed(this.specificRecordSelectComputed, this);
		ko.computed(this.filterNameComputed, this);
		ko.computed(this.outputToComputed, this);

		this.load().then(function()
		{
			this.oldEntityDataModel_reportName = udReport.RepFileName;
			this.bindDefaultReportInfo(udReport);
			if (this.options && this.options.selectedRecordId.length > 0)
			{
				this.initSpecificRecord();
			}
			var theDatas = Enumerable.From(this.reportDataSourceModels).Where(function(x)
			{
				return x.RepFileName.replace('.rpt', '') == this.oldEntityDataModel_reportName.replace('.rpt', '');
			}.bind(this)).ToArray();

			this.obReport(theDatas.length > 0 ? theDatas[0] : null);
			this.firstLoad = false;
		}.bind(this));
		setTimeout(function()
		{
			this.obEntityDataModel().apiIsDirty(false); //fix when edit a report which associated with deleted data source, doing nothing then click cancel button, Unsaved changes dialog pops up..
		}.bind(this), 300);
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	GenerateReportViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	GenerateReportViewModel.prototype.constructor = GenerateReportViewModel;

	GenerateReportViewModel.prototype.getPreviouslySelectedDataSource = function(previouslySelectedDataSourceId) //get the previously selected data source model
	{
		for (var i = 0; i < this.obDataSourcesOption().length; i++)
		{
			if (this.obDataSourcesOption()[i].Id === previouslySelectedDataSourceId)
			{
				return this.obDataSourcesOption()[i];
			}
		}
	};

	GenerateReportViewModel.prototype.getFilter = function()
	{
		var type = this.obReport().type || this.obEntityDataModel().selectedRecordType();
		if (type && type != "other" && type != "unknown" && type != "custom" && type != "busfinder")
		{
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "gridfilter", this.getRealType()))
				.then(function(data)
				{
					data.Items.unshift(
						{
							Name: " ",
							Id: undefined
						});
					this.obFilterDataModels(TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, data.Items));
				}.bind(this));
		}
	};
	GenerateReportViewModel.prototype.initSpecificRecord = function()
	{
		if (this.options && this.options.selectedRecordId)
		{
			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), tf.datasourceManager.databaseId, this.options.type, "ids"),
				{
					data: this.options.selectedRecordId
				})
				.then(function(data)
				{
					this.obSelectedSpecificRecord(data.Items);
					this.obEntityDataModel().selectedRecordIds(data.Items.map(function(item)
					{
						return item.Id;
					}));
				}.bind(this));
		}
	};

	GenerateReportViewModel.prototype.init = function(viewModel, el)
	{
		this._$form = $(el);
		this.initValidation();
		if (!TF.isMobileDevice)
		{
			this._$form.find("[name=selReportType]").focus();
		}
	};

	GenerateReportViewModel.prototype.initValidation = function()
	{
		var self = this,
			isValidating = false;
		if (!this._$form)
		{
			return;
		}
		setTimeout(function()
		{
			var validatorFields = {};
			validatorFields["filterName"] = {
				trigger: "blur change",
				validators:
				{
					notEmpty:
					{
						message: "required"
					}
				}
			};

			validatorFields["specificRecords"] = {
				trigger: "blur change",
				validators:
				{
					notEmpty:
					{
						message: " At least one record must be selected"
					}
				}
			};

			this._$form.bootstrapValidator(
				{
					excluded: [':hidden', ':not(:visible)'],
					live: 'enabled',
					message: 'This value is not valid',
					fields: validatorFields
				})
				.on('success.field.bv', function(e, data)
				{
					var $parent = data.element.closest('.form-group');
					$parent.removeClass('has-success');
					if (!isValidating)
					{
						isValidating = true;
						self.pageLevelViewModel.saveValidate(data.element);
						isValidating = false;
					}
				});
			this.pageLevelViewModel.load(this._$form.data("bootstrapValidator"));

		}.bind(this), 0);
	};

	GenerateReportViewModel.prototype.clearDateTimeAlerts = function()
	{
		if (this._$form)
		{
			this._$form.find("[name=timefrom]").closest('.form-group').find("small[data-bv-validator=callback]").hide();
			this._$form.find("[name=timeto]").closest('.form-group').find("small[data-bv-validator=callback]").hide();
		}
	};

	GenerateReportViewModel.prototype.normalizTime = function(time)
	{
		time = moment(time);
		time.set('year', 1900);
		time.set('month', 1);
		time.set('date', 1);
		return time;
	};

	GenerateReportViewModel.prototype.convertHtmlTagToOptionText = function(option, item)
	{
		var $optionNdoe = $('#filterDataSource').find(option);
		if ($optionNdoe.text() === '<hr>')
		{
			$optionNdoe.text('------------');
		}
	};

	GenerateReportViewModel.prototype.handleReportSource = function(Items)
	{
		this.reportDataSourceModels = Items;
		var reportDataSourceModels = [];
		for (var i = 0; i < Items.length; i++)
		{
			if (Items[i].BaseDataType === 0)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'student', tf.applicationTerm.getApplicationTermSingularByName('Student'));
			}
			if (Items[i].BaseDataType === 1)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'school', tf.applicationTerm.getApplicationTermSingularByName('School'));
			}
			if (Items[i].BaseDataType === 2)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'district', tf.applicationTerm.getApplicationTermSingularByName('District'));
			}
			if (Items[i].BaseDataType === 3)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'contractor', tf.applicationTerm.getApplicationTermSingularByName('Contractor'));
			}
			if (Items[i].BaseDataType === 4)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'vehicle', tf.applicationTerm.getApplicationTermSingularByName('Vehicle'));
			}
			if (Items[i].BaseDataType === 5)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'staff', tf.applicationTerm.getApplicationTermSingularByName('Staff'));
			}
			if (Items[i].BaseDataType === 6)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'altsite', tf.applicationTerm.getApplicationTermSingularByName('Alternate Site'));
			}
			if (Items[i].BaseDataType === 7)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'trip', tf.applicationTerm.getApplicationTermSingularByName('Trip'));
			}
			if (Items[i].BaseDataType === 9)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'other', 'Other');
			}
			if (Items[i].BaseDataType === 10)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'fieldtrip', tf.applicationTerm.getApplicationTermSingularByName('Field Trip'));
			}
			if (Items[i].BaseDataType === 13 ||
				Items[i].BaseDataType === 14 ||
				Items[i].BaseDataType === 15)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'busfinder', 'Busfinder');
			}
			if (Items[i].BaseDataType === 16)
			{
				buildReportDataSource(Items[i], reportDataSourceModels, 'custom', 'Custom');
			}
		}

		// sort each section
		reportDataSourceModels.forEach(function(reportGroup)
		{
			reportGroup.source = Enumerable.From(reportGroup.source).OrderBy(function(report)
			{
				return report.Name;
			}).ToArray();
		});
		var xxx = Enumerable.From(reportDataSourceModels).OrderBy(function(x)
		{
			return x.displayName;
		}).ToArray();
		this.obReportDataSourceModels(xxx);
	}

	function buildReportDataSource(item, reportDataSourceModels, type, label)
	{
		var datas = Enumerable.From(reportDataSourceModels).Where(function(x)
		{
			return x.displayName == label;
		}).ToArray();
		var data;
		if (datas.length == 0)
		{
			data = {
				displayName: label,
				source: []
			};
			reportDataSourceModels.push(data);
		}
		else
		{
			data = datas[0];
		}
		data.source.push($.extend(item,
			{
				type: type,
				label: label,
				groupName: label
			}));
	};

	GenerateReportViewModel.prototype.load = function()
	{
		var promises = [];

		var p1 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "reports", "fieldtrip"))
			.then(function(data)
			{
				var fieldtripData = data.Items.filter(function(item)
				{
					return item.BaseDataType === 10;
				});
				this.handleReportSource(fieldtripData);
			}.bind(this));
		promises.push(p1);

		var p4 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "reportuser"))
			.then(function(data)
			{
				this.reportUser = data.Items[0];
				this.obEntityDataModel().preparer(this.reportUser.OfficeName);
			}.bind(this));
		promises.push(p4);


		return Promise.all(promises);
	};

	GenerateReportViewModel.prototype.filterDataSourceSelectChange = function()
	{
		this.obFilter(this.obFilterDataModels()[0]);
		this.obSelectedSpecificRecord([]);
		this.obEntityDataModel().selectedRecordIds([]);
		if (this.obEntityDataModel().selectedRecordType() !== "" && this.obEntityDataModel().selectedRecordType() !== "other")
		{
			this.getFilter();
		}
	};
	GenerateReportViewModel.prototype.specificRecordSelectChange = function()
	{
		if (this.obSpecifyRecordOption())
		{
			if (this.obSpecifyRecordOption().id != 2)
			{
				this.obFilter(this.obFilterDataModels()[0]);
			}
			if (this.obSpecifyRecordOption().id != 3)
			{
				this.obSelectedSpecificRecord([]);
				this.obEntityDataModel().selectedRecordIds([]);
			}
		}
		else
		{
			this.obFilter(this.obFilterDataModels()[0]);
		}
	};

	GenerateReportViewModel.prototype.bindDefaultReportInfo = function(report)
	{
		this.obEntityDataModel().description(report.DefDesc);
		this.obEntityDataModel().reportTitle(report.DefTitle);
		this.obEntityDataModel().subTitle(report.DefSubTitle);
		this.obEntityDataModel().preparer(this.reportUser.OfficeName);
		if (this.options && this.options.selectedRecordId.length > 0)
		{
			this.obSpecifyRecordOption(this.obSpecifyRecords()[2]);
		}
		else
		{
			var specifyRecordId = report.DefTypeFilter == 100 ? 1 : (report.DefTypeFilter == 10 ? 3 : 2);
			var theDatas = Enumerable.From(this.obSpecifyRecords()).Where(function(x)
			{
				return x.id == specifyRecordId;
			}.bind(this)).ToArray();
			if (theDatas)
			{
				this.obSpecifyRecordOption(theDatas[0]);
			}
		}
	};

	GenerateReportViewModel.prototype.reportNameChange = function()
	{
		if (this.obReport())
		{

			var type = this.obReport().type;
			this.initValidation();
			if (type == "other" || type == "busfinder")
			{
				this.obSpecifyRecordOption(this.obSpecifyRecords()[0]);
				this.obFilter(this.obFilterDataModels()[0]);
				this.obSelectedSpecificRecord([]);
				this.obEntityDataModel().selectedRecordIds([]);
				this.bindDefaultReportInfo(this.obReport());
			}
			else
			{
				this.obSpecifyRecordOption(this.obSpecifyRecords()[0]);
				this.obSelectedSpecificRecord([]);
				this.bindDefaultReportInfo(this.obReport());
				this.getFilter();
			}
		}
	};

	GenerateReportViewModel.prototype.getRealType = function()
	{
		var report = this.obReport();
		if (report.BaseDataType == '13')
		{
			return 'busfinderVehicle';
		}
		if (report.BaseDataType == '15')
		{
			return 'busfinderDriver';
		}
		return report.type;
	};

	GenerateReportViewModel.prototype.specificRecordSelectComputed = function()
	{
		if (this.obSpecifyRecordOption())
		{
			this.obEntityDataModel().specifyRecordOption(this.obSpecifyRecordOption().id);
		}
		else
		{
			this.obEntityDataModel().specifyRecordOption(0);
		}
	};

	GenerateReportViewModel.prototype.reportNameComputed = function()
	{
		if (this.obReport())
		{
			this.obEntityDataModel().reportName(this.obReport().RepFileName);
			this.obEntityDataModel().reportOldName(this.obReport().Name);
			this.obEntityDataModel().selectedRecordType(this.obReport().type);
		}
	};

	GenerateReportViewModel.prototype.filterNameComputed = function()
	{
		if (this.obFilter())
		{
			this.obEntityDataModel().filterName(this.obFilter().name());
			this.obEntityDataModel().filterId(this.obFilter().id());
			this.obEntityDataModel().filterSpec(this.obFilter().whereClause());
		}
		else
		{
			this.obEntityDataModel().filterName("");
			this.obEntityDataModel().filterId(-1);
			this.obEntityDataModel().filterSpec("");
		}
	};

	GenerateReportViewModel.prototype.outputToComputed = function()
	{
		var output = "";
		if (this.obOutputTo())
		{

			switch (this.obOutputTo().id)
			{
				case 0:
					output = "view";
					break;
				case 1:
					output = "saveas";
					break;
				case 2:
					output = "email";
					break;
			}
		}

		this.obEntityDataModel().outputTo(output);
	};

	GenerateReportViewModel.prototype.specificRecordFormatter = function(specificRecordDataModel)
	{
		var type = this.getRealType();
		var name;
		switch (type)
		{
			case "student":
				name = specificRecordDataModel.FullName || this._getFullName(specificRecordDataModel);
				break;
			case "staff":
				name = specificRecordDataModel.FullName || this._getFullNameWitnMiddleName(specificRecordDataModel);
				break;
			case "vehicle":
				name = specificRecordDataModel.BusNum;
				break;
			case "school":
				name = specificRecordDataModel.School || specificRecordDataModel.SchoolCode;
				break;
			case "district":
				name = specificRecordDataModel.District || specificRecordDataModel.IdString;
				break;
			case "busfinderDriver":
				name = specificRecordDataModel.DriverName;
				break;
			case "busfinderVehicle":
				name = specificRecordDataModel.ExternalName;
				break;
			default:
				name = specificRecordDataModel.Name;
				break;
		}
		return name;
	};

	GenerateReportViewModel.prototype._getFullName = function(nameEntity)
	{
		var tmpNameEntity = [];
		if (nameEntity.LastName) tmpNameEntity.push(nameEntity.LastName);
		if (nameEntity.FirstName) tmpNameEntity.push(nameEntity.FirstName);

		return tmpNameEntity.join(', ');
	};

	GenerateReportViewModel.prototype._getFullNameWitnMiddleName = function(nameEntity)
	{
		var fullName = this._getFullName(nameEntity);
		if (nameEntity.MiddleName)
		{
			fullName = fullName + ' ' + tmpNameEntity.MiddleName;
		}
		return fullName;
	};

	GenerateReportViewModel.prototype.selectRecordClick = function()
	{
		var type = this.obEntityDataModel().selectedRecordType(),
			defaultOption = {
				title: "Select Records ",
				description: "You may select one or more specific records to run the report against. At least one record must be selected.",
				availableTitle: 'Available',
				selectedTitle: 'Selected',
				mustSelect: true,
				gridOptions:
				{
					forceFitColumns: true,
					enableColumnReorder: true
				}
			};

		if (type != undefined && type != "")
		{
			tf.modalManager.showModal(
				new TF.Modal.ListMoverSelectRecordControlModalViewModel(
					this.obSelectedSpecificRecord(),
					$.extend(
						{}, defaultOption,
						{
							type: this.getRealType(),
							dataSource: tf.datasourceManager.databaseId
						})
				)
			)
				.then(function(selectedRecord)
				{
					if (selectedRecord && $.isArray(selectedRecord))
					{
						var validator = this._$form.data("bootstrapValidator");
						if (type == "student")
						{//student need paging, because it is too big.
							tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "student", "ids"), {
								data: selectedRecord
							}).then(function(data)
							{
								this.obSelectedSpecificRecord(data.Items);
								this.obEntityDataModel().selectedRecordIds(selectedRecord);

								validator.validate();
							}.bind(this));
						}
						else
						{
							this.obSelectedSpecificRecord(selectedRecord);
							this.obEntityDataModel().selectedRecordIds(selectedRecord.map(function(item)
							{
								return item.Id;
							}));

							validator.validate();
						}
					}

				}.bind(this));
		}
	};

	GenerateReportViewModel.prototype.apply = function()
	{
		return this.save()
			.then(function(data)
			{
				return data;
			});
	};

	GenerateReportViewModel.prototype.save = function()
	{
		return this.pageLevelViewModel.saveValidate()
			.then(function(valid)
			{
				if (!valid)
				{
					return false;
				}
				else
				{
					return this.getReport(this.obEntityDataModel()).then(function(ans)
					{
						if (ans == "retry")
						{
							return false;
						}
						return this.obEntityDataModel();
					}.bind(this));
				}
			}.bind(this));
	};

	GenerateReportViewModel.prototype._getCookie = function(name)
	{
		var parts = document.cookie.split(name + "=");
		if (parts.length == 2)
		{
			return parts.pop().split(";").shift();
		}
	};

	GenerateReportViewModel.prototype._expireCookie = function(cName)
	{
		document.cookie =
			encodeURIComponent(cName) +
			"=deleted; path=/;expires=" +
			new Date(0).toUTCString();
	};

	GenerateReportViewModel.prototype.getReport = function(report)
	{
		var self = this;
		var filterClause = null;
		var includeOnlyIds = null;
		if(report.outputTo().toLowerCase() == "view"){
					var redirectWindow = window.open('', '_blank');
					redirectWindow.blur();
				}
		if ((!report.includeInActiveFlag()) && report.selectedRecordType == "student")
		{
			filterClause = " [InActive] = 0 ";
		}
		var p = [];
		if (report.specifyRecordOption() == 2)
		{
			var p1 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "gridFilter", "id", report.filterId()))
				.then(function(data)
				{
					if (data)
					{
						if ($.trim(data.WhereClause) != "")
						{
							filterClause = data.WhereClause + (filterClause ? " and " + filterClause : "");
						}
					}

				}.bind(this));
			p.push(p1);
		}
		else if (report.specifyRecordOption() == 3)
		{
			includeOnlyIds = report.selectedRecordIds();
		}
		return Promise.all(p).then(function()
		{
			var reportData = {
				FileName: report.reportName(),
				FilterClause: filterClause,
				IdFilter:
				{
					IncludeOnly: includeOnlyIds
				},
				Preparer: report.preparer(),
				Title: report.reportTitle(),
				SubTitle: report.subTitle(),
				Description: report.description(),
				RunFor: report.reportParameterRunFor(),
				TimeFrom: report.reportParameterTimeFrom(),
				TimeTo: report.reportParameterTimeTo()
			};
			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "run", report.reportName(), "getKey"),
				{
					data: reportData
				})
				.then(function(apiResponse)
				{
					var key = apiResponse.Items[0], outputTo = report.outputTo().toLowerCase(), reportName = report.reportName();
					if (outputTo == "view")
					{
						var req = new XMLHttpRequest();
  						req.open("GET", pathCombine(tf.api.apiPrefix(), "report", report.reportName(), key, "view", tf.storageManager.get("databaseType"), "/"), true);
  						req.responseType = "blob";
  						req.onload = function (event) {
						redirectWindow.document.tile = "Transfinder";
						var blob = req.response;
						redirectWindow.location=window.URL.createObjectURL(blob)										
						};
						  req.send();						  
						  req.onreadystatechange = function() {
							
							if (this.readyState == 4 && this.status != 200) {			
								redirectWindow.close();								
							}				
						};
						$(redirectWindow).on("load", function()
						{
							var head = $('<head>');
							$(redirectWindow.document).find('html').append(head);
							head.append($('<title>Tripfinder</title> <link href="' + window.location.href + 'Global/img/Transfinder-TripfinderText-Only.png" rel="shortcut icon" type="image/png">'));
						});
						ga('send', 'event', 'Action', 'Report Viewed', reportName + ' Viewed');
					}
					else if (outputTo == "email")
					{
						return tf.modalManager.showModal(new TF.Modal.SendEmailModalViewModel(
							{
								postSendEmail: function(sendData)
								{
									ga('send', 'event', 'Action', 'Report Run', reportName + ' Emailed');
									return tf.promiseAjax["post"](pathCombine(tf.api.apiPrefix(), "report", "sendemail"),
										{
											data: $.extend(true, {}, sendData, reportData)
										});
								}
							}));
					}
					else
					{
						return new Promise(function(resolve, reject)
						{
							self._expireCookie("downloadVerify");
							var attempts = 30;
							var downloadTimer = setInterval(function()
							{
								var token = self._getCookie("downloadVerify");
								if (token == "success")
								{
									clearInterval(downloadTimer);
									self._expireCookie("downloadVerify");
									ga('send', 'event', 'Action', 'Report Saved', reportName + ' Saved');
									tf.promiseBootbox.alert(
										report.reportOldName() + " has been successfully generated and saved as a pdf file", "Successfully Completed")
										.then(function()
										{
											resolve(true);
										});
								}
								if (attempts <= 0)
								{
									clearInterval(downloadTimer);
									self._expireCookie("downloadVerify");
									tf.promiseBootbox.confirm(
										{
											message: report.reportOldName() + " has not been successfully generated and saved as a pdf file. Would you like to adjust the report settings and retry.",
											title: "File Could Not Be Generated & Saved"
										})
										.then(function(retry)
										{
											if (retry == true)
											{
												if (!TF.isMobileDevice)
												{
													self._$form.find("[name=selReportType]").focus();
												}
												resolve("retry");
											}
											else
											{
												resolve();
											}

										});
								}
								attempts--;
							}, 1000);
							window.location = pathCombine(tf.api.apiPrefix(), "report", report.reportName(), key, "saveas", tf.storageManager.get("databaseType"));
						});
					}
				}.bind(this));
		}.bind(this));
	}

	GenerateReportViewModel.prototype.cancel = function()
	{
		return new Promise(function(resolve, reject)
		{
			if (this.obEntityDataModel().apiIsDirty())
			{
				resolve(tf.promiseBootbox.yesNo("Are you sure you want to cancel?", "Alert"));
			}
			else
			{
				resolve(true);
			}
		}.bind(this));
	};

	GenerateReportViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};
})();
