(function()
{
	createNamespace("TF.Grid").ModifyFilterViewModel = ModifyFilterViewModel;

	ModifyFilterViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	ModifyFilterViewModel.prototype.constructor = ModifyFilterViewModel;

	function ModifyFilterViewModel (gridType, isNew, gridFilterDataModel, headerFilters, gridDefinition, omittedRecordIds, options, searchFilter)
	{
		this.isNew = isNew;
		this.gridType = gridType;

		if (!gridFilterDataModel)
		{
			gridFilterDataModel = new TF.DataModel.GridFilterDataModel();
			gridFilterDataModel.gridType(gridType);
		}
		else
		{
			gridFilterDataModel = gridFilterDataModel.clone();
			if (isNew === "new")
			{
				gridFilterDataModel.id(0);
				gridFilterDataModel.apiIsNew(true);
				gridFilterDataModel.apiIsDirty(false);
				gridFilterDataModel.name("");
			}
		}
		this.gridFilterDataModel = gridFilterDataModel;
		if (searchFilter)
		{
			this.gridFilterDataModel.whereClause((this.gridFilterDataModel.whereClause() ? this.gridFilterDataModel.whereClause() + " AND " : "") + searchFilter);
			this.gridFilterDataModel.isForQuickSearch(true);
		}
		this.gridDefinition = gridDefinition;
		this.obGridDefinitionColumns = ko.computed(this._preHandleColumnsComputer, this);
		this.textAreaElement = ko.observable(null);
		this.obValueFieldType = ko.observable("Disabled");
		this.obValueFieldValue = ko.observable("");
		this.obApplyOnSave = ko.observable(false);
		this.obStatementVerify = ko.observable(false);
		this.selectedOperator = ko.observable("");
		this.selectedOperator.subscribe(this.selectOperatorClick.bind(this));
		this.selectFieldOpen = false;
		this.selectOperatorOpen = false;
		this.selectLogicalOperatorOpen = false;
		this._gridType = gridType;
		this.obOmitRecords = ko.observableArray([]);
		this.options = options;
		this.showApplyFilter = options && options.showApplyFilter == false ? false : true;

		this.obValueFieldValue.subscribe(function()
		{
			if (this.obValueFieldValue() !== "")
			{
				this.insertFragmentToCurrentCursorPostion(this.valueToSQL(this.obValueFieldType(), this.obValueFieldValue()));
			}
		}.bind(this));

		this.obErrorMessageDivIsShow = ko.observable(false);
		this.obSuccessMessageDivIsShow = ko.observable(false);
		this.obValidationErrors = ko.observableArray([]);
		this.obValidationErrorMessage = ko.observable();

		if (headerFilters)
		{
			var searchData = new TF.SearchParameters(null, null, null, headerFilters, null, null, null);

			var url = pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint(gridType), "RawFilterClause");
			if (gridType === 'busfinderHistorical')
			{
				searchData.data.filterSet.filterSets = [
					{
						LogicalOperator: "And",
						FilterItems: [
							{
								FieldName: "EventDate",
								Operator: "GreaterThanOrEqualTo",
								TypeHint: "Date",
								Value: moment().format('M/DD/YYYY') || ''
							},
							{
								FieldName: "EventDate",
								Operator: "LessThanOrEqualTo",
								TypeHint: "Date",
								Value: moment().format('M/DD/YYYY') || ''
							}
						],
						FilterSets: []
					},
					{
						LogicalOperator: "And",
						FilterItems: [
							{
								FieldName: "Time",
								Operator: "GreaterThanOrEqualTo",
								TypeHint: "Time",
								Value: startTime || moment('2010-01-01T00:00:00')
							},
							{
								FieldName: "Time",
								Operator: "LessThanOrEqualTo",
								TypeHint: "Time",
								Value: endTime || moment('2010-01-01T23:59:00')
							}
						],
						FilterSets: []
					}
				];
			}

			var requestOption = {
				data: searchData.data.filterSet
			}


			tf.promiseAjax.post(url, requestOption)
				.then(function(apiResponse)
				{
					this.gridFilterDataModel.whereClause((this.gridFilterDataModel.whereClause() ? this.gridFilterDataModel.whereClause() + " AND " : "") + apiResponse.Items[0]);
				}.bind(this))
				.catch(function()
				{
					var validationErrors = [];
					validationErrors.push(
						{
							name: "sqlStatement",
							message: "failed to convert header filters to SQL"
						});
					this.obErrorMessageDivIsShow(true);
					this.obValidationErrors(validationErrors);
				}.bind(this));
		}

		//drop down list
		this.obOperatorSource = ko.observable([" ", "=", "<>", ">", "<", ">=", "<=", "LIKE"]);
		this.obLogicalOperatorSource = ko.observable([" ", "AND", "OR"]);
		this.selectedLogicalOperator = ko.observable("");
		this.selectedLogicalOperator.subscribe(this.selectLogicalOperatorClick.bind(this));

		this.obSelectedField = ko.observable();
		this.obSelectedFieldText = ko.observable();
		this.obSelectedFieldText.subscribe(this.selectFieldClick.bind(this));
		this.getOmittedRecordsName(omittedRecordIds, this.gridFilterDataModel.id());
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		this.initReminder();

		// for mobile
		this.obVisableOmitCnt = ko.observable(0);
		this.obVisibleOmitedRecords = ko.computed(function()
		{
			var visableOmitArray = this.obOmitRecords.slice(0, this.obVisableOmitCnt());
			return visableOmitArray;
		}, this);
	}

	ModifyFilterViewModel.prototype.loadMoreOmitedRecordClick = function()
	{
		// for mobile
		var initVisableOmitCnt = Math.min(this.obVisableOmitCnt() + 15, this.obOmitRecords().length);
		this.obVisableOmitCnt(initVisableOmitCnt);
	};

	ModifyFilterViewModel.prototype.getOmittedRecordsName = function(omittedRecordIds, gridFilterId)
	{
		if (omittedRecordIds == null)
		{
			return null;
		}
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "omittedrecords"),
			{
				paramData:
				{
					databaseId: tf.datasourceManager.databaseId,
					omittedRecordIDs: omittedRecordIds.join(","),
					filterId: gridFilterId
				}
			})
			.then(function(apiResponse)
			{
				var result = apiResponse.Items.sort(function(a, b)
				{
					if (!a.Name)
					{
						return -1;
					}
					if (!b.Name)
					{
						return 1;
					}
					var nameA = a.Name.toUpperCase(); // ignore upper and lowercase
					var nameB = b.Name.toUpperCase(); // ignore upper and lowercase
					if (nameA < nameB)
					{
						return -1;
					}
					if (nameA > nameB)
					{
						return 1;
					}

					// names must be equal
					return 0;
				});
				result.forEach(function(item)
				{
					item.DBID = tf.datasourceManager.databaseId;
				});
				this.obOmitRecords(result);

				// for mobile
				var initVisableOmitCnt = Math.min(15, this.obOmitRecords().length);
				this.obVisableOmitCnt(initVisableOmitCnt);

			}.bind(this));
	}

	ModifyFilterViewModel.prototype._preHandleColumnsComputer = function()
	{
		var tmpColumns = this.gridDefinition.Columns;
		tmpColumns = TF.Grid.FilterHelper.mergeOnlyForFilterColumns(this.gridType, tmpColumns);
		tmpColumns = this._excludePersistenceNameIsNullColumns(tmpColumns);
		tmpColumns = this._sortColumns(tmpColumns);

		tmpColumns.unshift(
			{
				DisplayName: " "
			})

		return tmpColumns;
	};

	ModifyFilterViewModel.prototype._excludePersistenceNameIsNullColumns = function(columns)
	{
		return columns.filter(function(column)
		{
			return column.PersistenceName;
		});
	};

	ModifyFilterViewModel.prototype._sortColumns = function(columns)
	{
		return columns.sort(function(firstCol, secondCol)
		{
			return firstCol.DisplayName.localeCompare(secondCol.DisplayName);
		});
	};

	ModifyFilterViewModel.prototype.verifyClick = function(viewModel, e)
	{
		this.obErrorMessageDivIsShow(false);
		this.obSuccessMessageDivIsShow(false);
		this.obStatementVerify(true);

		tf.loadingIndicator.setSubtitle('Verifying Syntax');
		tf.loadingIndicator.show();
		this.verify().then(function(response)
		{
			tf.loadingIndicator.tryHide();

			this.pageLevelViewModel.obValidationErrors([]);
			this.pageLevelViewModel.obValidationErrorsSpecifed([]);
			this.pageLevelViewModel.obErrorMessageDivIsShow(false);

			this.pageLevelViewModel.obSuccessMessage();
			this.pageLevelViewModel.obSuccessMessageDivIsShow(false);

			var msg = "The syntax of the statement is correct.";
			this.pageLevelViewModel.popupSuccessMessage(msg);
			$('textarea[name=sqlStatement]').closest('.form-group').find(".help-block").hide();
		}.bind(this))
			.catch(function()
			{
				tf.loadingIndicator.tryHide();
				var $field = $("textarea[name='sqlStatement']");
				this.pageLevelViewModel.obErrorMessageDivIsShow(true);
				this.pageLevelViewModel.obValidationErrorsSpecifed([
					{
						field: this._$form.find("textarea[name='sqlStatement']"),
						message: "Filter Statement syntax is invalid"
					}]);
				var validator = $.trim(this.gridFilterDataModel.whereClause()) === '' ? 'notEmpty' : 'callback';
				this._$form.find('[data-bv-validator = "' + validator + '"][data-bv-for="sqlStatement"]').show().closest(".form-group").addClass("has-error");
				$field.focus();
				$('textarea[name=sqlStatement]').closest('.form-group').find(".help-block").text("Invalid Syntax").show();
			}.bind(this));
	};

	ModifyFilterViewModel.prototype.verify = function(getCount)
	{
		if ($.trim(this.gridFilterDataModel.whereClause()) === '')
		{
			return Promise.resolve(false);
		}
		var skip = 0;
		var take = 5;
		var searchData = new TF.SearchParameters(skip, take, self.sorts, self.filters, this.gridFilterDataModel.whereClause(), null, null);
		searchData.data.fields = TF.Grid.LightKendoGrid.prototype.bindNeedFileds(this._gridType, ['Id']);
		searchData.paramData.getCount = getCount ? true : false;
		searchData.data.isQuickSearch = this.gridFilterDataModel.isForQuickSearch();

		var url = null;
		if (this.gridType === 'busfinderhistorical')
			url = pathCombine(tf.api.apiPrefix(), "search/gpsevents/verifyFilterWhereClause");
		else
			url = pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint(this._gridType));

		return tf.promiseAjax.post(url,
			{
				paramData: searchData.paramData,
				data: searchData.data,
				async: false
			},
			{
				overlay: false
			})
			.then(function(response)
			{
				return response;
			})
			.catch(function()
			{
				throw false;
			});
	};

	ModifyFilterViewModel.prototype.save = function()
	{
		var self = this;
		var $filterInput = $('[name=filterName]');
		var $sqlStatementInput = $('[name=sqlStatement]');
		if (!TF.isPhoneDevice)
		{
			// local fieldName verify
			if ($filterInput.val() === '')
			{
				$filterInput.focus();
			}
			else if (this.options && this.options.currentObFilters && this.options.currentObFilters.length > 0)
			{
				this.options.currentObFilters.forEach(function(filter)
				{

					if (self.gridFilterDataModel.id() !== filter.id() &&
						$filterInput.val() === filter.name())
					{
						$filterInput.focus();
					}
				});
			}
		}

		var ua = navigator.userAgent.toLowerCase();
		var isAndroid = ua.indexOf("android") > -1;

		var validSqlStatement = true;
		if (!isAndroid && TF.isPhoneDevice && $filterInput.val() != '')
		{
			if ($.trim($sqlStatementInput.val()) == "")
			{
				validSqlStatement = false;
			} else
			{
				var skip = 0;
				var take = 5;
				var searchData = new TF.SearchParameters(skip, take, self.sorts, self.filters, this.gridFilterDataModel.whereClause(), null, null);
				searchData.data.fields = TF.Grid.LightKendoGrid.prototype.bindNeedFileds(this._gridType, ['Id']);
				searchData.paramData.getCount = false;

				var url = null;
				if (this.gridType === 'busfinderhistorical')
					url = pathCombine(tf.api.apiPrefix(), "search/gpsevents/verifyFilterWhereClause");
				else
					url = pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint(this._gridType));

				tf.ajax.post(url,
					{
						paramData: searchData.paramData,
						data: searchData.data,
						async: false
					},
					{
						overlay: false
					})
					.then(function(response)
					{
						if (response.StatusCode != 200)
						{
							validSqlStatement = false;
						}
					})
			}
		}
		if (!validSqlStatement)
		{
			$sqlStatementInput.closest(".mobile-modal-content-body").scrollTop(320);
			$sqlStatementInput.focus();
			return Promise.reject();
		}

		this.obErrorMessageDivIsShow(false);
		this.obSuccessMessageDivIsShow(false);
		this.obStatementVerify(false);
		var self = this;
		tf.loadingIndicator.setSubtitle('Saving Filter');
		tf.loadingIndicator.show();

		var validator = self._$form.data("bootstrapValidator");

		return this.pageLevelViewModel.saveValidate().then(function(valid)
		{
			tf.loadingIndicator.tryHide();
			if (valid)
			{
				return this._save();
			}
			else
			{
				return Promise.reject();
			}
		}.bind(this));
	};

	ModifyFilterViewModel.prototype._save = function()
	{
		return this.saveReminder().then(function(reminder)
		{
			function setReminder (gridFilterDataModel)
			{
				if (reminder && reminder.Id)
				{
					gridFilterDataModel.reminderId(reminder.Id);
					gridFilterDataModel.reminderName(reminder.Name);
					gridFilterDataModel.reminderUserId(reminder.UserId);
				}
			}
			if (this.gridFilterDataModel.apiIsDirty())
			{
				setReminder(this.gridFilterDataModel);
				this.gridFilterDataModel.omittedRecord(this.obOmitRecords());
				var data = this.gridFilterDataModel.toData();
				data.DBID = TF.Grid.GridHelper.checkFilterContainsDataBaseSpecificFields(this.gridType, this.gridFilterDataModel.whereClause()) ? tf.datasourceManager.databaseId : null;
				data.DataTypeID = tf.DataTypeHelper.getId(data.GridType);
				return tf.promiseAjax[this.isNew === "new" ? "post" : "put"](pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters"),
					{
						paramData: { "@relationships": "OmittedRecord" },
						data: [data]
					})
					.then(function(apiResponse)
					{
						this.gridFilterDataModel.update(apiResponse.Items[0]);
						return this.gridFilterDataModel;
					}.bind(this))
					.catch(function(apiResponse)
					{
						this.obErrorMessageDivIsShow(true);
						this.obValidationErrors([
							{
								message: apiResponse.Message
							}]);
						throw apiResponse;
					});
			}
			else
			{
				setReminder(this.gridFilterDataModel);
				return Promise.resolve(this.gridFilterDataModel);
			}
		}.bind(this));
	};

	ModifyFilterViewModel.prototype.selectFieldClick = function(viewModel, e)
	{
		var columnDefinition = this.obSelectedField();
		if (!columnDefinition || !columnDefinition.FieldName)
		{
			this.obValueFieldType("Disabled");
			return;
		}
		this.insertFragmentToCurrentCursorPostion("[" + columnDefinition.PersistenceName + "]");
		this.obValueFieldType(columnDefinition.TypeCode);
	};

	ModifyFilterViewModel.prototype.selectOperatorClick = function(viewModel, e)
	{
		var value = this.selectedOperator();
		if (value != " ")
		{
			this.insertFragmentToCurrentCursorPostion(value);
		}
	};

	ModifyFilterViewModel.prototype.selectLogicalOperatorClick = function(viewModel, e)
	{
		var value = this.selectedLogicalOperator();
		if (value != " ")
		{
			this.insertFragmentToCurrentCursorPostion(value);
		}
	};

	ModifyFilterViewModel.prototype.valueKeypress = function(viewModel, e)
	{
		if (e.keyCode == 13)
		{
			var baseBox = ko.dataFor(e.target);
			var value = baseBox.value();
			this.insertFragmentToCurrentCursorPostion(this.valueToSQL(baseBox.getType(), value));
			return false;
		}
		return true;
	};

	ModifyFilterViewModel.prototype.insertFragmentToCurrentCursorPostion = function(fragment)
	{
		var cursorPosition = $(this.textAreaElement()).prop("selectionStart");
		var whereClause = this.gridFilterDataModel.whereClause();
		var firstPart = whereClause.substring(0, cursorPosition);
		var secondPart = whereClause.substring(cursorPosition, whereClause.length);
		var pad = 0;
		if (firstPart[firstPart.length - 1] != " " && firstPart.length != 0)
		{
			firstPart = firstPart + " ";
			pad++;
		}
		if (secondPart[0] != " " && secondPart.length != 0)
		{
			secondPart = " " + secondPart;
			pad++;
		}
		whereClause = firstPart + fragment + secondPart;
		this.gridFilterDataModel.whereClause(whereClause);
		$(this.textAreaElement()).prop("selectionStart", cursorPosition + fragment.length + pad);
		$(this.textAreaElement()).prop("selectionEnd", cursorPosition + fragment.length + pad);
		$(this.textAreaElement()).focus();
		this._$form.data('bootstrapValidator').revalidateField("sqlStatement");
	};

	ModifyFilterViewModel.prototype.initialize = function(viewModel, el)
	{
		this._$form = $(el);
		this.initValidation();
	};

	ModifyFilterViewModel.prototype.updateErrors = function($field, errorInfo)
	{
		var self = this;
		var errors = [];
		$.each(self.pageLevelViewModel.obValidationErrors(), function(index, item)
		{
			if ($field[0] === item.field[0])
			{
				if (item.rightMessage.indexOf(errorInfo) >= 0)
				{
					return true;
				}
			}
			errors.push(item);
		});
		self.pageLevelViewModel.obValidationErrors(errors);
		var errorSpecifed = [];
		$.each(self.pageLevelViewModel.obValidationErrorsSpecifed(), function(index, item)
		{
			if ($field[0] === item.field[0])
			{
				if (item.message.indexOf(errorInfo) >= 0)
				{
					return true;
				}
			}
			errorSpecifed.push(item);
		});
		self.pageLevelViewModel.obValidationErrorsSpecifed(errorSpecifed);
	};

	ModifyFilterViewModel.prototype.initValidation = function(argument)
	{
		setTimeout(function()
		{
			var isValidating = false,
				self = this;

			if (!(TF.isSafari && TF.isMobileDevice && !TF.isPhoneDevice))
				this._$form.find(':text:eq(0)').focus();

			var fields = {
				filterName:
				{
					trigger: "change blur",
					validators:
					{
						notEmpty:
						{
							message: " required"
						},
						callback:
						{
							message: " must be unique",
							callback: function(value, validator, $field)
							{
								if (!value)
								{
									self.updateErrors($field, "unique");
									return true;
								}
								else
								{
									self.updateErrors($field, "required");
								}

								var data = this.gridFilterDataModel.toData();
								return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters"),
									{
										paramData: {
											"@filter": String.format("eq(datatypeId,{1})&eq(name,{2})",
												tf.datasourceManager.databaseId, data.DataTypeID, data.Name),
											"@fields": "DBID,Name"
										},
										data: data,
										async: false
									},
									{
										overlay: false
									})
									.then(function(apiResponse)
									{
										if (apiResponse.Items.length === 0 ||
											(!self.isNew &&
												apiResponse.Items[0].Name === data.Name))
										{
											return true;
										}

										var existFilter = apiResponse.Items[0];
										if (existFilter.DBID != null && existFilter.DBID != tf.datasourceManager.databaseId)
										{
											return { valid: false, message: "Filter already exists in other data source." };
										}

										return { valid: false, message: "Filter already exists current data source." };
									});
							}.bind(this)
						}
					}
				},
				sqlStatement:
				{
					trigger: "blur change",
					validators:
					{
						callback:
						{
							message: "Invalid Syntax",
							callback: function(value, validator, $field)
							{
								if (!value)
								{
									self.updateErrors($field, "invalid");
								}
								else
								{
									self.updateErrors($field, "required");
								}
								if ($.trim(value) !== '')
								{
									return this.verify().then(function(response)
									{
										if (response.StatusCode === 400)
										{
											setTimeout(function()
											{ //put data source name into message.
												$('textarea[name=sqlStatement]').closest('.form-group').find(".help-block").text("Invalid Syntax");
												self.pageLevelViewModel.obSuccessMessageDivIsShow(false);
											}.bind(this));
											return false;
										}
										return true;
									}).catch(function()
									{
										setTimeout(function()
										{ //put data source name into message.
											$('textarea[name=sqlStatement]').closest('.form-group').find(".help-block").text("Invalid Syntax");
											self.pageLevelViewModel.obSuccessMessageDivIsShow(false);
										}.bind(this));
										return false;
									});
								}
								else
								{
									if (this.obOmitRecords().length === 0)
									{
										return {
											valid: false, // or false
											message: ' required'
										};
									}
									else
									{
										return true;
									}
								}
							}.bind(this)
						}
					}
				}
			};

			this._$form
				.bootstrapValidator(
					{
						excluded: [':hidden', ':not(:visible)'],
						live: 'enabled',
						message: 'This value is not valid',
						fields: fields
					})
			this.pageLevelViewModel.load(this._$form.data("bootstrapValidator"));
		}.bind(this), 0);
	};

	ModifyFilterViewModel.prototype.apply = function()
	{
		return this.save()
			.then(function(gridFilterDataModel)
			{
				if (TF.menuHelper)
				{
					TF.menuHelper.hiddenMenu();
				}
				return {
					applyOnSave: this.obApplyOnSave(),
					savedGridFilterDataModel: gridFilterDataModel
				}
			}.bind(this));
	};

	ModifyFilterViewModel.prototype.focusField = function(viewModel, e)
	{
		if (viewModel.field)
		{
			$(viewModel.field).focus();
		}

	};

	ModifyFilterViewModel.prototype.cancel = function()
	{
		return new Promise(function(resolve, reject)
		{
			if (this.gridFilterDataModel.apiIsDirty() || (this.obReminderEnable() && this.obReminderDataModel().apiIsDirty()))
			{
				resolve(tf.promiseBootbox.yesNo("You have unsaved changes.  Would you like to save your changes prior to canceling?", "Unsaved Changes"));
			}
			else
			{
				resolve(false);
			}
		}.bind(this));
	};

	ModifyFilterViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

	ModifyFilterViewModel.prototype.removeAllOmitRecords = function(e)
	{
		this.obOmitRecords([]);
		$(".OmitRecord").remove();
		this.gridFilterDataModel.apiIsDirty(true);
	};

	ModifyFilterViewModel.prototype.cleanOmittedRecord = function(viewModel, e)
	{
		return function()
		{
			var currentOmitRecords = [];
			for (var i = 0; i < this.obOmitRecords().length; i++)
			{
				if (this.obOmitRecords()[i].OmittedRecordId != viewModel.OmittedRecordId)
				{
					currentOmitRecords.push(this.obOmitRecords()[i]);
				}
			}
			this.obOmitRecords(currentOmitRecords);
			if (e.parentElement && e.parentElement.remove)
			{
				e.parentElement.remove();
			}
			this.gridFilterDataModel.apiIsDirty(true);
		}.bind(this);
	};

	ModifyFilterViewModel.prototype.valueToSQL = function(type, value)
	{
		switch (type)
		{
			case "Disabled":
				return "";
				break;
			case "Boolean":
				return (value == "True" ? 1 : 0).toString();
				break;
			case "String":
			case "DateTime":
			case "Date":
			case "Time":
				return "'" + value + "'";
				break;
			case "Integer":
			case "Decimal":
				return value;
		}
	};
})();


(function()
{
	ModifyFilterViewModel = TF.Grid.ModifyFilterViewModel;
	ModifyFilterViewModel.prototype.initReminder = function()
	{
		this.obSetReminder = ko.observable(false);
		this.obReminderEnable = ko.observable(false);
		if (!this.options || this.options.isSetReminder !== true)
		{
			return;
		}
		this.obSetReminder(true);
		this.obReminderDataModel = ko.observable(new TF.DataModel.ReminderDataModel(
			{
				UserId: tf.authManager.authorizationInfo.authorizationTree.userId,
				FilterId: this.gridFilterDataModel.id(),
				SharedWithList: []
			}));
		this.selectedUser = [];
	};

	ModifyFilterViewModel.prototype.reminderSelectUser = function()
	{
		var self = this;
		tf.modalManager.showModal(
			new TF.Modal.ListMoverSelectUserControlModalViewModel(
				self.selectedUser
			))
			.then(function(selectedRecord)
			{
				if ($.isArray(selectedRecord))
				{
					self.selectedUser = selectedRecord;
					this.obReminderDataModel().sharedWithList(selectedRecord.map(function(user)
					{
						return {
							Id: 0,
							LastName: user.LastName,
							FirstName: user.FirstName,
							UserId: user.Id,
							Email: user.Email,
							LoginId: user.LoginId
						};
					}));
				}
			}.bind(this));
	};

	ModifyFilterViewModel.prototype.saveReminder = function()
	{
		if (!this.obReminderEnable())
		{
			return Promise.resolve(true);
		}
		return TF.ReminderHelper.save(this.obReminderDataModel().toData());
	};
})();
