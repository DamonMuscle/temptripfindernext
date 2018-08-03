(function()
{
	var namespace = createNamespace("TF.Grid");

	namespace.DocumentDirectoryViewModel = DocumentDirectoryViewModel;

	function DocumentDirectoryViewModel()
	{
		this.id;
		this.type = "document";
		this.dataViewTemplateName = "workspace/dataview/document/view";
		this.$element;

		this.obPageTitle = ko.observable();
		this.obImageUrl = ko.observable();
		this.obPDFUrl = ko.observable();

		this.baseDeletion = new TF.Executor.DocumentDeletion();

		this.viewClick = this.viewClick.bind(this);
		this.printClick = this.printClick.bind(this);
		this.editClick = this.editClick.bind(this);
		this.deleteSelectionClick = this.deleteSelectionClick.bind(this);

	};

	DocumentDirectoryViewModel.prototype.constructor = DocumentDirectoryViewModel;

	DocumentDirectoryViewModel.prototype.load = function(item)
	{
		this.id = item.Id;
		this.obPageTitle(item.Filename);
		this.obPDFUrl(undefined);
		this.obImageUrl(undefined);

		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "document/file", this.id))
			.then(function(response)
			{
				switch (item.MimeType)
				{
					case "image/jpeg":
						this.obImageUrl('data:image/jpeg;base64,' + response);
						break;
					case "application/pdf":
						this.obPDFUrl('data:application/pdf;base64,' + response);
						break;
					case "text/plain":
						this.obPDFUrl('data:text/plain;base64,' + response);
						break;
					default:
						this.obPDFUrl('data:application/pdf;base64,' + response);
						break;
				}
			}.bind(this));
	}

	DocumentDirectoryViewModel.prototype.viewClick = function(viewModel, e)
	{
		if (this.id)
			tf.documentManagerViewModel.add(new TF.Document.DocumentData(TF.Document.DocumentData.DataView, { type: this.type, ids: [this.id], tabNames: "123" }));
	};

	DocumentDirectoryViewModel.prototype.printClick = function(viewModel, e)
	{
		var docs = $('[class=docs]'), printElement = $('[class=doc-print]'), content = this.$element.find(".content");
		docs.css("display", "none");
		printElement.css("display", "table");
		printElement.find(".print-cell")[0].innerHTML = content[0].innerHTML;
		window.print();
		printElement.find(".print-cell")[0].innerHTML = "";
		printElement.css("display", "none");
		docs.css("display", "block");
	};

	DocumentDirectoryViewModel.prototype.editClick = function(viewModel, e)
	{
		if (this.id)
			tf.modalManager.showModal(new TF.Modal.DocumentModalViewModel({ documentId: this.id }));
	};

	DocumentDirectoryViewModel.prototype.deleteSelectionClick = function(viewModel, e)
	{
		if (this.id)
			this.baseDeletion.execute([this.id]);
	};

	DocumentDirectoryViewModel.prototype.init = function(viewModel, e)
	{
		this.$element = $(e);
	};

	DocumentDirectoryViewModel.prototype.dispose = function()
	{
	};
})();
