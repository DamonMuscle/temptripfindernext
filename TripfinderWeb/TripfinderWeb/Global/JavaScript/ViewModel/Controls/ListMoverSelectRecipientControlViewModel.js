(function()
{
	createNamespace('TF.Control').ListMoverSelectRecipientControlViewModel = ListMoverSelectRecipientControlViewModel;
	function ListMoverSelectRecipientControlViewModel(selectedData, options)
	{
		if (options.columnSources)
		{
			this.columnSources = options.columnSources;
		}

		options.serverPaging = true;

		TF.Control.KendoListMoverWithSearchControlViewModel.call(this, selectedData, options);
	}

	ListMoverSelectRecipientControlViewModel.prototype = Object.create(TF.Control.KendoListMoverWithSearchControlViewModel.prototype);
	ListMoverSelectRecipientControlViewModel.prototype.constructor = ListMoverSelectRecipientControlViewModel;

	ListMoverSelectRecipientControlViewModel.prototype.columnSources = {
		user: [
			{
				FieldName: "Id",
				DisplayName: "ID",
				DBName: "ID",
				Width: '150px',
				type: "integer",
				hidden: true,
				onlyForFilter: true
			},
			{
				FieldName: "LoginID",
				DisplayName: "Login",
				Width: "100px",
				type: "string",
				isSortItem: true
			},
			{
				FieldName: "LastName",
				DisplayName: "Last Name",
				Width: "100px",
				type: "string",
				isSortItem: true
			},
			{
				FieldName: "FirstName",
				DisplayName: "First Name",
				Width: "100px",
				type: "string"
			},
			{
				FieldName: "Email",
				DisplayName: "Email",
				Width: "120px",
				type: "string"
			}
		]
	};

	ListMoverSelectRecipientControlViewModel.prototype.initGridScrollBar = function(container)
	{//need check soon.
		var $gridContent = container.find(".k-grid-content");
		$gridContent.css({
			"overflow-y": "auto"
		});


		if ($gridContent[0].clientHeight == $gridContent[0].scrollHeight)
		{
			$gridContent.find("colgroup col:last").css({
				width: 137
			});
		}
		else
		{
			$gridContent.find("colgroup col:last").css({
				width: 120
			});
		}
	};

	ListMoverSelectRecipientControlViewModel.prototype.onBeforeLeftGridDataBound = function(leftSearchGrid)
	{
		TF.Control.KendoListMoverWithSearchControlViewModel.prototype.onBeforeLeftGridDataBound.call(leftSearchGrid);
		var self = this;
		if (self.options.emailCheck === false)
		{
			return;
		}

		var emailColumnIndex = (self.options.type === "contact" || self.options.type === "staff") ? 2 : 3;

		leftSearchGrid.$container.find(".k-grid-content table[role=grid] tr").map(function(idx, row)
		{
			var $row = $(row);
			var $colMail = $row.find("td").eq(emailColumnIndex);
			if (!$colMail.text().trim() || (self.options.type === "user" && $row.find("td").eq(4).text() === "true"))
			{
				$row.addClass("disable").css("color", "grey").bind("select", function(e)
				{
					e.preventDefault();
				});
			}
		});
	};

	ListMoverSelectRecipientControlViewModel.prototype.onLeftGridChange = function(e, rowsData)
	{
		var isDisableRow = false;
		var $selectRows = this.leftSearchGrid.kendoGrid.select();
		$selectRows.map(function(idx, row)
		{
			var $row = $(row);
			if ($row.hasClass("disable"))
			{
				$row.removeClass("k-state-selected");
				isDisableRow = true;
			}
		}.bind(this));

		if (isDisableRow)
			this._clearLeftSelection();
		else
			this._obLeftSelData(rowsData);

		if (this._obLeftSelData().length > 0)
			this._clearRightSelection();
	};

	ListMoverSelectRecipientControlViewModel.prototype.filterToRightData = function(data)
	{
		return data.filter(function(row)
		{
			if (row.Email)
				return true;
		});
	};

	ListMoverSelectRecipientControlViewModel.prototype.apply = function()
	{
		return TF.Control.KendoListMoverWithSearchControlViewModel.prototype.apply.call(this).then(function(selectedData)
		{
			return selectedData;
		});
	};

	ListMoverSelectRecipientControlViewModel.prototype.cancel = function()
	{
		return new Promise(function(resolve, reject)
		{
			if (!isArraySame(this.oldData, this.selectedData))
			{
				return tf.promiseBootbox.yesNo("You have unsaved changes.  Would you like to save your changes prior to canceling?", "Unsaved Changes").then(function(result)
				{
					if (result)
					{
						resolve(this.selectedData);
					}
					else
					{
						resolve(false);
					}
				}.bind(this));
			} else
			{
				resolve(true);
			}
		}.bind(this));
	};

	function isArraySame(oldData, newData)
	{
		if (newData.length != oldData.length)
		{
			return false;
		}
		var oldIds = oldData.map(function(item)
		{
			return item.Id;
		});
		var newIds = newData.map(function(item)
		{
			return item.Id;
		});
		var diffData1 = Enumerable.From(newIds).Where(function(x)
		{
			return !Array.contain(oldIds, x);
		}).ToArray();
		var diffData2 = Enumerable.From(oldIds).Where(function(x)
		{
			return !Array.contain(newIds, x);
		}).ToArray();
		return diffData1.length == 0 && diffData2.length == 0;
	}
})();
