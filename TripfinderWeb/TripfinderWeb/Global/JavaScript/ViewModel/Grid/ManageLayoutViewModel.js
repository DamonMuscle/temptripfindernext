(function()
{
	createNamespace("TF.Grid").ManageLayoutViewModel = ManageLayoutViewModel;

	function ManageLayoutViewModel(obGridLayoutExtendedDataModels, obGridFilterDataModels, obGridThematicDataModels, fnSaveAndEditGridLayout, fnApplyGridLayout, positiveClose, options, reloadLayout)
	{
		this.obGridLayoutExtendedDataModels = obGridLayoutExtendedDataModels;
		this.obGridFilterDataModels = obGridFilterDataModels;
		this.obGridThematicDataModels = obGridThematicDataModels;
		this.fnSaveAndEditGridLayout = fnSaveAndEditGridLayout;
		this.fnApplyGridLayout = fnApplyGridLayout;
		this.reloadLayout = reloadLayout;
		this.positiveClose = positiveClose;
		this.element = null;
		this.gridType = options.gridType;
		this.gridData = options.gridData;
		this.thematicKendoGrid = null;
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		const isThematicSupported = tf.dataTypeHelper.checkGridThematicSupport(this.gridType);
		this.obThematicSupported = ko.observable(isThematicSupported);
		this.enableGridRefresh = true;
		this.layoutModelJSONString = null
	}

	ManageLayoutViewModel.prototype.init = function(viewModel, el)
	{
		this.element = $(el);
		if (this.enableGridRefresh)
		{
			this.initLayoutGrid();
		}
	};

	ManageLayoutViewModel.prototype.initLayoutGrid = function()
	{
		const self = this;
		this.obGridLayoutExtendedDataModels.sort(function(left, right)
		{
			return left.name().toLowerCase() == right.name().toLowerCase() ? 0 : (left.name().toLowerCase() < right.name().toLowerCase() ? -1 : 1);
		});
		const layouts = self.obGridLayoutExtendedDataModels().map((layout) => layout.toData());
		const $gridContainer = self.element.find(".managelayoutgrid-container");
		if (self.thematicKendoGrid)
		{
			self.thematicKendoGrid.destroy();
		}

		$gridContainer.kendoGrid({
			dataSource: { data: layouts },
			height: 300,
			scrollable: true,
			selectable: true,
			columns: self.getLayoutGridColumns(),
		});

		self.thematicKendoGrid = $gridContainer.data("kendoGrid");

		$gridContainer.find(".k-grid-content table[role=grid] tr").dblclick(function(e)
		{
			var gridLayoutExtendedDataModel = self.getGridLayoutDataModel(e);
			self.fnApplyGridLayout(gridLayoutExtendedDataModel)
				.then(function(ans)
				{
					if (ans !== false)
					{
						self.positiveClose();
					}
				});
		});

		const $gridContent = self.element.find(".k-grid-content");
		$gridContent.css({ "overflow-y": "auto" });

		if ($gridContent.children('table').height() <= $gridContent.height())
		{
			$gridContainer.find('.k-grid-header').css({ 'padding-right': '0' });
		}

		self.initUploader();
	};

	ManageLayoutViewModel.prototype.initUploader = function()
	{
		const self = this;
		self.uploadHelper = new TF.UploadHelper({
			maxFileByteSize: 5 * 1024 * 1024,
			acceptFileExtensions: [".tfgridlayout"],
			acceptMimeType: ".tfgridlayout",
			onFileSelected: self.onSelectedLayoutFile.bind(self)
		});

		self.$fileSelector = self.uploadHelper.createFileSelector("layout-file-selector");
		self.element.append(self.$fileSelector);
		self.uploadHelper.init(self.$fileSelector);
	};

	ManageLayoutViewModel.prototype.getLayoutGridColumns = function()
	{
		const self = this;
		return [{
			field: "Name",
			title: "Name",
			encoded: true,
			template: function(dataItem)
			{
				return `<span title="${kendo.htmlEncode(dataItem.Name)}">${kendo.htmlEncode(dataItem.Name)}</span>`;
			}
		},
		{
			field: "Description",
			title: "Description"
		},
		{
			field: "FilterName",
			title: "Filter",
			template: (data) => data.FilterId ? data.FilterName : ""
		},
		{
			field: "ThematicName",
			title: "Thematic",
			hidden: !self.obThematicSupported(),
			template: (data) => data.ThematicId ? data.ThematicName : "",
		},
		{
			field: "AutoExportExists",
			title: "Data Export Layout",
			template: '<input type="checkbox" disabled #: AutoExportExists ? "checked" : "" # />',
			attributes: {
				class: "text-center"
			}
		},
		{
			command: [
				{
					name: "export",
					template: '<a role="button" class="k-button k-button-icontext k-grid-export" title="Export"></a>',
					click: function(e)
					{
						e.preventDefault();
						self.exportAndDownloadData(self.getGridLayoutDataModel(e));
					}
				},
				{
					name: "edit",
					click: function(e)
					{
						e.preventDefault();
						self.editGridLayout(self.getGridLayoutDataModel(e));
					}
				},
				{
					name: "delete",
					click: function(e)
					{
						e.preventDefault();
						self.deleteGridLayout(self.getGridLayoutDataModel(e));
					}
				}],
			width: "100px",
			title: "Action",
			attributes: {
				class: "text-center"
			}
		}];
	};


	ManageLayoutViewModel.prototype.getGridLayoutDataModel = function(e)
	{
		const $dataRow = $(e.target).closest("tr");
		var data = this.thematicKendoGrid.dataItem($dataRow);
		return this.obGridLayoutExtendedDataModels().filter(function(item)
		{
			return item.id() === data.Id;
		})[0];
	};

	/**
	 * export and download layout file by id.
	 * @param {*} gridLayout 
	 */
	ManageLayoutViewModel.prototype.exportAndDownloadData = function(gridLayout)
	{
		const downloadUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), "GridLayouts", gridLayout.id(), "export");
		tf.promiseAjax.get(downloadUrl, {
			success: (_data, xhr) =>
			{
				const contentType = xhr.getResponseHeader("content-type");
				const fileNameInDisposition = (xhr.getResponseHeader("content-disposition") || "").split(";").find(x => x.trim().indexOf("filename") >= 0);
				const fileName = fileNameInDisposition ? fileNameInDisposition.split("=")[1].trim().replace(/^"|"$/g, '') : "layout.tfgridlayout";
				TF.URLHelper.downloadFileGenerator([xhr.responseText], { type: contentType }, fileName);
			}
		});
	}

	ManageLayoutViewModel.prototype.editGridLayout = function(gridLayout)
	{
		const editTask = this.fnSaveAndEditGridLayout("edit", gridLayout);
		this.enableGridRefresh = false;
		this.layoutModelJSONString = gridLayout ? JSON.stringify(gridLayout.toData()) : null;

		Promise.resolve(editTask)
			.then((result) =>
			{
				let resultLayoutModelJSONString = typeof result === "object" ? JSON.stringify(result.toData()) : null;
				if (resultLayoutModelJSONString && this.layoutModelJSONString !== resultLayoutModelJSONString)
				{
					this.initLayoutGrid();
				}
			}).finally(() =>
			{
				this.enableGridRefresh = true;
			});
	};

	/**
	 * Delete grid layout.
	 *
	 * @param {*} gridLayout
	 * @return {*} 
	 */
	ManageLayoutViewModel.prototype.deleteGridLayout = function(gridLayout)
	{
		const self = this;
		if (gridLayout.autoExportExists())
		{
			const isSigular = !gridLayout.autoExports() || gridLayout.autoExports().length === 1;
			const exportsHolder = `data export${isSigular ? "" : "s"}`;
			tf.promiseBootbox.alert(`This layout is associated with the ${gridLayout.autoExportNames()} ${exportsHolder}. It cannot be deleted.`);
			return;
		}

		self.enableGridRefresh = false;
		tf.promiseBootbox.yesNo("Are you sure you want to delete this layout?", "Delete Confirmation")
			.then(function(result)
			{
				if (result)
				{
					return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts", gridLayout.id()))
				}
				else
				{
					return null;
				}
			})
			.then(function(apiResponse)
			{
				if (apiResponse)
				{
					self.obGridLayoutExtendedDataModels.remove(gridLayout);
					self.initLayoutGrid();
				}
			})
			.finally(function()
			{
				self.enableGridRefresh = true;
			});
	};

	ManageLayoutViewModel.prototype.importButtonClick = function(vm, e)
	{
		const $fileSelector = this.uploadHelper.uploader.wrapper.find("#layout-file-selector");
		e.stopPropagation();
		$fileSelector && $fileSelector.trigger('click');
	}

	ManageLayoutViewModel.prototype.onSelectedLayoutFile = function()
	{
		const self = this;
		setTimeout(() =>
		{
			const selectedFile = (self.uploadHelper.getFiles() || [])[0];
			if (!selectedFile || !selectedFile.rawFile)
			{
				return;
			}

			const fileReader = new FileReader();
			fileReader.readAsText(selectedFile.rawFile);
			fileReader.onerror = (e) =>
			{
				tf.promiseBootbox.alert('Load file error!');
				self.clearImportFiles();
			};
			fileReader.onload = (e) =>
			{
				if (!fileReader.result)
				{
					self.clearImportFiles();
					tf.promiseBootbox.alert('File content is blank!');
					return;
				}

				const layout = JSON.parse(fileReader.result);
				self.importLayout(layout);
			}
		}, 0);
	}

	ManageLayoutViewModel.prototype.importLayout = function(layout)
	{
		const self = this;
		const udgridId = self.gridType === 'form' && self.gridData.value;
		let paramData = { dataTypeId: tf.dataTypeHelper.getId(self.gridType) };
		if (udgridId)
		{
			paramData = $.extend(paramData, { udgridId });
		}

		tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'GridLayouts', 'import'),
			{
				paramData,
				data: layout,
			}).then((result) =>
			{
				self.enableGridRefresh = false;
				self.reloadLayout().then(() =>
				{
					self.initLayoutGrid();
					const importSummary = result.Items[0];
					if (importSummary.LayoutColumnsLog && importSummary.LayoutColumnsLog.length > 0)
					{
						const message = [importSummary.ImportMessage].concat(importSummary.LayoutColumnsLog).join('\r\n');
						tf.promiseBootbox.alert(message);
					}
					else
					{
						self.pageLevelViewModel.clearError();
						self.pageLevelViewModel.popupSuccessMessage(importSummary.ImportMessage);
					}
				}).finally(() =>
				{
					self.enableGridRefresh = true;
				});
			}).catch(error =>
			{
				self.pageLevelViewModel.clearError();
				self.pageLevelViewModel.popupErrorMessage((error && error.Message) || 'There was an error.');
			});
		self.clearImportFiles();
	}

	ManageLayoutViewModel.prototype.clearImportFiles = function()
	{
		this.$fileSelector.val("");
		this.uploadHelper.clearAllFiles();
	}
})();

(function()
{
	createNamespace("TF.Grid.Layout").LayoutExtenstion = LayoutExtenstion;

	function LayoutExtenstion()
	{ }

	LayoutExtenstion.prototype.getDataExportImg = function(value)
	{
		if (value)
		{
			return "dataexport";
		}
	};

	tf.LayoutExtenstion = new TF.Grid.Layout.LayoutExtenstion();

})();
