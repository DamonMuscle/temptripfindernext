(function()
{
	createNamespace("TF.DetailView").MergeDocumentsSentDetailViewViewModel = MergeDocumentsSentDetailViewViewModel;

	/*****************************
	 * 
	 * we should make naming unified.
	 * 
	 * layoutTemplate: detail screen entity
	 * layoutId: detail screen id
	 * recordEntity: entity in grid rows
	 * recordId: the id of entity in grid rows
	 * 
	 * ***************************/

	/**
	 * Constructor
	 * @returns {void}
	 */
	function MergeDocumentsSentDetailViewViewModel(recordId, dataType, routeState, pageLevelViewModel, isReadOnly, options, parentDocument)
	{
		var self = this;
		options.isDetailView = true;
		self.gridType = dataType;
		self.isConectWithLeftPanel = true;
		self.obTitle = ko.observable('');
		self.obEntityData = ko.observable({});

		if (recordId)
		{
			self.obTitle("Sent Merge");
			self.initData(self.gridType, recordId);
		}

		self.parentDocument = parentDocument;
		self.pageType = "detailview";
		self.routeState = routeState;
		self.recordId = recordId;

		//Events
		self.onCloseDetailEvent = new TF.Events.Event();
		self.onInitComplete = new TF.Events.Event();
		self.onResizePage = new TF.Events.Event();
		self.pageLevelViewModel = pageLevelViewModel;

		self.bodyKendoEditor = null;
	}

	MergeDocumentsSentDetailViewViewModel.prototype = Object.create(Object.prototype);
	MergeDocumentsSentDetailViewViewModel.prototype.constructor = MergeDocumentsSentDetailViewViewModel;

	/**
	* Initialize.
	* @param {object} current view model
	* @param {dom} element
	* @returns {void}
	*/
	MergeDocumentsSentDetailViewViewModel.prototype.init = function(model, element)
	{
		var self = this;
		if (!self.bodyKendoEditor)
		{
			$(element).find("#sentMergeBodyEditor").kendoEditor();
			self.bodyKendoEditor = $("#sentMergeBodyEditor").data("kendoEditor");
		}

		if (self.bodyKendoEditor)
		{
			self.bodyKendoEditor.value(self.obEntityData().Body);
			const editorBody = $(self.bodyKendoEditor.body);
			editorBody.removeAttr("contenteditable").find("a").on("click.readonly", false);
			editorBody.css("background", "#eee");
			editorBody.on("contextmenu", function() { return false; });
			self.bodyKendoEditor.toolbar.element.hide();
		}

		self.initialized = true;
		self.onInitComplete.notify();
	};

	MergeDocumentsSentDetailViewViewModel.prototype.initData = function(gridType, recordId)
	{
		var self = this;
		self.getRecordEntity(gridType, recordId).then(res =>
		{
			if (res)
			{
				res.Body = self.updateImages(res.Body);

				const dt = utcToClientTimeZone(res.SentOn);
				res.SentOn = dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
				self.obEntityData(res);
				self.dataInitialized = true;
			}
		})
	};

	MergeDocumentsSentDetailViewViewModel.prototype.updateImages = function(body)
	{
		let container = $("<div>").append($(body));
		let imgs = container.find("img[src^='cid']");
		$.each(imgs, (i, img) =>
		{
			//substring "cid:", length = 4
			let id = $(img).attr("src").slice(4);
			let content = container.find(`#${id}`).html();
			container.find(`img[src='cid:${id}']`).attr("src", `data:image/png;base64,${content}`);
		});
		return container.html();
	};

	/**
	 * Get the record entity by type and id.
	 * @param {String} gridType
	 * @param {Number} recordId
	 */
	MergeDocumentsSentDetailViewViewModel.prototype.getRecordEntity = function(gridType, recordId)
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "search", "mergedocumentssents"), {
			data: {
				fields: ["Name", "Description", "RecipientEmail", "Subject", "Body", "LoginID", "SentOn", "SentAs", "Id", "SentResult", "DataTypeName", "MergeTemplateTypeName", "RecordName"],
				idFilter: {
					IncludeOnly: [recordId]
				}
			}
		}).then(function(response)
		{
			return response.Items[0];
		});
	};

	MergeDocumentsSentDetailViewViewModel.prototype.manageLayout = function()
	{
	};

	/**
	 * The close detail function.
	 * @return {void}
	 */
	MergeDocumentsSentDetailViewViewModel.prototype.closeDetailClick = function(data, e)
	{
		var self = this;
		self.onCloseDetailEvent.notify();
		return Promise.resolve(true);
	};

	/**
		* The dispose function.
		* @returns {void}
		*/
	MergeDocumentsSentDetailViewViewModel.prototype.dispose = function()
	{
		var self = this;
		self.bodyKendoEditor && self.bodyKendoEditor.destroy();
		tfdispose(self);
	};
})();
