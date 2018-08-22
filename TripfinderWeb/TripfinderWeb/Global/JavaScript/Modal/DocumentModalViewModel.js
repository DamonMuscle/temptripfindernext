(function()
{
	createNamespace('TF.Modal').DocumentModalViewModel = DocumentModalViewModel;

	function DocumentModalViewModel(options)
	{
		this.options = options;
		//documentId, files, objtype, objid
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/documentcontrol');
		this.buttonTemplate('modal/positivenegative');
		this.associations = [];
		this.obSelectedAssociations = ko.observable([]);
		this.editDocumentViewModel = new TF.Control.EditDocumentViewModel(
			"document",
			0,
			options.documentId,
			options.files,
			this.obSelectedAssociations,
			options.parentType,
			options.parentId,
			options.documentData,
			options.documentEntities
		);
		this.data(this.editDocumentViewModel);
		this.sizeCss = "modal-sm";
		this.description("Browse and select the file you would like to upload, select a Classification, and enter a Description.");
		this.documentId = this.options.documentId;
		if (options.documentData)
		{
			this.title("Edit Document");
			var type, attachIds = [], promiseAll = [], documentRelationshipEntities = options.documentData.DocumentRelationshipEntities;
			if (documentRelationshipEntities.length > 0)
			{
				for (var i = 0; i < documentRelationshipEntities.length; i++)
				{
					type = documentRelationshipEntities[i].AttachedToType;
					attachIds.push(documentRelationshipEntities[i].AttachedToId);
				}
				promiseAll.push(tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), type, this.getUrlIdsName(type)), { data: attachIds })
					.then(function(data)
					{
						var name, displayType;
						for (var i in data.Items)
						{
							name = tf.EntityHelper.getEntityName(this.type, data.Items[i]);
							displayType = tf.EntityHelper.getEntityType(this.type).display;
							if (!!name && !!displayType)
							{
								this.model.associations.push({
									DisplayName: name,
									FieldName: name,
									Id: data.Items[i].Id,
									Type: displayType,
									FieldType: this.type
								});
							}
						}
					}.bind({ model: this, type: type })));
				Promise.all(promiseAll)
					.then(function()
					{
						this.obSelectedAssociations(this.associations);
					}.bind(this));
			}
		} else
		{
			this.title("Add Documents");
			if (options.parentId && options.parentId > 0)
			{
				this.getParentName(options.parentType, options.parentId)
					.then(function(data)
					{
						var name = tf.EntityHelper.getEntityName(options.parentType, data.Items[0]);
						var displayType = tf.EntityHelper.getEntityType(options.parentType).display;
						if (!!name && !!displayType)
						{
							this.associations.push({
								DisplayName: name,
								FieldName: name,
								Id: options.parentId,
								Type: displayType,
								FieldType: options.parentType
							});
							this.obSelectedAssociations(this.associations);
							this.editDocumentViewModel.setInitAssociations(this.associations);
						}
					}.bind(this));
			}
			else if (options.parentType)
			{
				this.associations.push({
					DisplayName: "This Record",
					Id: 0,
					Type: tf.EntityHelper.getEntityType(options.parentType).display,
					FieldType: options.parentType
				});
				this.obSelectedAssociations(this.associations);
				this.editDocumentViewModel.setInitAssociations(this.associations);
			}
		}
		this.obPositiveButtonLabel = ko.observable("Attach");

		this.selectedAssociations = this.selectedAssociations.bind(this);
	}

	DocumentModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	DocumentModalViewModel.prototype.constructor = DocumentModalViewModel;

	DocumentModalViewModel.prototype.getParentName = function(type, id)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), type, id));
	}


	DocumentModalViewModel.prototype.getUrlIdsName = function(type)
	{
		switch (type)
		{
			case "GeoRegions":
				return "getGeoregions";
			case "Trips":
				return "batch";
			default:
				return "ids";
		}
	}

	DocumentModalViewModel.prototype.positiveClick = function()
	{
		this.editDocumentViewModel.apply().then(function(response)
		{
			if (response)
			{
				this.positiveClose(response);

				if (response.data && response.data.APIIsNew)
				{
					// response.data["options"] = this.options;
					// var callback = function()
					// {
					// 	PubSub.publish(topicCombine(pb.DATA_CHANGE, "document", pb.EDIT));
					// }
					// this.showMessageBox(response.data, callback);
					this.positiveClose(response);
				}
			}
		}.bind(this));
	};

	DocumentModalViewModel.prototype.negativeClose = function(returnData)
	{
		if (this.editDocumentViewModel.obEntityDataModel().apiIsDirty())
		{
			return tf.promiseBootbox.yesNo({ message: "You have unsaved changes.  Would you like to save your changes prior to closing?", backdrop: true, title: "Unsaved Changes", closeButton: true })
				.then(function(result)
				{
					if (result == true)
					{
						return this.positiveClick();
					}
					if (result == false)
					{
						return TF.Modal.BaseModalViewModel.prototype.negativeClose.call(this, returnData);
					}
				}.bind(this));
		}
		else
		{
			TF.Modal.BaseModalViewModel.prototype.negativeClose.call(this, returnData);
		}
	};

	DocumentModalViewModel.prototype.generateFunction = function(fn)
	{
		return fn.bind(this, Array.prototype.slice.call(arguments, 1));
	}

	DocumentModalViewModel.prototype.addDocumentClassification = function(parameters)
	{
		tf.modalManager.showModal(new TF.Modal.AddTwoFieldsModalViewModel("documentclassification"))
			.then(function(data)
			{
				if (!data)
				{
					return;
				}
				parameters[1].push(data);
				this.editDocumentViewModel.obEntityDataModel().documentClassificationId(data.Id);
			}.bind(this));
	}

	DocumentModalViewModel.prototype.showMessageBox = function(result, callback)
	{
		if (result)
		{
			var documentCount = result.DocumentEntities.length;
			var associationsEntities = result.DocumentRelationshipEntities;
			var associationsCount = associationsEntities.length;

			if (associationsCount > 0)
			{
				var hasThisRecord = false;
				if (result.options)
				{
					var thisRecordId = result.options.parentId;
					for (var i = 0; i < associationsCount; i++)
					{
						if (thisRecordId == associationsEntities[i].AttachedToId)
						{
							hasThisRecord = true;
							break;
						}
					}
				}
			}

			var title = (documentCount == 1) ? "Document Successfully Uploaded" : "Documents Successfully Uploaded";
			var message = null;
			if (documentCount == 1)
			{
				if (associationsCount == 0)
				{
					message = "The document has been successfully uploaded to the Document Center.";
				} else if (associationsCount == 1)
				{
					message = hasThisRecord ? "The document has been successfully uploaded to the Document Center and associated with this record." : "The document has been successfully uploaded to the Document Center and associated with 1 other record.";
				} else if (associationsCount > 1)
				{
					if (hasThisRecord)
					{
						message = associationsCount == 2 ? "The document has been successfully uploaded to the Document Center, this record, and associated with 1 other record." : "The document has been successfully uploaded to the Document Center, this record, and associated with " + (associationsCount - 1) + " other records.";
					} else
					{
						message = "The document has been successfully uploaded to the Document Center and associated with " + associationsCount + " other records.";
					}
				}
			} else if (documentCount > 1)
			{
				if (associationsCount == 0)
				{
					message = "The documents have been successfully uploaded to the Document Center.";
				} else if (associationsCount == 1)
				{
					message = hasThisRecord ? "The documents have been successfully uploaded to the Document Center and associated with this record." : "The documents have been successfully uploaded to the Document Center and associated with 1 other record.";
				} else if (associationsCount > 1)
				{
					if (hasThisRecord)
					{
						message = associationsCount == 2 ? "The documents have been successfully uploaded to the Document Center, this record, and associated with 1 other record." : "The documents have been successfully uploaded to the Document Center, this record, and associated with " + (associationsCount - 1) + " other records.";
					} else
					{
						message = "The documents have been successfully uploaded to the Document Center and associated with " + associationsCount + " other records."
					}
				}
			};

			return tf.promiseBootbox.alert(message, title).then(function()
			{
				callback();
			});
		}
	};

	DocumentModalViewModel.prototype.selectedAssociations = function()
	{
		tf.modalManager.showModal(new TF.Modal.ManageAssociationsModalViewModel(this.obSelectedAssociations(), { documentCount: (this.documentId && this.documentId > 0) ? 1 : this.data().obEntityDataModel().documentEntities().length }))
			.then(function(result)
			{
				if (result)
				{
					this.obSelectedAssociations(result);
				}
			}.bind(this));
	}

	DocumentModalViewModel.prototype.dispose = function()
	{
		this.editDocumentViewModel.dispose();
	};

})();
